# Quiz Generator

An AI-powered quiz generation platform built with Clean Architecture principles. Generate intelligent quizzes from PDF documents using Google Gemini AI, with support for multiple question types, collaborative sharing, and comprehensive attempt tracking.

## 🚀 Features

### Core Functionality
- **AI-Powered Quiz Generation**: Upload PDFs and generate quizzes automatically using Google Gemini 2.5 Flash
- **Multiple Question Types**: Support for direct questions, two-statement compound questions, and contextual questions
- **Flexible Visibility Controls**: Private, unlisted, and public quiz sharing options
- **Real-time Generation**: Stream quiz generation progress with live updates
- **Attempt Tracking**: Complete history of all quiz attempts with detailed analytics
- **Anonymous Attempts**: Support for unauthenticated users on public/unlisted quizzes
- **Auto-save**: Automatic saving of answers during quiz attempts
- **Smart Retry Logic**: Users can retake quizzes with full attempt history

### Technical Features
- **Clean Architecture**: Strict separation of concerns across Domain, Application, Infrastructure, and Presentation layers
- **Type-Safe**: Full TypeScript implementation with Zod validation
- **Real-time Caching**: Redis-based caching with Upstash
- **S3 Storage**: AWS S3 integration for file storage with presigned URLs
- **Authentication**: Better Auth with multiple providers
- **Database**: PostgreSQL with Drizzle ORM
- **Comprehensive Testing**: 80%+ test coverage with unit, integration, and E2E tests

## 🏗️ Architecture

This project follows **Clean Architecture** with strict adherence to the **Dependency Rule**: dependencies only point inward.

```
┌─────────────────────────────────────────────────────────┐
│                  Presentation Layer                      │
│   (React Router, Components, Server Functions)           │
├─────────────────────────────────────────────────────────┤
│                  Infrastructure Layer                    │
│   (Drizzle, Better Auth, Gemini, Redis, S3)             │
├─────────────────────────────────────────────────────────┤
│                  Application Layer                       │
│   (Use Cases, DTOs, Ports/Interfaces)                   │
├─────────────────────────────────────────────────────────┤
│                    Domain Layer                          │
│   (Entities, Value Objects, Domain Services)            │
└─────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

#### Domain Layer (`src/domain/`)
- **Entities**: Quiz, QuizAttempt, Question
- **Value Objects**: QuestionOption, Slug
- **Enums**: QuestionType, QuizVisibility, AttemptStatus
- **Domain Services**: QuizDistributionService
- **Domain Events**: Quiz generation events
- **Zero external dependencies**

#### Application Layer (`src/application/`)
- **Use Cases**: All business operations (CreateQuiz, SubmitAttempt, etc.)
- **DTOs**: Data transfer objects with Zod schemas
- **Ports**: Interfaces for repositories and services
- **Completely framework-agnostic**

#### Infrastructure Layer (`src/infrastructure/`)
- **Repositories**: Drizzle-based implementations
- **Services**: Gemini AI, Redis cache, S3 storage
- **Auth**: Better Auth configuration
- **Database**: Schema definitions and migrations
- **DI Container**: Dependency injection setup

#### Presentation Layer (`src/presentation/`)
- **Routes**: TanStack Router with file-based routing
- **Components**: React components with Radix UI
- **Server Functions**: Server-side data fetching
- **Queries**: TanStack Query hooks

## 🛠️ Tech Stack

### Core Technologies
- **Runtime**: [Bun](https://bun.sh/) - Fast JavaScript runtime
- **Framework**: [React 19](https://react.dev/) + [TanStack Start](https://tanstack.com/start)
- **Language**: [TypeScript 5.9](https://www.typescriptlang.org/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Neon](https://neon.tech/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Cache**: [Redis](https://redis.io/) via [Upstash](https://upstash.com/)
- **Storage**: [AWS S3](https://aws.amazon.com/s3/)
- **AI**: [Google Gemini 2.5 Flash](https://ai.google.dev/gemini-api/docs)

### Frontend
- **Router**: [TanStack Router](https://tanstack.com/router) with SSR
- **State**: [TanStack Query](https://tanstack.com/query) for server state
- **Forms**: [TanStack Form](https://tanstack.com/form)
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/)

### Backend & Infrastructure
- **Authentication**: [Better Auth](https://www.better-auth.com/)
- **Validation**: [Zod](https://zod.dev/)
- **File Upload**: [React Dropzone](https://react-dropzone.js.org/)
- **PDF Processing**: [PDF.js](https://mozilla.github.io/pdf.js/)
- **Background Jobs**: [Upstash Workflow](https://upstash.com/docs/workflow)

### DevOps & Deployment
- **Build Tool**: [Vite 7](https://vitejs.dev/)
- **Deployment**: [Vercel](https://vercel.com/) with Nitro
- **Migrations**: [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview)
- **Testing**: [Bun Test](https://bun.sh/docs/cli/test)

## 📦 Installation

### Prerequisites
- [Bun](https://bun.sh/) >= 1.3.3
- [PostgreSQL](https://www.postgresql.org/) database (Neon recommended)
- [Redis](https://redis.io/) instance (Upstash recommended)
- [AWS S3](https://aws.amazon.com/s3/) bucket
- [Google Gemini API](https://ai.google.dev/) key

### Environment Variables

Create environment files for each environment:

**`.env.development`**
```bash
# Database
DATABASE_URL=postgresql://user:pass@host/db
MIGRATIONS_PATH=./migrations/development

