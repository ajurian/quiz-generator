# Quiz Generator

An AI-powered quiz generation platform built with Clean Architecture principles. Generate intelligent quizzes from PDF documents using Google Gemini AI, with support for multiple question types, collaborative sharing, and comprehensive attempt tracking.

## 🚀 Features

### Core Functionality
- **AI-Powered Quiz Generation**: Upload PDFs and generate quizzes automatically using Google Gemini AI (3.5 Flash, 3.1 Flash Lite)
- **Multiple Question Types**: Support for direct questions, two-statement compound questions, and contextual questions
- **Flexible Visibility Controls**: Private, unlisted, and public quiz sharing options
- **Real-time Generation**: Server-Sent Events (SSE) for live quiz generation progress with Redis pub/sub
- **Attempt Tracking**: Complete history of all quiz attempts with detailed analytics
- **Anonymous Attempts**: Support for unauthenticated users on public/unlisted quizzes
- **Auto-save**: Automatic saving of answers during quiz attempts
- **Smart Retry Logic**: Users can retake quizzes with full attempt history
- **PDF Viewing**: Built-in PDF viewer for reviewing source materials

### Technical Features
- **Clean Architecture**: Strict separation of concerns across Domain, Application, Infrastructure, and Presentation layers
- **Type-Safe**: Full TypeScript implementation with Zod v4 validation
- **Real-time Caching**: Redis-based caching with Upstash for session caching and event state recovery
- **S3-Compatible Storage**: Cloudflare R2 via S3-compatible API for file storage with presigned URLs
- **Authentication**: Better Auth with Google and Microsoft OAuth providers
- **Database**: PostgreSQL with Drizzle ORM via Neon HTTP driver (stateless)
- **Comprehensive Testing**: 80%+ test coverage with unit, integration, and E2E tests

## 🏗️ Architecture

This project follows **Clean Architecture** with strict adherence to the **Dependency Rule**: dependencies only point inward.

```
┌─────────────────────────────────────────────────────────┐
│                  Presentation Layer                     │
│   (TanStack Router, Components, Server Functions)       │
├─────────────────────────────────────────────────────────┤
│                  Infrastructure Layer                   │
│   (Drizzle, Better Auth, Gemini, Redis, S3)             │
├─────────────────────────────────────────────────────────┤
│                  Application Layer                      │
│   (Use Cases, DTOs, Ports/Interfaces)                   │
├─────────────────────────────────────────────────────────┤
│                    Domain Layer                         │
│   (Entities, Value Objects, Domain Services)            │
└─────────────────────────────────────────────────────────┘
```

### Entity Relationship Diagram

![Entity Relationship Diagram](docs/erd.png)

### Layer Responsibilities

#### Domain Layer (`src/domain/`)
- **Entities**: Quiz, Question, QuizAttempt, SourceMaterial
- **Value Objects**: QuestionOption, Slug
- **Enums**: QuestionType, QuizVisibility, QuizStatus, AttemptStatus, GeminiModel
- **Domain Services**: QuizDistributionService
- **Domain Events**: Quiz generation events (processing, completed, failed)
- **Zero external dependencies**

#### Application Layer (`src/application/`)
- **Features**: Organized by domain area (quiz, attempt, generation, files) — each containing use cases
- **DTOs**: Data transfer objects with Zod schemas (QuizDTO, AttemptDTO, QuestionDTO, PaginationDTO)
- **Ports**: Repository and service interfaces (IQuizRepository, IAIQuizGenerator, ICacheService, etc.)
- **Errors**: Application-level error types (ApplicationError, ValidationError, QuotaExceededError)
- **Completely framework-agnostic**

#### Infrastructure Layer (`src/infrastructure/`)
- **Repositories**: Drizzle ORM implementations (DrizzleQuizRepository, DrizzleQuestionRepository, DrizzleAttemptRepository, DrizzleSourceMaterialRepository)
- **Services**: Gemini AI quiz generator, Redis cache, S3 storage, file storage (Gemini Files API), UUID v7 ID generator, Redis event pub/sub
- **Auth**: Better Auth with Drizzle adapter, Google & Microsoft OAuth, Redis session caching
- **Database**: PostgreSQL schema definitions via Drizzle ORM, Neon HTTP driver
- **DI Container**: Composition root wiring all dependencies (repositories, services, use cases)
- **Config**: Centralized runtime configuration from environment variables

#### Presentation Layer (`src/presentation/`)
- **Routes**: TanStack Router with file-based routing and SSR
- **Components**: React components organized by feature (dashboard, quiz, attempt, manage, history, shared) with Radix UI
- **Server Functions**: TanStack Start server functions for data fetching and mutations
- **Queries**: TanStack Query options factories with centralized cache key management
- **Features**: Orchestration modules (quiz generation orchestrator, SSE event handler)
- **Hooks**: Custom React hooks (useQuizEvents for SSE, useIsMobile)
- **Lib**: Composition accessor (DI gateway), auth client, error message translation, redirect utilities

