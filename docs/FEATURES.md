## AI-Based Quiz Generator - Clean Architecture Design

### System Overview

The AI-Based Quiz Generator is a full-stack application that allows users to create, manage, and share AI-generated quizzes using Google Gemini API. The system follows Clean Architecture principles with clear separation of concerns across four distinct layers.

***

## Layer 1: Domain Layer (Enterprise Business Rules)

The Domain layer contains enterprise-wide business logic and is completely independent of external concerns.

### Entities

#### Quiz Entity

```typescript
- id: string (UUID v7)
- slug: string (base64url of UUID, 22 chars, URL-safe)
- userId: string
- title: string
- createdAt: Date
- updatedAt: Date
- visibility: QuizVisibility (enum: private | unlisted | public)
- questionDistribution: number (int32 bit-packed)
  * Bits 0-7: Single-Answer count (0-255)
  * Bits 8-15: Two-Statement Compound count (0-255)
  * Bits 16-23: Contextual count (0-255)
- totalQuestions: number (computed property)

Access rules by visibility:
- PRIVATE: Only owner can view/attempt
- UNLISTED: Anyone with the link can view/attempt; not listed in public directories
- PUBLIC: Discoverable in app directories; anyone can view/attempt
```

#### QuizAttempt Entity

```typescript
- id: string (UUID v7)
- slug: string (base64url of UUID, 22 chars, URL-safe)
- quizId: string (foreign key)
- userId: string | null (null for anonymous attempts)
- status: AttemptStatus (enum: in_progress | submitted)
- score: number | null
- durationMs: number | null
- startedAt: Date
- submittedAt: Date | null

Every attempt is recorded and included in statistics.
Questions and answers can be previewed by creators at /quiz/m/{slug}.
```

#### Question Entity

```typescript
- id: string (UUID)
- quizId: string (foreign key)
- stem: string
- type: QuestionType (enum)
- options: QuestionOption[] (JSONB)
- orderIndex: number
```

### Value Objects

#### QuestionOption Value Object

```typescript
- index: 'A' | 'B' | 'C' | 'D'
- text: string
- explanation: string
- isCorrect: boolean
```

#### Slug Value Object

```typescript
- value: string (22 char base64url)

Methods:
- static fromString(slug: string): Slug
- static fromUuid(uuid: string): Slug
- toUuid(): string

Utility functions:
- uuidToSlug(uuid: string): string
- slugToUuid(slug: string): string
- isValidSlug(slug: string): boolean
```

### Enums

```typescript
enum QuestionType {
  DIRECT_QUESTION = 'direct_question',
  TWO_STATEMENT_COMPOUND = 'two_statement_compound',
  CONTEXTUAL = 'contextual'
}

enum GeminiModel {
  FLASH_2_5 = 'gemini-2.5-flash',
  FLASH_2_5_LITE = 'gemini-2.5-flash-lite'
}

enum QuizVisibility {
  PRIVATE = 'private',
  UNLISTED = 'unlisted',
  PUBLIC = 'public'
}

enum AttemptStatus {
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted'
}
```

### Domain Services

#### QuizDistributionService

- `encodeDistribution(directQuestion, twoStatements, contextual): number`
- `decodeDistribution(encoded: number): QuizDistribution`
- `validateDistribution(distribution): boolean`

***

## Layer 2: Application Layer (Application Business Rules)

The Application layer contains use-case specific business logic and orchestrates data flow.

### Use Cases

#### Quiz Management Use Cases

- **CreateQuizUseCase**
    * Input: CreateQuizDTO (userId, title, files, questionDistribution, visibility?)
    * Output: Quiz entity with generated slug
    * Dependencies: IQuizRepository, IFileStorageService, IAIQuizGenerator, IIdGenerator

- **GetUserQuizzesUseCase**
    * Input: userId, pagination params
    * Output: Quiz[] with metadata
    * Dependencies: IQuizRepository

- **GetQuizByIdUseCase**
    * Input: quizId OR quizSlug, userId (optional for public/unlisted)
    * Output: Quiz with Questions, isOwner flag
    * Dependencies: IQuizRepository, IQuestionRepository
    * Access control: Enforces visibility rules, returns 404 for private to non-owners

- **ShareQuizUseCase**
    * Input: quizId, userId, visibility? (defaults to UNLISTED)
    * Output: Quiz with share link using slug
    * Dependencies: IQuizRepository
    * Logic: Sets visibility, generates /quiz/a/{slug} link

- **UpdateQuizVisibilityUseCase**
    * Input: quizId, userId, visibility
    * Output: Updated Quiz with message
    * Dependencies: IQuizRepository
    * Logic: Changes visibility with appropriate user feedback

