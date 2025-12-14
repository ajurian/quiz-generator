import { Redis } from "@upstash/redis";
import {
  db,
  createDatabaseConnection,
  DrizzleQuizRepository,
  DrizzleQuestionRepository,
  type DrizzleDatabase,
} from "../database";
import {
  GeminiQuizGeneratorService,
  FileStorageService,
  RedisCacheService,
  UuidIdGenerator,
} from "../services";
import { createAuth, type Auth } from "../auth";
import {
  CreateQuizUseCase,
  GetUserQuizzesUseCase,
  GetQuizByIdUseCase,
  ShareQuizUseCase,
  DeleteQuizUseCase,
} from "../../application";
import type {
  IQuizRepository,
  IQuestionRepository,
  IAIQuizGenerator,
  IFileStorageService,
  ICacheService,
  IIdGenerator,
} from "../../application";

/**
 * Application Container Configuration
 */
export interface ContainerConfig {
  /** Custom database URL (optional, uses env var by default) */
  databaseUrl?: string;
  /** Custom Google AI API key (optional, uses env var by default) */
  googleAiApiKey?: string;
  /** Custom Upstash Redis URL (optional, uses env var by default) */
  redisUrl?: string;
  /** Custom Upstash Redis token (optional, uses env var by default) */
  redisToken?: string;
}

/**
 * Repositories available in the container
 */
export interface Repositories {
  quizRepository: IQuizRepository;
  questionRepository: IQuestionRepository;
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
}

/**
 * Application Container
 *
 * Provides dependency injection for the application.
 * All dependencies are lazily initialized when first accessed.
 */
export interface AppContainer {
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
export function createAppContainer(config: ContainerConfig = {}): AppContainer {
  // Infrastructure - Database
  const database = config.databaseUrl
    ? createDatabaseConnection(config.databaseUrl)
    : db;

  // Infrastructure - Redis
  const redis = new Redis({
    url: config.redisUrl ?? process.env.UPSTASH_REDIS_REST_URL!,
    token: config.redisToken ?? process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  // Infrastructure - Auth
  const auth = createAuth({ redis });

  // Repositories (implementing ports)
  const quizRepository = new DrizzleQuizRepository(database);
  const questionRepository = new DrizzleQuestionRepository(database);

  // Services (implementing ports)
  const aiGenerator = new GeminiQuizGeneratorService(config.googleAiApiKey);
  const fileStorage = new FileStorageService(config.googleAiApiKey);
  const cache = new RedisCacheService({
    url: config.redisUrl,
    token: config.redisToken,
  });
  const idGenerator = new UuidIdGenerator();

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

  return {
    db: database,
    redis,
    auth,
    repositories: {
      quizRepository,
      questionRepository,
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
    containerInstance = createAppContainer();
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