# Authentication
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-key

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# AWS S3
S3_REGION=us-east-1
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key

# Upstash Redis
UPSTASH_REDIS_REST_URL=your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Upstash Workflow (optional)
QSTASH_URL=your-qstash-url
QSTASH_TOKEN=your-qstash-token
```

Create similar files for `.env.staging`, `.env.production`, and `.env.test`.

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

# Push schema changes directly (without migration files)
bun run db:push
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

1. **Install Vercel CLI**
```bash
bun add -g vercel
```

2. **Build for production**
```bash
bun run build
```

3. **Deploy**
```bash
bun run deploy
```

### Environment Variables on Vercel
Make sure to set all environment variables in your Vercel project settings. The application uses Nitro with the Vercel preset for optimal serverless deployment.

## 📚 Project Structure

```
quiz-generator/
├── src/
│   ├── domain/              # Enterprise business rules
│   │   ├── entities/        # Quiz, Question, QuizAttempt
│   │   ├── value-objects/   # QuestionOption, Slug
│   │   ├── enums/           # QuestionType, QuizVisibility
│   │   ├── services/        # Domain services
│   │   └── events/          # Domain events
│   │
│   ├── application/         # Application business rules
│   │   ├── use-cases/       # Business operations
│   │   ├── dtos/            # Data transfer objects
│   │   ├── ports eurovision Interface definitions
│   │   └── errors/          # Application errors
│   │
│   ├── infrastructure/      # Frameworks & drivers
│   │   ├── database/        # Drizzle schema & repos
│   │   ├── auth/            # Better Auth config
│   │   ├── services/        # External service implementations
│   │   ├── di/              # Dependency injection
│   │   └── config/          # Configuration management
│   │
│   ├── presentation/        # UI layer
│   │   ├── routes/          # TanStack Router pages
│   │   ├── components/      # React components
│   │   ├── queries/         # TanStack Query hooks
│   │   ├── server-functions/# Server-side functions
│   │   └── hooks/           # Custom React hooks
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
│   └── pdfjs/              # PDF.js library
│
├── docs/                    # Documentation
│   ├── FEATURES.md         # Feature specifications
│   └── NEW_FEATURES.md     # New feature requirements
│
├── .github/
│   └── copilot-instructions.md  # Development guidelines
│
├── drizzle.config.ts       # Drizzle ORM configuration
├── vite.config.ts          # Vite build configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and scripts
```

## 🎯 Key Concepts

### Quiz Visibility
- **Private**: Only the owner can view and attempt
- **Unlisted**: Anyone with the link can access (not listed publicly)
- **Public**: Discoverable in app directories

### URL Slug System
- Quiz slugs: 22-character base64url encoding of UUID v7
- Attempt slugs: 22-character base64url encoding of attempt UUID v7
- Non-guessable and URL-safe identifiers

### Routes
- `/quiz/a/{quiz_slug}` - Answer/attempt a quiz
- `/quiz/h/{quiz_slug}` - View attempt history for a quiz
- `/quiz/h/{quiz_slug}/{attempt_slug}` - Review specific attempt
- `/quiz/m/{quiz_slug}` - Manage quiz (creator only)
- `/dashboard` - User dashboard with created and taken quizzes

### Question Types
1. **Direct Question**: Standard multiple-choice question
2. **Two-Statement Compound**: Question with two related statements
3. **Contextual**: Question with additional context/passage

## 🤝 Contributing

This project follows **Clean Architecture** and **SOLID principles**. Before contributing:

1. Read [`.github/copilot-instructions.md`](.github/copilot-instructions.md) for coding guidelines
2. Review [`docs/FEATURES.md`](docs/FEATURES.md) for system architecture
3. Ensure all tests pass: `bun test`
4. Follow the layer separation strictly:
   - Domain layer: No external dependencies
   - Application layer: No framework coupling
   - Infrastructure layer: Implements interfaces from Application
   - Presentation layer: Uses dependency injection

### Development Workflow
1. Create feature branch from `main`
2. Implement changes following Clean Architecture
3. Write tests (80%+ coverage required)
4. Run `bun run lint` to check types
5. Submit pull request with clear description

## 📄 License

[Add your license here]

## 🙏 Acknowledgments

- Google Gemini for AI-powered quiz generation
- TanStack for excellent React libraries
- Drizzle Team for the amazing ORM
- Better Auth for authentication solution
- Radix UI for accessible components

---

**Built with ❤️ using Clean Architecture principles**
