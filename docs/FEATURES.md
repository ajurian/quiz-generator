## AI-Based Quiz Generator - Clean Architecture Design

### System Overview

The AI-Based Quiz Generator is a full-stack application that allows users to create, manage, and share AI-generated quizzes using Google Gemini API. The system follows Clean Architecture principles with clear separation of concerns across four distinct layers.

***

## Layer 1: Domain Layer (Enterprise Business Rules)

The Domain layer contains enterprise-wide business logic and is completely independent of external concerns.

### Entities

#### Quiz Entity

```typescript
- id: string (UUID)
- userId: string
- title: string
- createdAt: Date
- updatedAt: Date
- isPublic: boolean
- questionDistribution: number (int32 bit-packed)
  * Bits 0-7: Single-Best Answer count (0-255)
  * Bits 8-15: Two Statements count (0-255)
  * Bits 16-23: Situational count (0-255)
- totalQuestions: number (computed property)
```


#### Question Entity

```typescript
- id: string (UUID)
- quizId: string (foreign key)
- questionText: string
- questionType: QuestionType (enum)
- options: QuestionOption[] (JSONB)
- orderIndex: number
```


#### QuestionOption Value Object

```typescript
- index: 'A' | 'B' | 'C' | 'D'
- text: string
- explanation: string
- isCorrect: boolean
```


### Enums

```typescript
enum QuestionType {
  SINGLE_BEST_ANSWER = 'single_best_answer',
  TWO_STATEMENTS = 'two_statements',
  SITUATIONAL = 'situational'
}

enum GeminiModel {
  FLASH_2_5 = 'gemini-2.5-flash',
  FLASH_2_5_LITE = 'gemini-2.5-flash-lite'
}
```


### Domain Services

#### QuizDistributionService

- `encodeDistribution(singleBest, twoStatements, situational): number`
- `decodeDistribution(encoded: number): QuizDistribution`
- `validateDistribution(distribution): boolean`

***

## Layer 2: Application Layer (Application Business Rules)

The Application layer contains use-case specific business logic and orchestrates data flow.

### Use Cases

#### Quiz Management Use Cases

- **CreateQuizUseCase**
    * Input: CreateQuizDTO (userId, title, files, questionDistribution)
    * Output: Quiz entity
    * Dependencies: IQuizRepository, IFileStorageService, IAIQuizGenerator
- **GetUserQuizzesUseCase**
    * Input: userId, pagination params
    * Output: Quiz[] with metadata
    * Dependencies: IQuizRepository
- **GetQuizByIdUseCase**
    * Input: quizId, userId (optional for public)
    * Output: Quiz with Questions
    * Dependencies: IQuizRepository
    * Validation: Check public access or ownership
- **ShareQuizUseCase**
    * Input: quizId, userId
    * Output: Public share link
    * Dependencies: IQuizRepository
    * Logic: Toggle isPublic flag, generate shareable link


#### Question Generation Use Cases

- **GenerateQuestionsUseCase**
    * Input: files, distribution, model preference
    * Output: Question[]
    * Dependencies: IAIQuizGenerator, IFileStorageService
    * Logic:
        - Upload files to storage
        - Generate questions via AI with quota management
        - Fallback from gemini-2.5-flash to gemini-2.5-flash-lite on quota exceeded


### Repository Interfaces (Ports)

```typescript
interface IQuizRepository {
  create(quiz: Quiz): Promise<Quiz>
  findById(id: string): Promise<Quiz | null>
  findByUserId(userId: string, pagination): Promise<Quiz[]>
  update(id: string, data: Partial<Quiz>): Promise<Quiz>
  delete(id: string): Promise<void>
}

interface IQuestionRepository {
  createBulk(questions: Question[]): Promise<Question[]>
  findByQuizId(quizId: string): Promise<Question[]>
}

interface IUserRepository {
  findById(id: string): Promise<User | null>
  // Managed by Better Auth
}
```


### Service Interfaces (Ports)

