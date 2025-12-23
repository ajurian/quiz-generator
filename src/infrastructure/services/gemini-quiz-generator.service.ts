import { createPartFromUri, GoogleGenAI, Type } from "@google/genai";
import type {
  IAIQuizGenerator,
  GenerateQuizParams,
  GeneratedQuestionData,
  FileMetadata,
} from "../../application";
import { GeminiModel, QuestionType, type OptionIndex } from "../../domain";

/**
 * Zod-like schema for structured output validation
 * Defines the expected JSON structure from Gemini API
 */
const questionSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      orderIndex: {
        type: Type.NUMBER,
        description: "The question's position in the quiz (0-based)",
      },
      type: {
        type: Type.STRING,
        enum: [
          QuestionType.DIRECT_QUESTION,
          QuestionType.TWO_STATEMENT_COMPOUND,
          QuestionType.CONTEXTUAL,
        ],
        description: "The MCQ variant type.",
      },
      stem: {
        type: Type.STRING,
        description: "The stem (prompt/lead-in) the learner answers.",
      },
      options: {
        type: Type.ARRAY,
        description: "Answer choices for this question.",
        items: {
          type: Type.OBJECT,
          properties: {
            index: {
              type: Type.STRING,
              enum: ["A", "B", "C", "D"],
              description: "Option letter (letter).",
            },
            text: {
              type: Type.STRING,
              description: "Option text shown to the learner.",
            },
            explanation: {
              type: Type.STRING,
              description:
                "Explanation for why this option is correct or incorrect",
            },
            isCorrect: {
              type: Type.BOOLEAN,
              description: "Whether this is the correct answer",
            },
          },
          required: ["index", "text", "explanation", "isCorrect"],
        },
      },
    },
    required: ["stem", "type", "options", "orderIndex"],
  },
};

/**
 * Error class for quota exceeded errors
 */
export class QuotaExceededError extends Error {
  constructor(model: GeminiModel) {
    super(`Quota exceeded for model: ${model}`);
    this.name = "QuotaExceededError";
  }
}

/**
 * Gemini AI Quiz Generator Service
 *
 * Implements the IAIQuizGenerator port using Google Gemini API.
 * Features automatic fallback from primary model to lite model on quota errors.
 */
