import { Redis } from "@upstash/redis";
import {
  DrizzleQuizRepository,
  DrizzleQuestionRepository,
  DrizzleAttemptRepository,
  type DrizzleDatabase,
} from "../database";
import {
  GeminiQuizGeneratorService,
  FileStorageService,
  RedisCacheService,
  UuidIdGenerator,
} from "../services";
import { getAuth, type Auth } from "../auth";
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
} from "../../application";
import type {
  IQuizRepository,
  IQuestionRepository,
  IAttemptRepository,
  IAIQuizGenerator,
  IFileStorageService,
  ICacheService,
  IIdGenerator,
} from "../../application";
import { getDatabase } from "../database/connection";

/**
 * Application Container Configuration
 */
export interface ContainerConfig {
  /** Base URL */
  baseUrl: string;
  /** Database URL */
  databaseUrl: string;
  /** Google AI API key */
  googleAiApiKey: string;
  /** Upstash Redis URL */
  redisUrl: string;
  /** Upstash Redis token */
  redisToken: string;
}

/**
 * Repositories available in the container
 */
export interface Repositories {
  quizRepository: IQuizRepository;
  questionRepository: IQuestionRepository;
  attemptRepository: IAttemptRepository;
}

/**
 * Services available in the container
 */
export interface Services {
  aiGenerator: IAIQuizGenerator;
  fileStorage: IFileStorageService;
  cache: ICacheService;
  idGenerator: IIdGenerator;
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
 * @param config Optional configuration overrides
 * @returns Fully configured application container
 */
export function createAppContainer(config: ContainerConfig): AppContainer {
  // Infrastructure - Database
  const database = getDatabase(config.databaseUrl);

  // Infrastructure - Redis
  const redis = new Redis({
    url: config.redisUrl,
    token: config.redisToken,
  });

  // Repositories (implementing ports)
  const quizRepository = new DrizzleQuizRepository(database);
  const questionRepository = new DrizzleQuestionRepository(database);
  const attemptRepository = new DrizzleAttemptRepository(database);

  // Services (implementing ports)
  const aiGenerator = new GeminiQuizGeneratorService(config.googleAiApiKey);
  const fileStorage = new FileStorageService(config.googleAiApiKey);
  const cache = new RedisCacheService({
    url: config.redisUrl,
    token: config.redisToken,
  });
  const idGenerator = new UuidIdGenerator();

  // Infrastructure - Auth
  const auth = getAuth({
    idGenerator,
    secret: process.env.BETTER_AUTH_SECRET!,
    baseURL: config.baseUrl,
    db: database,
    redis,
    googleClient: {
      id: process.env.GOOGLE_CLIENT_ID!,
      secret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    microsoftClient: {
      id: process.env.MICROSOFT_CLIENT_ID!,
      secret: process.env.MICROSOFT_CLIENT_SECRET!,
    },
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
  });

  const shareQuiz = new ShareQuizUseCase({ quizRepository });

  const deleteQuiz = new DeleteQuizUseCase({
    quizRepository,
    questionRepository,
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

  return {
    baseUrl: config.baseUrl,
    db: database,
    redis,
    auth,
    repositories: {
      quizRepository,
      questionRepository,
      attemptRepository,
    },
    services: {
      aiGenerator,
      fileStorage,
      cache,
      idGenerator,
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
    },
  };
}

/**
 * Singleton container instance
 */
let containerInstance: AppContainer | null = null;

/**
 * Gets or creates the singleton container instance
 */
export function getContainer(): AppContainer {
  if (!containerInstance) {
    containerInstance = createAppContainer({
      baseUrl: process.env.VITE_APP_URL!,
      databaseUrl: process.env.DATABASE_URL!,
      googleAiApiKey: process.env.GOOGLE_AI_API_KEY!,
      redisUrl: process.env.UPSTASH_REDIS_REST_URL!,
      redisToken: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
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