```typescript
interface IAIQuizGenerator {
  generateQuiz(params: GenerateQuizParams): Promise<Question[]>
  validateQuota(model: GeminiModel): Promise<boolean>
}

interface IFileStorageService {
  uploadFiles(files: File[]): Promise<FileMetadata[]>
  getFileUri(fileId: string): Promise<string>
}

interface ICacheService {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttl?: number): Promise<void>
  invalidate(pattern: string): Promise<void>
}
```


### DTOs (Data Transfer Objects)

```typescript
interface CreateQuizDTO {
  userId: string
  title: string
  files: File[]
  totalQuestions: number
  distribution: {
    singleBestAnswer: number
    twoStatements: number
    situational: number
  }
}

interface QuizResponseDTO {
  id: string
  title: string
  createdAt: string
  totalQuestions: number
  isPublic: boolean
  shareLink?: string
}
```


***

## Layer 3: Infrastructure Layer (Frameworks \& Drivers)

The Infrastructure layer contains implementations of interfaces defined in Application layer.

### Database Implementation (Drizzle ORM)

#### Schema Definitions

```typescript
// src/infrastructure/database/schema/quiz.schema.ts
export const quizzes = pgTable('quizzes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  questionDistribution: integer('question_distribution').notNull(),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

export const questions = pgTable('questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  quizId: uuid('quiz_id').notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  questionText: text('question_text').notNull(),
  questionType: text('question_type').notNull(),
  options: jsonb('options').$type<QuestionOption[]>().notNull(),
  orderIndex: integer('order_index').notNull()
})
```


#### Repository Implementations

```typescript
// src/infrastructure/repositories/drizzle-quiz.repository.ts
class DrizzleQuizRepository implements IQuizRepository {
  constructor(private db: DrizzleDB) {}
  
  async create(quiz: Quiz): Promise<Quiz> {
    // Implementation using Drizzle
  }
  // ... other methods
}
```


### External Services

#### Google Gemini AI Service

```typescript
// src/infrastructure/services/gemini-quiz-generator.service.ts
class GeminiQuizGeneratorService implements IAIQuizGenerator {
  private primaryModel = GeminiModel.FLASH_2_5
  private fallbackModel = GeminiModel.FLASH_2_5_LITE
  
  async generateQuiz(params: GenerateQuizParams): Promise<Question[]> {
    try {
      return await this.generateWithModel(this.primaryModel, params)
    } catch (error) {
      if (this.isQuotaError(error)) {
        return await this.generateWithModel(this.fallbackModel, params)
      }
      throw error
    }
  }
  
  private async generateWithModel(model: GeminiModel, params): Promise<Question[]> {
    // Implementation using @google/genai
    // Structured output with Zod schema validation
  }
}
```


#### File Storage Service

```typescript
// src/infrastructure/services/file-storage.service.ts
class FileStorageService implements IFileStorageService {
  // Implementation for file uploads (simply use google gemini's files api)
}
```


#### Redis Cache Service (Upstash)

```typescript
// src/infrastructure/cache/redis-cache.service.ts
class RedisCacheService implements ICacheService {
  constructor(private redis: Redis) {}
  
  async get<T>(key: string): Promise<T | null> {
    // Upstash Redis implementation
  }
  
  // Cache user sessions, quiz metadata, etc.
}
```


### Authentication (Better Auth)

```typescript
// src/infrastructure/auth/auth.config.ts
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    }
  },
  secondaryStorage: {
    // Upstash Redis for session caching
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
})
```


### Database Connection (Neon PostgreSQL)

```typescript
// src/infrastructure/database/connection.ts
import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import * as schema from './schema'

const client = new SQL(process.env.DATABASE_URL!);
export const db = drizzle({ client, schema });
```


***

## Layer 4: Presentation Layer (Interface Adapters)

The Presentation layer handles HTTP requests, UI components, and user interactions.

### API Routes (TanStack Start)

```typescript
// src/routes/api/quiz/create.ts
export const Route = createAPIRoute({
  POST: async ({ request }) => {
    const session = await getSession(request)
    if (!session) throw new UnauthorizedException()
    
    const body = await request.json()
    const dto = CreateQuizSchema.parse(body)
    
    const quiz = await createQuizUseCase.execute({
      ...dto,
      userId: session.user.id
    })
    
    return Response.json(quiz)
  }
})
```