- **DeleteQuizUseCase**
    * Input: quizId, userId
    * Output: void
    * Dependencies: IQuizRepository

#### Attempt Management Use Cases

- **StartAttemptUseCase**
    * Input: quizSlug, userId (nullable)
    * Output: Attempt, isNewAttempt flag, existingAttemptSummary?
    * Dependencies: IQuizRepository, IAttemptRepository, IIdGenerator
    * Logic:
        - Checks access via visibility rules
        - Returns in-progress attempt if exists
        - Returns existing attempt summary if user has prior attempts
        - Creates new attempt with generated slug

- **ForceStartAttemptUseCase**
    * Input: quizSlug, userId (nullable)
    * Output: New Attempt
    * Dependencies: IQuizRepository, IAttemptRepository, IIdGenerator
    * Logic: Creates new attempt bypassing "already completed" check

- **SubmitAttemptUseCase**
    * Input: attemptId, userId, score
    * Output: Submitted Attempt
    * Dependencies: IAttemptRepository
    * Logic: Validates ownership, calculates duration, sets status to SUBMITTED

- **GetUserAttemptsUseCase**
    * Input: quizSlug, userId
    * Output: Quiz, Attempts[], Summary (total, best score, average)
    * Dependencies: IQuizRepository, IAttemptRepository
    * Route: /quiz/h/{quiz_slug}

- **GetAttemptDetailUseCase**
    * Input: quizSlug, attemptSlug, userId
    * Output: Quiz, Attempt, Questions, isOwner flag
    * Dependencies: IQuizRepository, IAttemptRepository, IQuestionRepository
    * Route: /quiz/h/{quiz_slug}/{attempt_slug}

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
  findBySlug(slug: string): Promise<Quiz | null>
  findByUserId(userId: string, pagination): Promise<PaginatedResult<Quiz>>
  findPublic(pagination): Promise<PaginatedResult<Quiz>>
  update(quiz: Quiz): Promise<Quiz>
  delete(id: string): Promise<void>
  exists(id: string): Promise<boolean>
  slugExists(slug: string): Promise<boolean>
}

interface IAttemptRepository {
  create(attempt: QuizAttempt): Promise<QuizAttempt>
  findById(id: string): Promise<QuizAttempt | null>
  findBySlug(slug: string): Promise<QuizAttempt | null>
  findByQuizAndUser(quizId: string, userId: string): Promise<QuizAttempt[]>
  findByQuizId(quizId: string, pagination): Promise<PaginatedResult<QuizAttempt>>
  findByUserId(userId: string, pagination): Promise<PaginatedResult<QuizAttempt>>
  findLastAttemptByQuizAndUser(quizId: string, userId: string): Promise<QuizAttempt | null>
  findInProgressByQuizAndUser(quizId: string, userId: string): Promise<QuizAttempt | null>
  countByQuizAndUser(quizId: string, userId: string): Promise<number>
  update(attempt: QuizAttempt): Promise<QuizAttempt>
  delete(id: string): Promise<void>
  exists(id: string): Promise<boolean>
}

interface IQuestionRepository {
  createBulk(questions: Question[]): Promise<Question[]>
  findByQuizId(quizId: string): Promise<Question[]>
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

interface IIdGenerator {
  generate(): string  // Generates UUID v7
}
```

### DTOs (Data Transfer Objects)

```typescript
interface CreateQuizDTO {
  userId: string
  title: string
  files: File[]
  totalQuestions: number
  visibility?: QuizVisibility  // defaults to PRIVATE
  distribution: {
    directQuestion: number
    twoStatementCompound: number
    contextual: number
  }
}

interface QuizResponseDTO {
  id: string
  slug: string
  title: string
  createdAt: string
  updatedAt: string
  totalQuestions: number
  visibility: QuizVisibility
  shareLink?: string  // Generated for unlisted/public quizzes
  distribution: QuizDistribution
}

interface AttemptResponseDTO {
  id: string
  slug: string
  quizId: string
  userId: string | null
  status: AttemptStatus
  score: number | null
  durationMs: number | null
  formattedDuration: string | null  // e.g., "5m 30s"
  startedAt: string
  submittedAt: string | null
}

interface AttemptSummaryDTO {
  totalAttempts: number
  lastAttempt: AttemptResponseDTO | null
  bestScore: number | null
  averageScore: number | null
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
  slug: varchar('slug', { length: 22 }).notNull().unique(),
  userId: uuid('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  questionDistribution: integer('question_distribution').notNull(),
  visibility: varchar('visibility', { length: 20 }).notNull().default('private'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

export const questions = pgTable('questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  quizId: uuid('quiz_id').notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  orderIndex: integer('order_index').notNull()
  type: text('question_type').notNull(),
  stem: text('question_text').notNull(),
  options: jsonb('options').$type<QuestionOption[]>().notNull(),
})

export const quizAttempts = pgTable('quiz_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 22 }).notNull().unique(),
  quizId: uuid('quiz_id').notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id),  // nullable for anonymous
  status: varchar('status', { length: 20 }).notNull().default('in_progress'),
  score: real('score'),
  durationMs: integer('duration_ms'),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  submittedAt: timestamp('submitted_at')
}, (table) => ({
  quizUserIdx: index('quiz_user_idx').on(table.quizId, table.userId),
  quizUserSubmittedIdx: index('quiz_user_submitted_idx').on(table.quizId, table.userId, table.submittedAt.desc())
}))
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
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!
    }
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