export class GeminiQuizGeneratorService implements IAIQuizGenerator {
  private readonly client: GoogleGenAI;
  private readonly primaryModel = GeminiModel.FLASH_3_0;
  private readonly fallbackModel = GeminiModel.FLASH_2_5;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("fGOOGLE_AI_API_KEY environment variable is required");
    }
    this.client = new GoogleGenAI({ apiKey });
  }

  /**
   * Generates quiz questions from uploaded files using AI
   * Implements fallback logic: tries primary model first, falls back to lite on quota error
   */
  async generateQuestions(
    params: GenerateQuizParams
  ): Promise<GeneratedQuestionData[]> {
    try {
      return await this.generateWithModel(
        params.model ?? this.primaryModel,
        params
      );
    } catch (error) {
      if (this.isQuotaError(error)) {
        console.warn(
          `Quota exceeded for ${this.primaryModel}, falling back to ${this.fallbackModel}`
        );
        return await this.generateWithModel(this.fallbackModel, params);
      }
      throw error;
    }
  }

  /**
   * Validates if the specified model has available quota
   * Makes a minimal request to check availability
   */
  async validateQuota(model: GeminiModel): Promise<boolean> {
    try {
      const response = await this.client.models.generateContent({
        model,
        contents: "Hello",
        config: {
          maxOutputTokens: 1,
        },
      });
      return !!response;
    } catch (error) {
      if (this.isQuotaError(error)) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Generates questions using a specific model
   */
  private async generateWithModel(
    model: GeminiModel,
    params: GenerateQuizParams
  ): Promise<GeneratedQuestionData[]> {
    const { files, distribution } = params;

    const prompt = this.buildPrompt(distribution);
    const fileContents = files.map((file: FileMetadata) =>
      createPartFromUri(file.uri, file.mimeType)
    );

    const response = await this.client.models.generateContent({
      model,
      contents: [{ text: prompt }, ...fileContents],
      config: {
        responseMimeType: "application/json",
        responseSchema: questionSchema,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini API");
    }

    const parsed = JSON.parse(text) as GeneratedQuestionData[];
    return this.validateAndTransform(parsed);
  }

  /**
   * Builds the prompt for question generation
   */
  private buildPrompt(distribution: {
    directQuestion: number;
    twoStatementCompound: number;
    contextual: number;
  }): string {
    const totalQuestions =
      distribution.directQuestion +
      distribution.twoStatementCompound +
      distribution.contextual;

    const lazyNumbering = (start: number, count: number) => {
      return count > 1 ? `Q${start}-Q${start + count - 1}` : `Q${start}`;
    };

    const hasDirectQuestion = distribution.directQuestion > 0;
    const hasTwoStatementCompound = distribution.twoStatementCompound > 0;
    const hasContextual = distribution.contextual > 0;

    const directQuestionLazyNumber = lazyNumbering(
      1,
      distribution.directQuestion
    );
    const twoStatementCompoundLazyNumber = lazyNumbering(
      1 + distribution.directQuestion,
      distribution.twoStatementCompound
    );
    const contextualLazyNumber = lazyNumbering(
      1 + distribution.directQuestion + distribution.twoStatementCompound,
      distribution.contextual
    );

    const prompt = `
# YOUR ROLE
You are a **source-grounded MCQ item writer** and **post-answer feedback author**.

---

# YOUR TASK
Generate **${totalQuestions} multiple-choice questions** strictly from the provided HANDOUTS.

Each question must have:
- 4 options (A, B, C, D)
- Exactly 1 correct answer
- Explanations for all 4 options

---

# CRITICAL RULES (MUST FOLLOW)

## Source Grounding
- **MUST** use ONLY information in HANDOUTS
- **MUST** use original wording faithful to HANDOUTS
- **MUST NOT** invent facts, examples, definitions
- **MUST NOT** copy verbatim or closely paraphrase
- **MUST NOT** mention/cite/refer to HANDOUTS in stems/options/explanations

## Item Quality Standards
**Answer Key Balance:**
- Distribute correct answers roughly evenly across A, B, C, D
- Avoid obvious patterns (no long runs of same letter)

**Option Quality:**
- Keep options parallel in grammar, length, style
- Avoid giveaway words, mixed specificity, "odd one out"

---

# OUTPUT FORMAT: ${totalQuestions} Items
\`\`\`
${hasDirectQuestion ? `**${directQuestionLazyNumber}**: Direct Question (${distribution.directQuestion} items)${!hasTwoStatementCompound && !hasContextual ? "" : "\n"}` : ""}${
      hasTwoStatementCompound
        ? `**${twoStatementCompoundLazyNumber}**: Two-Statement Compound True/False (${distribution.twoStatementCompound} items)${!hasContextual ? "" : "\n"}`
        : ""
    }${
      hasContextual
        ? `**${contextualLazyNumber}**: Contextual (${distribution.contextual} items)`
        : ""
    }
\`\`\`

---

# EXPLANATION WRITING RULES

## Consistent Phrasing (CRITICAL)
**Use identical transition phrases across ALL explanations**
**Choose ONE phrase pattern and use it everywhere**

**Do NOT mix phrases like:**
- Q5 uses "You might consider..."
- Q12 uses "You might believe..."
- Q18 uses "If you think..."
- Q23 uses "This suggests you assume..."

**Apply to Two-Statement explanations:**
- Pick ONE phrase for "statement is true" scenarios
- Pick ONE phrase for "statement is false" scenarios
- Never vary these phrases across the 10 Two-Statement items

Example of GOOD consistency:
\`\`\`
Q21 Option A: "This option requires Statement 1 to be true..."
Q22 Option B: "This option requires Statement 1 to be false..."
Q23 Option C: "This option requires Statement 1 to be true..."
\`\`\`

Example of BAD inconsistency:
\`\`\`
Q21 Option A: "You might consider Statement 1..."
Q22 Option B: "You might believe Statement 1..."
Q23 Option C: "If you think Statement 1..."
\`\`\`

## Structure (Required for ALL explanations)
Every explanation paragraph MUST contain these 3 parts **IN ORDER**:

### If incorrect
1. **What the learner assumes**: "You are assuming {specific assumption behind the learner's selected option}.:
2. **When it would apply**: "Your assumption would only apply if {condition where assumption holds}."
3. **Why it doesn't apply here**: "But {explain the mismatch}, {conclusion}"
4. **Fix the idea**: "Use this rule instead {targetConcept rule in 1 concise sentence}."

### If correct
1. **Acknowledge correctness/Why it applies**: "You are correct because {stem clue details} implies {rule}..."
2. **Quick reinforcement**: "A quick check is {1-step verification cue}."

> Do NOT state "correct/incorrect/right/wrong" — the UI shows this

## Voice & Constraints
- Write in **second person** (you/your/you're)
- One paragraph per option (except Two-Statement: see below)
- Option-centric (address learner who chose that option)
- No cross-references between options ("Unlike B…", "Option C…")
- Each explanation must be independent

## Emphasis (Optional, Use Sparingly)
You MAY add emphasis for key terms:
- **Bold**: HANDOUT concepts/keywords (max 1-3 per paragraph)
- *Italics*: Short qualifiers (*only when*, *if and only if*)
- \`Code\`: Code-related text (variable names, operators, etc.)

**Do NOT:**
- Bold/italicize entire sentences
- Use emphasis to reveal correctness

---

# ITEM TYPE SPECIFICATIONS
${
  hasDirectQuestion
    ? `
## Direct Question (${directQuestionLazyNumber})
Standard MCQ with stem + 4 options.

---\n`
    : ""
}${
      hasTwoStatementCompound
        ? `
## Two-Statement Compound True/False (${twoStatementCompoundLazyNumber})

### Stem Format (EXACT)
Format each Two-Statement stem as:
\`\`\`
Statement 1: [declarative sentence]\\nStatement 2: [declarative sentence]
\`\`\`

- Use literal \`\\n\` character (newline) between statements
- Do NOT put them on separate lines in your JSON output
- The entire stem is ONE string value

**Correct JSON structure:**
\`\`\`
{
  "stem": "Statement 1: The Earth revolves around the Sun.\\nStatement 2: The Moon is a planet.",
  ...
}
\`\`\`


**Key rules:**
- Use literal \`\\n\` character (newline) between statements
- Do NOT put them on separate lines in your JSON output
- The entire stem is ONE string value


### Statement Requirements
- One declarative sentence, one main idea each
- Must be unequivocally T/F based on HANDOUTS
- Avoid vague wording, double negatives

### Options (FIXED TEXT — do not paraphrase)
\`\`\`
A) Only Statement 1 is true.
B) Only Statement 2 is true.
C) Both statements are true.
D) Neither statement is true.
\`\`\`

### Labels (STRICT)
Use: **Statement 1**, **Statement 2**  
Never use: "first/second statement", "former/latter", "Statement One/Two"

### Special Explanation Format (OVERRIDES generic)
For Two-Statement items ONLY, each option explanation must have **2 paragraphs**:
- **Paragraph 1:** About Statement 1 (follows 3-part structure)
- **Paragraph 2:** About Statement 2 (follows 3-part structure)

Additional constraints:
- Still second person
- Still no correctness labels
- No concluding "match" sentence (UI handles this)

---\n`
        : ""
    }${
      hasContextual
        ? `
## Contextual (${contextualLazyNumber})

### Requirements
- Scenario details (roles, numbers, constraints) MUST be from HANDOUTS
- Include ONLY details needed to answer
- Remove decorative backstory/names
- Provide all facts in stem
- Keep options short and homogeneous

---\n`
        : ""
    }
# FINAL VALIDATION CHECKLIST

Before submitting, verify:
- [ ] Exactly **${totalQuestions} items** (${distribution.directQuestion} Direct Question + ${distribution.twoStatementCompound} Two-Statement Compound + ${distribution.contextual} Contextual)
- [ ] Each item has exactly 4 options
- [ ] Each item has exactly 1 correct answer
- [ ] Answer keys balanced across A-D (no patterns)
- [ ] All explanations use second person
- [ ] All explanations follow 3-part structure
- [ ] Check that all explanations use the same transition language.
- [ ] Two-Statement explanations use 2-paragraph format
- [ ] No correctness labels in explanations
- [ ] No cross-references between options
- [ ] No references to HANDOUTS in stems, options, or explanations`;

    return prompt.trim();
  }

  /**
   * Validates and transforms the parsed response
   */
  private validateAndTransform(
    data: GeneratedQuestionData[]
  ): GeneratedQuestionData[] {
    return data.map((q: GeneratedQuestionData, index: number) => ({
      orderIndex: q.orderIndex ?? index,
      type: q.type as QuestionType,
      stem: q.stem,
      options: q.options.map(
        (opt: GeneratedQuestionData["options"][number]) => ({
          index: opt.index as OptionIndex,
          text: opt.text,
          explanation: opt.explanation,
          isCorrect: opt.isCorrect,
        })
      ),
    }));
  }

  /**
   * Checks if an error is a quota exceeded error
   */
  private isQuotaError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes("quota") ||
        message.includes("rate limit") ||
        message.includes("resource exhausted") ||
        message.includes("429")
      );
    }
    return false;
  }
}
