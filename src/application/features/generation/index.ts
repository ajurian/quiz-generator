// Generation feature - handles AI quiz generation workflow
// Note: Quiz generation logic has been moved to Upstash Workflow in presentation layer
// See: src/presentation/routes/api/generate-quiz/index.ts

// Policy
export { QuizGenerationPolicy, type ModelFallbackResult } from "./policy";
