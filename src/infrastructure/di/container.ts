import { Redis } from "@upstash/redis";
import {
  DrizzleQuizRepository,
  DrizzleQuestionRepository,
  DrizzleAttemptRepository,
  DrizzleSourceMaterialRepository,
  type DrizzleDatabase,
} from "../database";
import {
  GeminiQuizGeneratorService,
  FileStorageService,
  S3StorageService,
  RedisCacheService,
  UuidIdGenerator,
  RedisQuizGenerationEventPublisher,
  RedisQuizGenerationEventSubscriber,
} from "../services";
import { createAuth, type Auth } from "../auth";
import {
  CreateQuizUseCase,
  GetUserQuizzesUseCase,
  GetQuizByIdUseCase,
  ShareQuizUseCase,
  DeleteQuizUseCase,
  UpdateQuizVisibilityUseCase,
  StartAttemptUseCase,
  ForceStartAttemptUseCase,
  SubmitAttemptUseCase,
  GetUserAttemptsUseCase,
  GetAttemptDetailUseCase,
  AutosaveAnswerUseCase,
  ResetAttemptUseCase,
  GetUserAttemptHistoryUseCase,
  GetPresignedUploadUrlsUseCase,
} from "@/application";
import type {
  IQuizRepository,
  IQuestionRepository,
  IAttemptRepository,
  ISourceMaterialRepository,
  IAIQuizGenerator,
  IFileStorageService,
  IS3StorageService,
  ICacheService,
  IIdGenerator,
  IQuizGenerationEventPublisher,
  IQuizGenerationEventSubscriber,
} from "@/application";
import { getDatabase } from "../database/connection";
import { getRuntimeConfig, type RuntimeConfig } from "../config";

/**
 * Repositories available in the container
 */
export interface Repositories {
  quizRepository: IQuizRepository;
  questionRepository: IQuestionRepository;
  attemptRepository: IAttemptRepository;
  sourceMaterialRepository: ISourceMaterialRepository;
}

/**
 * Services available in the container
 */
export interface Services {
  aiGenerator: IAIQuizGenerator;
  fileStorage: IFileStorageService;
  s3Storage: IS3StorageService;
  cache: ICacheService;
  idGenerator: IIdGenerator;
  eventPublisher: IQuizGenerationEventPublisher;
  eventSubscriber: IQuizGenerationEventSubscriber;
}

/**
 * Use cases available in the container
 */
export interface UseCases {
  createQuiz: CreateQuizUseCase;
  getUserQuizzes: GetUserQuizzesUseCase;
  getQuizById: GetQuizByIdUseCase;
  shareQuiz: ShareQuizUseCase;
  deleteQuiz: DeleteQuizUseCase;
  updateQuizVisibility: UpdateQuizVisibilityUseCase;
  startAttempt: StartAttemptUseCase;
  forceStartAttempt: ForceStartAttemptUseCase;
  submitAttempt: SubmitAttemptUseCase;
  getUserAttempts: GetUserAttemptsUseCase;
  getAttemptDetail: GetAttemptDetailUseCase;
  autosaveAnswer: AutosaveAnswerUseCase;
  resetAttempt: ResetAttemptUseCase;
  getUserAttemptHistory: GetUserAttemptHistoryUseCase;
  getPresignedUploadUrls: GetPresignedUploadUrlsUseCase;
  // Note: Quiz generation use cases removed - now handled by Upstash Workflow
  // See: src/presentation/routes/api/generate-quiz/index.ts
}

/**
 * Application Container
 *
 * Provides dependency injection for the application.
 * All dependencies are lazily initialized when first accessed.
 */
export interface AppContainer {
  /** Base URL */
  baseUrl: string;
  /** Database instance */
  db: DrizzleDatabase;
  /** Redis client */
  redis: Redis;
  /** Auth instance */
  auth: Auth;
  /** Repository implementations */
  repositories: Repositories;
  /** Service implementations */
  services: Services;
  /** Use case implementations */
  useCases: UseCases;
}

/**
 * Creates the application dependency injection container
 *
 * This function wires up all dependencies following the Dependency Inversion Principle.
 * Inner layers (Domain, Application) depend on abstractions (interfaces).
 * Outer layers (Infrastructure) provide concrete implementations.
 *
 * @param config Runtime configuration (loaded from environment)
 * @returns Fully configured application container
 */