### Route Definitions

```
/dashboard
  - GET: List user's quizzes (GetUserQuizzesUseCase)
  
/dashboard/quiz/new
  - POST: Create quiz (CreateQuizUseCase)
  
/dashboard/quiz/:id
  - GET: View quiz details (GetQuizByIdUseCase)
  
/quiz/:id/share
  - POST: Share quiz publicly (ShareQuizUseCase)
  
/quiz/:id/public
  - GET: View public quiz (no auth required)
```


### UI Components Structure

```
/components
  /quiz
    - QuizForm.tsx (file upload, distribution selector)
    - QuizList.tsx
    - QuizCard.tsx
    - QuestionList.tsx
    - QuestionCard.tsx
  /dashboard
    - DashboardLayout.tsx
    - StatsWidget.tsx
  /shared
    - FileUploader.tsx
    - ShareLinkGenerator.tsx
```


### State Management

- **TanStack Query** for server state (quiz data, user data)
- **TanStack Router** for URL state and navigation
- Local component state for form inputs

***

## Dependency Injection Setup

```typescript
// src/infrastructure/di/container.ts
export function createAppContainer() {
  // Infrastructure
  const db = createDatabaseConnection()
  const redis = createRedisClient()
  const geminiClient = createGeminiClient()
  
  // Repositories
  const quizRepository = new DrizzleQuizRepository(db)
  const questionRepository = new DrizzleQuestionRepository(db)
  
  // Services
  const aiGenerator = new GeminiQuizGeneratorService(geminiClient)
  const cacheService = new RedisCacheService(redis)
  const fileStorage = new FileStorageService()
  
  // Use Cases
  const createQuizUseCase = new CreateQuizUseCase(
    quizRepository,
    questionRepository,
    aiGenerator,
    fileStorage
  )
  
  return {
    useCases: {
      createQuizUseCase,
      // ... other use cases
    }
  }
}
```


***

## Data Flow Example: Creating a Quiz

1. **Presentation**: User submits quiz form → API route receives request
2. **Presentation**: Validates auth session, parses request body into DTO
3. **Application**: CreateQuizUseCase receives DTO
4. **Infrastructure**: FileStorageService uploads files
5. **Infrastructure**: GeminiQuizGeneratorService generates questions (with fallback)
6. **Domain**: Quiz entity created with encoded distribution
7. **Infrastructure**: QuizRepository persists to Neon PostgreSQL
8. **Infrastructure**: QuestionRepository bulk inserts questions
9. **Application**: Use case returns Quiz entity
10. **Presentation**: Transform to QuizResponseDTO, send JSON response

***

## Technology Stack Mapping by Layer

| Layer | Technologies |
| :-- | :-- |
| **Domain** | Pure TypeScript (no dependencies) |
| **Application** | TypeScript, Zod (validation) |
| **Infrastructure** | Drizzle ORM, Neon PostgreSQL, Upstash Redis, Better Auth, @google/genai, Bun |
| **Presentation** | TanStack Start/Router/Query, React components |


***

## Testing Strategy by Layer

### Domain Layer

- Pure unit tests
- Test entity methods, domain services
- No mocks required
- Test distribution encoding/decoding logic


### Application Layer

- Unit tests with mocked repositories
- Test use case orchestration
- Test error handling and validation
- Mock IAIQuizGenerator for deterministic tests


### Infrastructure Layer

- Integration tests with test database
- Test repository implementations
- Test AI service with mocked API responses
- Test cache behavior


### Presentation Layer

- Component tests (React Testing Library)
- E2E tests (Playwright) for critical flows:
    * User creates quiz → uploads files → generates questions
    * User shares quiz → non-authenticated user views

***

## Configuration Files

### Drizzle Config

```typescript
// drizzle.config.ts
export default defineConfig({
  schema: './src/infrastructure/database/schema',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!
  }
})
```


### Environment Variables

```
DATABASE_URL=
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=
GOOGLE_AI_API_KEY=
BETTER_AUTH_SECRET=
```
