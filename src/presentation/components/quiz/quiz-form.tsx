import { useState } from "react";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Separator } from "@/presentation/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/presentation/components/ui/select";
import {
  FileUploader,
  type UploadedFile,
} from "@/presentation/components/shared/file-uploader";
import { Sparkles, Loader2 } from "lucide-react";

export interface QuizFormData {
  title: string;
  files: File[];
  totalQuestions: number;
  distribution: {
    singleBestAnswer: number;
    twoStatements: number;
    contextual: number;
  };
}

interface QuizFormProps {
  onSubmit: (data: QuizFormData) => void;
  isSubmitting?: boolean;
  initialData?: Partial<QuizFormData>;
}

const QUESTION_PRESETS = [
  { label: "10 Questions", value: 10 },
  { label: "20 Questions", value: 20 },
  { label: "30 Questions", value: 30 },
  { label: "50 Questions", value: 50 },
];

export function QuizForm({
  onSubmit,
  isSubmitting = false,
  initialData,
}: QuizFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(
    initialData?.totalQuestions || 20
  );
  const [distribution, setDistribution] = useState(
    initialData?.distribution || {
      singleBestAnswer: 10,
      twoStatements: 5,
      contextual: 5,
    }
  );

  // Auto-balance distribution when total changes
  const handleTotalChange = (total: number) => {
    setTotalQuestions(total);
    const third = Math.floor(total / 3);
    const remainder = total - third * 3;
    setDistribution({
      singleBestAnswer: third + remainder,
      twoStatements: third,
      contextual: third,
    });
  };

  // Update individual distribution while keeping total
  const handleDistributionChange = (
    type: keyof typeof distribution,
    value: number
  ) => {
    const newDistribution = { ...distribution, [type]: value };
    const newTotal =
      newDistribution.singleBestAnswer +
      newDistribution.twoStatements +
      newDistribution.contextual;

    if (newTotal === totalQuestions) {
      setDistribution(newDistribution);
    } else {
      // Adjust other values proportionally
      const diff = totalQuestions - newTotal;
      const others = Object.keys(distribution).filter(
        (k) => k !== type
      ) as Array<keyof typeof distribution>;
      const adjustedDistribution = { ...newDistribution };
      adjustedDistribution[others[0]!] = Math.max(
        0,
        newDistribution[others[0]!] + Math.floor(diff / 2)
      );
      adjustedDistribution[others[1]!] = Math.max(
        0,
        totalQuestions -
          adjustedDistribution[type] -
          adjustedDistribution[others[0]!]
      );
      setDistribution(adjustedDistribution);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;
    if (files.length === 0) return;

    onSubmit({
      title: title.trim(),
      files: files.map((f) => f.file),
      totalQuestions,
      distribution,
    });
  };

  const distributionSum =
    distribution.singleBestAnswer +
    distribution.twoStatements +
    distribution.contextual;

  const isValid =
    title.trim().length > 0 &&
    files.length > 0 &&
    distributionSum === totalQuestions;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Quiz Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Quiz Title</Label>
        <Input
          id="title"
          placeholder="Enter quiz title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <Separator />

      {/* File Upload */}
      <div className="space-y-2">
        <Label>Study Materials</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Upload the documents you want to generate questions from
        </p>
        <FileUploader
          files={files}
          onFilesChange={setFiles}
          disabled={isSubmitting}
          maxFiles={12}
        />
      </div>

      <Separator />

      {/* Question Distribution */}
      <div className="space-y-4">
        <div>
          <Label>Question Configuration</Label>
          <p className="text-sm text-muted-foreground">
            Select the total number of questions and their distribution
          </p>
        </div>

        {/* Total Questions */}
        <div className="space-y-2">
          <Label htmlFor="total">Total Questions</Label>
          <Select
            value={totalQuestions.toString()}
            onValueChange={(v) => handleTotalChange(parseInt(v, 10))}
            disabled={isSubmitting}
          >
            <SelectTrigger id="total">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUESTION_PRESETS.map((preset) => (
                <SelectItem key={preset.value} value={preset.value.toString()}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Distribution Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sba" className="text-sm">
              Single Best Answer
            </Label>
            <Input
              id="sba"
              type="number"
              min={0}
              max={totalQuestions}
              value={distribution.singleBestAnswer}
              onChange={(e) =>
                handleDistributionChange(
                  "singleBestAnswer",
                  parseInt(e.target.value, 10) || 0
                )
              }
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ts" className="text-sm">
              Two Statements
            </Label>
            <Input
              id="ts"
              type="number"
              min={0}
              max={totalQuestions}
              value={distribution.twoStatements}
              onChange={(e) =>
                handleDistributionChange(
                  "twoStatements",
                  parseInt(e.target.value, 10) || 0
                )
              }
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sit" className="text-sm">
              Contextual
            </Label>
            <Input
              id="sit"
              type="number"
              min={0}
              max={totalQuestions}
              value={distribution.contextual}
              onChange={(e) =>
                handleDistributionChange(
                  "contextual",
                  parseInt(e.target.value, 10) || 0
                )
              }
              disabled={isSubmitting}
            />
          </div>
        </div>

        {distributionSum !== totalQuestions && (
          <p className="text-sm text-destructive">
            Distribution sum ({distributionSum}) must equal total questions (
            {totalQuestions})
          </p>
        )}
      </div>

      <Separator />

      {/* Submit */}
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={!isValid || isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Generating Quiz...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-5 w-5" />
            Generate Quiz with AI
          </>
        )}
      </Button>
    </form>
  );
}