export function createAppContainer(config: RuntimeConfig): AppContainer {
  // Infrastructure - Database
  const database = getDatabase(config.database.url);

  // Infrastructure - Redis
  const redis = new Redis({
    url: config.redis.url,
    token: config.redis.token,
  });

  // Repositories (implementing ports)
  const quizRepository = new DrizzleQuizRepository(database);
  const questionRepository = new DrizzleQuestionRepository(database);
  const attemptRepository = new DrizzleAttemptRepository(database);
  const sourceMaterialRepository = new DrizzleSourceMaterialRepository(
    database
  );

  // Services (implementing ports)
  const aiGenerator = new GeminiQuizGeneratorService(config.googleAi.apiKey);
  const fileStorage = new FileStorageService(config.googleAi.apiKey);
  const idGenerator = new UuidIdGenerator();
  const s3Storage = new S3StorageService(
    {
      endpoint: config.s3.endpoint,
      accessKeyId: config.s3.accessKeyId,
      secretAccessKey: config.s3.secretAccessKey,
      bucketName: config.s3.bucketName,
    },
    idGenerator
  );
  const cache = new RedisCacheService({
    url: config.redis.url,
    token: config.redis.token,
  });

  // Event pub/sub for quiz generation events
  // Publisher also uses cache for event state recovery
  const eventPublisher = new RedisQuizGenerationEventPublisher(redis, cache);
  const eventSubscriber = new RedisQuizGenerationEventSubscriber(redis);

  // Infrastructure - Auth (receives all dependencies, no internal client creation)
  const auth = createAuth({
    idGenerator,
    secret: config.auth.secret,
    baseURL: config.baseUrl,
    db: database,
    redis,
    googleClient: config.oauth.google,
    microsoftClient: config.oauth.microsoft,
  });

  // Use Cases (Application layer - orchestrating domain logic)
  const createQuiz = new CreateQuizUseCase({
    quizRepository,
    questionRepository,
    aiGenerator,
    fileStorage,
    idGenerator,
  });

  const getUserQuizzes = new GetUserQuizzesUseCase({ quizRepository });

  const getQuizById = new GetQuizByIdUseCase({
    quizRepository,
    questionRepository,
    sourceMaterialRepository,
  });

  const shareQuiz = new ShareQuizUseCase({ quizRepository });

  const deleteQuiz = new DeleteQuizUseCase({
    quizRepository,
    questionRepository,
    sourceMaterialRepository,
    s3Storage,
  });

  const updateQuizVisibility = new UpdateQuizVisibilityUseCase({
    quizRepository,
  });

  const startAttempt = new StartAttemptUseCase({
    quizRepository,
    attemptRepository,
    idGenerator,
  });

  const forceStartAttempt = new ForceStartAttemptUseCase({
    quizRepository,
    attemptRepository,
    idGenerator,
  });

  const submitAttempt = new SubmitAttemptUseCase({
    attemptRepository,
  });

  const getUserAttempts = new GetUserAttemptsUseCase({
    quizRepository,
    attemptRepository,
  });

  const getAttemptDetail = new GetAttemptDetailUseCase({
    quizRepository,
    attemptRepository,
    questionRepository,
    sourceMaterialRepository,
  });

  const autosaveAnswer = new AutosaveAnswerUseCase({
    attemptRepository,
  });

  const resetAttempt = new ResetAttemptUseCase({
    attemptRepository,
  });

  const getUserAttemptHistory = new GetUserAttemptHistoryUseCase({
    quizRepository,
    attemptRepository,
  });

  const getPresignedUploadUrls = new GetPresignedUploadUrlsUseCase({
    s3Storage,
  });

  return {
    baseUrl: config.baseUrl,
    db: database,
    redis,
    auth,
    repositories: {
      quizRepository,
      questionRepository,
      attemptRepository,
      sourceMaterialRepository,
    },
    services: {
      aiGenerator,
      fileStorage,
      s3Storage,
      cache,
      idGenerator,
      eventPublisher,
      eventSubscriber,
    },
    useCases: {
      createQuiz,
      getUserQuizzes,
      getQuizById,
      shareQuiz,
      deleteQuiz,
      updateQuizVisibility,
      startAttempt,
      forceStartAttempt,
      submitAttempt,
      getUserAttempts,
      getAttemptDetail,
      autosaveAnswer,
      resetAttempt,
      getUserAttemptHistory,
      getPresignedUploadUrls,
    },
  };
}

/**
 * Singleton container instance
 *
 * For Node serverless (Lambda/Vercel), the container is cached as a singleton
 * across warm invocations. This is safe because:
 * - Upstash Redis uses HTTP (stateless, no TCP connection pooling issues)
 * - Neon uses HTTP driver in production (stateless)
 * - Config is immutable after process start
 *
 * The singleton pattern reduces cold start overhead by reusing initialized
 * clients across requests within the same Lambda/Vercel function instance.
 */
let containerInstance: AppContainer | null = null;

/**
 * Gets or creates the container instance (singleton for serverless)
 *
 * @param forceNew Force create a new container (useful for testing or when you need isolation)
 * @returns The application container
 */
export function getContainer(forceNew = false): AppContainer {
  if (forceNew || !containerInstance) {
    const config = getRuntimeConfig();
    containerInstance = createAppContainer(config);
  }
  return containerInstance;
}

/**
 * Sets a custom container instance (useful for testing)
 */
export function setContainer(container: AppContainer): void {
  containerInstance = container;
}

/**
 * Resets the container instance (useful for testing)
 */
export function resetContainer(): void {
  containerInstance = null;
}