Routes are organized by role with clear affordances:

```
# Dashboard
/dashboard
  - GET: List user's quizzes (GetUserQuizzesUseCase)
  
/dashboard/quiz/new
  - POST: Create quiz (CreateQuizUseCase)

# Answer Flow (Taking a quiz)
/quiz/a/{quiz_slug}
  - GET: Start/resume attempt flow (StartAttemptUseCase)
  - Shows "already completed" screen if user has prior attempts
  - POST: Force start new attempt (ForceStartAttemptUseCase)

# History (Viewing attempts)
/quiz/h/{quiz_slug}
  - GET: User's attempt list for quiz (GetUserAttemptsUseCase)

/quiz/h/{quiz_slug}/{attempt_slug}
  - GET: Review specific attempt (GetAttemptDetailUseCase)

# Creator Management
/quiz/m/{quiz_slug}
  - GET: Creator management view (GetQuizByIdUseCase with ownership check)
  - Visibility controls, share link, correct answers preview
  - PUT: Update visibility (UpdateQuizVisibilityUseCase)

# Attempt Submission
/quiz/attempt/{attempt_id}/submit
  - POST: Submit attempt (SubmitAttemptUseCase)

# API endpoints for visibility and sharing
/api/quiz/{quiz_id}/visibility
  - PUT: Update visibility (UpdateQuizVisibilityUseCase)

/api/quiz/{quiz_id}/share
  - POST: Generate share link (ShareQuizUseCase)
```

### Authorization Rules