## 🛠️ Tech Stack

### Core Technologies
- **Runtime & Package Manager**: [Bun](https://bun.sh/) - Fast JavaScript runtime | Fast, disk space efficient package manager
- **Framework**: [React 19](https://react.dev/) + [TanStack Start](https://tanstack.com/start)
- **Language**: [TypeScript 5.9](https://www.typescriptlang.org/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Neon](https://neon.tech/) (HTTP driver)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Cache**: [Redis](https://redis.io/) via [Upstash](https://upstash.com/)
- **Storage**: [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) via S3-compatible API
- **AI**: [Google Gemini](https://ai.google.dev/gemini-api/docs) (3.5 Flash, 3.1 Flash Lite)

### Frontend
- **Router**: [TanStack Router](https://tanstack.com/router) with SSR
- **State**: [TanStack Query](https://tanstack.com/query) for server state
- **Forms**: [TanStack Form](https://tanstack.com/form)
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/)

### Backend & Infrastructure
- **Authentication**: [Better Auth](https://www.better-auth.com/) with Google & Microsoft OAuth
- **Validation**: [Zod v4](https://zod.dev/)
- **File Upload**: [React Dropzone](https://react-dropzone.js.org/)
- **PDF Viewing**: [PDF.js](https://mozilla.github.io/pdf.js/)
- **Background Processing**: [Vercel Functions](https://vercel.com/docs/functions) with `waitUntil`

### DevOps & Deployment
- **Build Tool**: [Vite 7](https://vitejs.dev/)
- **Server**: [Nitro](https://nitro.build/) with Vercel preset
- **Deployment**: [Vercel](https://vercel.com/) serverless
- **Migrations**: [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview)
- **Testing**: [Bun Test](https://bun.sh/docs/cli/test)

## 📦 Installation

### Prerequisites
- [Bun](https://bun.sh/) >= 1.3.3
- [PostgreSQL](https://www.postgresql.org/) database ([Neon](https://neon.tech/) recommended)
- [Redis](https://redis.io/) instance ([Upstash](https://upstash.com/) recommended)
- S3-compatible storage bucket ([Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) recommended)
- [Google Gemini API](https://ai.google.dev/) key

### Environment Variables

Create environment files for each environment:

**`.env.development`**
```bash
# Database
DATABASE_URL=postgresql://user:pass@host/db
MIGRATIONS_PATH=./migrations/development

# Vercel URL (used for base URL construction)
VERCEL_URL=localhost:3000

# Authentication
BETTER_AUTH_SECRET=your-secret-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Microsoft OAuth (optional)
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret

# Google Gemini AI
GOOGLE_AI_API_KEY=your-gemini-api-key

# S3-Compatible Storage (Cloudflare R2)
S3_ENDPOINT=https://your-account.r2.cloudflarestorage.com
S3_BUCKET_NAME=your-bucket-name
S3_ACCESS_KEY_ID=your-access-key-id
S3_SECRET_ACCESS_KEY=your-secret-access-key

# Upstash Redis
UPSTASH_REDIS_REST_URL=your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

Create similar files for `.env.staging`, `.env.production`, and `.env.test`.

> **Note**: Production requires `VERCEL_PROJECT_PRODUCTION_URL` (set automatically by Vercel). Staging/development use `VERCEL_URL`. Google OAuth is optional in staging. Microsoft OAuth is optional in all environments.

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd quiz-generator
```

2. **Install dependencies**
```bash
bun install
```

3. **Generate auth schema**
```bash
bun run auth:generate
```

4. **Generate and run database migrations**
```bash
# Generate migration files
bun run db:generate:dev

# Apply migrations to database
bun run db:migrate:dev
```

5. **Start development server**
```bash
bun run dev
```

The application will be available at `http://localhost:3000`.

## 🧪 Testing

### Run All Tests
```bash
bun test
```

### Run Specific Test Suites
```bash
# Domain layer tests
bun test src/__tests__/domain/

# Application layer tests
bun test src/__tests__/application/

# Infrastructure layer tests
bun test src/__tests__/infrastructure/
```

### Test Coverage
The project maintains 80%+ test coverage across all layers:
- **Domain Layer**: Pure unit tests, no mocks needed
- **Application Layer**: Use case tests with mocked repositories
- **Infrastructure Layer**: Integration tests with test database
- **Presentation Layer**: Component tests and E2E tests

## 📝 Database Migrations

### Development
```bash
# Generate migration from schema changes
bun run db:generate:dev

# Apply migrations to development database
bun run db:migrate:dev
```

### Staging
```bash
bun run db:generate:staging
bun run db:migrate:staging
```

### Production
```bash
bun run db:generate:prod
bun run db:migrate:prod
```

## 🚀 Deployment

### Vercel Deployment

The application deploys to Vercel using Nitro with the `vercel` preset.

1. **Build for production**
```bash
bun run build
```

2. **Deploy via Vercel CLI**
```bash
npx vercel
```

### Environment Variables on Vercel
Set all required environment variables in your Vercel project settings:
- `DATABASE_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_AI_API_KEY`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `S3_ENDPOINT`, `S3_BUCKET_NAME`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` (optional)

`VERCEL_URL` and `VERCEL_PROJECT_PRODUCTION_URL` are set automatically by Vercel.

## 📚 Project Structure

```
quiz-generator/
├── src/
│   ├── domain/              # Enterprise business rules
│   │   ├── entities/        # Quiz, Question, QuizAttempt, SourceMaterial
│   │   ├── value-objects/   # QuestionOption, Slug
│   │   ├── enums/           # QuestionType, QuizVisibility, QuizStatus, AttemptStatus, GeminiModel
│   │   ├── services/        # QuizDistributionService
│   │   └── events/          # Quiz generation events (processing/completed/failed)
│   │
│   ├── application/         # Application business rules
│   │   ├── features/        # Use cases organized by domain (quiz, attempt, generation, files)
│   │   ├── dtos/            # Data transfer objects (Quiz, Attempt, Question, Pagination)
│   │   ├── ports/           # Interface definitions (repositories, services)
│   │   ├── errors/          # Application errors
│   │   └── types/           # Shared application types
│   │
│   ├── infrastructure/      # Frameworks & drivers
│   │   ├── database/        # Drizzle schema, connection & repository implementations
│   │   ├── auth/            # Better Auth config with Drizzle adapter
│   │   ├── services/        # Gemini AI, Redis cache, S3 storage, event pub/sub
│   │   ├── di/              # Composition root (dependency injection container)
│   │   └── config/          # Runtime configuration from environment variables
│   │
│   ├── presentation/        # UI layer
│   │   ├── routes/          # TanStack Router pages + API routes (auth, SSE, PDF proxy)
│   │   ├── components/      # React components (dashboard, quiz, attempt, manage, history, shared, ui)
│   │   ├── features/        # Orchestration modules (quiz generation, SSE events)
│   │   ├── queries/         # TanStack Query options factories
│   │   ├── server-functions/# TanStack Start server functions
│   │   ├── hooks/           # Custom React hooks (useQuizEvents, useIsMobile)
│   │   └── lib/             # Composition accessor, auth client, error messages, utilities
│   │
│   ├── lib/                 # Shared utilities
│   └── __tests__/           # Test files mirror src structure
│
├── migrations/              # Database migrations per environment
│   ├── development/
│   ├── staging/
│   └── production/
│
├── public/                  # Static assets
│   └── pdfjs/              # PDF.js library for in-browser PDF viewing
│
├── docs/                    # Documentation
│   ├── FEATURES.md         # Feature specifications
│   └── NEW_FEATURES.md     # New feature requirements
│
├── .github/
│   └── copilot-instructions.md  # Development guidelines
│
├── drizzle.config.ts       # Drizzle ORM configuration
├── vite.config.ts          # Vite + Nitro build configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and scripts
```

## 🎯 Key Concepts

### Quiz Visibility
- **Private**: Only the owner can view and attempt
- **Unlisted**: Anyone with the link can access (not listed publicly)
- **Public**: Discoverable on the explore page

### URL Slug System
- Quiz slugs: 22-character base64url encoding of UUID v7
- Attempt slugs: 22-character base64url encoding of attempt UUID v7
- Non-guessable and URL-safe identifiers

### Routes
- `/quiz/new` - Create a new quiz
- `/quiz/a/{quiz_slug}` - Answer/attempt a quiz
- `/quiz/h/{quiz_slug}` - View attempt history for a quiz
- `/quiz/h/{quiz_slug}/{attempt_slug}` - Review specific attempt
- `/quiz/m/{quiz_slug}` - Manage quiz (creator only)
- `/dashboard` - User dashboard with created and taken quizzes
- `/explore` - Discover public quizzes
- `/api/auth/*` - Better Auth API endpoints
- `/api/quiz-events` - SSE endpoint for real-time quiz generation events
- `/api/pdf` - PDF proxy for cross-origin PDF viewing

### Question Types
1. **Direct Question**: Standard multiple-choice question
2. **Two-Statement Compound**: Question with two related statements
3. **Contextual**: Question with additional context/passage

### Real-time Quiz Generation
Quiz generation uses a fire-and-forget pattern with `waitUntil`:
1. Client submits quiz generation request
2. Server creates a quiz record with `GENERATING` status and returns immediately
3. Background processing uploads files to Gemini, generates questions via AI, and persists results
4. Progress events are published via Redis pub/sub and cached for state recovery
5. Client receives real-time updates via SSE (`/api/quiz-events`)

## 🙏 Acknowledgments

- Google Gemini for AI-powered quiz generation
- TanStack for excellent React libraries
- Drizzle Team for the amazing ORM
- Better Auth for authentication solution
- Radix UI for accessible components
- Neon for serverless PostgreSQL
- Upstash for serverless Redis
- Cloudflare R2 for object storage

---

**Built with ❤️ using Clean Architecture principles**