- **PRIVATE**: Only owner can access all routes; return 404 to non-owners (no existence leak)
- **UNLISTED**: Anyone with link can access /quiz/a/{slug}
- **PUBLIC**: Same as unlisted, plus discoverable in directories
- **Creator routes** (/quiz/m/*): Only owner can access; return 404 to non-owners


### UI Components Structure

```
/components
  /quiz
    - QuizForm.tsx (file upload, distribution selector)
    - QuizList.tsx
    - QuizCard.tsx (with visibility badge, slug-based links)
    - QuestionList.tsx
    - QuestionCard.tsx
    - VisibilitySelector.tsx
    - ShareLinkCopier.tsx
  /attempt
    - AttemptForm.tsx (taking quiz)
    - AttemptSummary.tsx (score, duration display)
    - AttemptHistory.tsx (list of user's attempts)
    - AttemptReview.tsx (reviewing submitted attempt)
    - AlreadyCompletedScreen.tsx (shows prior attempt summary with CTAs)
  /dashboard
    - DashboardLayout.tsx
    - CreatedQuizzes.tsx (owner view with management CTAs)
    - TakenQuizzes.tsx (attempts view with retake CTAs)
    - StatsWidget.tsx
  /shared
    - FileUploader.tsx
```

### Dashboard Sections and Card CTAs

#### "Created" Section
- Shows quizzes where ownerId = current user
- Card click → `/quiz/m/{quiz_slug}` (management view)
- Primary CTA: "Take" (starts real attempt)
- Secondary CTA: "Share" (dialog prompt)

#### "Taken" Section
- Shows quizzes the user has attempted (including own)
- Card click → `/quiz/h/{quiz_slug}/{last_attempt_slug}` (review last)
- Primary CTA: "Retake" (starts new attempt immediately)
- Secondary CTA: "View all attempts"


### State Management

- **TanStack Query** for server state (quiz data, user data, attempts)
- **TanStack Router** for URL state and navigation (slug-based routing)
- Local component state for form inputs

***

## Attempt UX Flow

### On `/quiz/a/{quiz_slug}`:

1. **If 0 attempts by current user**: Start a new attempt immediately

2. **If ≥1 attempts by current user**: Show "You already completed this quiz" with:
   - Last attempt summary (score, date, time spent)
   - Three CTAs (left to right):
     - "View all attempts" → `/quiz/h/{quiz_slug}`
     - "Review last attempt" → `/quiz/h/{quiz_slug}/{last_attempt_slug}`
     - "Try again" (primary) → Starts new attempt immediately

### Creator Behaviors:

- Creators can view questions and correct answers at `/quiz/m/{quiz_slug}` without taking the quiz
- Creators may also take their own quiz (recorded as a normal attempt)

- On `/quiz/m/{quiz_slug}`:
  - Visibility selector: private/unlisted/public (persists immediately)
  - Share link copy (uses `/quiz/a/{quiz_slug}` URL)
  - Correct answers/rationales view (read-only preview)
  - Buttons: Primary "Take" (real attempt), Secondary "Share"

***

## Identifiers and Slugs

- **Quiz.id**: UUID v7 (internal, used for DB joins)
- **Quiz.slug**: base64url of raw 16-byte UUID (22 chars, no padding, URL-safe, deterministic)
- **Attempt.id**: UUID v7 (internal)
- **Attempt.slug**: base64url derived from Attempt.id (22 chars)

### Slug Characteristics:
- Deterministic: Same UUID always produces same slug
- Compact: 22 characters vs 36 for UUID string
- URL-safe: Uses A-Z, a-z, 0-9, -, _ (no special encoding needed)
- Non-guessable: Derived from UUID v7 which has timestamp + random components
- Persisted: Both id and slug stored; never regenerated

### Conversion:
```typescript
uuidToSlug("019326f1-3b4d-7e8a-9012-345678abcdef") 
// Returns: "ATJm8TtNfopAEjRWeCvN7w"

slugToUuid("ATJm8TtNfopAEjRWeCvN7w")
// Returns: "019326f1-3b4d-7e8a-9012-345678abcdef"
```

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
  const attemptRepository = new DrizzleAttemptRepository(db)
  
  // Services
  const aiGenerator = new GeminiQuizGeneratorService(geminiClient)
  const cacheService = new RedisCacheService(redis)
  const fileStorage = new FileStorageService()
  const idGenerator = new UuidIdGenerator()
  
  // Use Cases
  const createQuizUseCase = new CreateQuizUseCase({
    quizRepository,
    questionRepository,
    aiGenerator,
    fileStorage,
    idGenerator
  })
  
  const startAttemptUseCase = new StartAttemptUseCase({
    quizRepository,
    attemptRepository,
    idGenerator
  })
  
  const submitAttemptUseCase = new SubmitAttemptUseCase({
    attemptRepository
  })
  
  return {
    useCases: {
      createQuizUseCase,
      getQuizByIdUseCase,
      getUserQuizzesUseCase,
      shareQuizUseCase,
      updateQuizVisibilityUseCase,
      deleteQuizUseCase,
      startAttemptUseCase,
      forceStartAttemptUseCase,
      submitAttemptUseCase,
      getUserAttemptsUseCase,
      getAttemptDetailUseCase,
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
6. **Domain**: Quiz entity created with encoded distribution and generated slug
7. **Infrastructure**: QuizRepository persists to Neon PostgreSQL
8. **Infrastructure**: QuestionRepository bulk inserts questions
9. **Application**: Use case returns Quiz entity
10. **Presentation**: Transform to QuizResponseDTO (with slug), send JSON response

## Data Flow Example: Taking a Quiz

1. **Presentation**: User navigates to `/quiz/a/{quiz_slug}`
2. **Application**: StartAttemptUseCase receives quiz slug
3. **Infrastructure**: QuizRepository.findBySlug loads quiz
4. **Domain**: Quiz entity checks visibility for access control
5. **Infrastructure**: AttemptRepository checks for existing attempts
6. **Application**: Returns existing attempt summary or creates new attempt
7. **Domain**: QuizAttempt entity created with generated slug
8. **Presentation**: Redirects to attempt view or shows "already completed" screen

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
- Test slug conversion functions (uuidToSlug, slugToUuid)
- Test visibility access rules
- Test attempt status transitions

### Application Layer

- Unit tests with mocked repositories
- Test use case orchestration
- Test error handling and validation
- Mock IAIQuizGenerator for deterministic tests
- Test access control logic for different visibility states
- Test attempt flow logic (start, submit, history)


### Infrastructure Layer

- Integration tests with test database
- Test repository implementations
- Test AI service with mocked API responses
- Test cache behavior
- Test slug uniqueness constraints


### Presentation Layer

- Component tests (React Testing Library)
- E2E tests (Playwright) for critical flows:
    * User creates quiz → uploads files → generates questions
    * User shares quiz → non-authenticated user views
    * User takes quiz → submits → views attempt history
    * Creator changes visibility → share link works/doesn't work

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
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
GOOGLE_AI_API_KEY=
BETTER_AUTH_SECRET=
```
