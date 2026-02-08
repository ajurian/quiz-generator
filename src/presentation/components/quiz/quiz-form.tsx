import React from "react";
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
import { Sparkles, Loader2, Lock, LockOpen } from "lucide-react";
import { QuizDistribution, QuizVisibility } from "@/domain";

export interface QuizFormData {
  title: string;
  files: File[];
  totalQuestions: number;
  distribution: QuizDistribution;
  visibility: QuizVisibility;
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
  const [title, setTitle] = React.useState(initialData?.title || "");
  const [files, setFiles] = React.useState<UploadedFile[]>([]);
  const [totalQuestions, setTotalQuestions] = React.useState(
    initialData?.totalQuestions || 20,
  );
  const [distribution, setDistribution] = React.useState<QuizDistribution>(
    initialData?.distribution || {
      directQuestion: 10,
      twoStatementCompound: 5,
      contextual: 5,
    },
  );
  const [visibility, setVisibility] = React.useState<QuizVisibility>(
    initialData?.visibility || QuizVisibility.PRIVATE,
  );
  const [lockedFields, setLockedFields] = React.useState<
    Set<keyof QuizDistribution>
  >(new Set());

  const distributionKeys: Array<keyof QuizDistribution> = [
    "directQuestion",
    "twoStatementCompound",
    "contextual",
  ];

  const toggleLock = (field: keyof QuizDistribution) => {
    setLockedFields((prev) => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        // Prevent locking all three — at least one must stay unlocked
        const unlockedCount = distributionKeys.filter(
          (k) => !prev.has(k),
        ).length;
        if (unlockedCount <= 1) return prev;
        next.add(field);
      }
      return next;
    });
  };

  // Auto-balance distribution when total changes
  const handleTotalChange = (total: number) => {
    setTotalQuestions(total);

    const unlocked = distributionKeys.filter((k) => !lockedFields.has(k));
    const lockedSum = distributionKeys
      .filter((k) => lockedFields.has(k))
      .reduce((sum, k) => sum + distribution[k], 0);

    // If locked values already exceed the new total, reset locks and balance evenly
    if (lockedSum >= total || unlocked.length === 0) {
      setLockedFields(new Set());
      const third = Math.floor(total / 3);
      const remainder = total - third * 3;
      setDistribution({
        directQuestion: third + remainder,
        twoStatementCompound: third,
        contextual: third,
      });
      return;
    }

    const budget = total - lockedSum;
    const share = Math.floor(budget / unlocked.length);
    let leftover = budget - share * unlocked.length;

    const newDistribution = { ...distribution };
    for (const key of unlocked) {
      newDistribution[key] = share + (leftover > 0 ? 1 : 0);
      if (leftover > 0) leftover--;
    }
    setDistribution(newDistribution);
  };

  // Update individual distribution while keeping total
  const handleDistributionChange = (
    type: keyof QuizDistribution,
    value: number,
  ) => {
    const newDistribution = { ...distribution, [type]: value };
    const newTotal =
      newDistribution.directQuestion +
      newDistribution.twoStatementCompound +
      newDistribution.contextual;

    if (newTotal === totalQuestions) {
      setDistribution(newDistribution);
      return;
    }

    // Only adjust unlocked fields (excluding the one being changed)
    const adjustable = distributionKeys.filter(
      (k) => k !== type && !lockedFields.has(k),
    );

    if (adjustable.length === 0) {
      // No fields to adjust — just set and let validation show the mismatch
      setDistribution(newDistribution);
      return;
    }

    const diff = totalQuestions - newTotal;

    if (adjustable.length === 1) {
      // Single adjustable field takes the entire difference
      newDistribution[adjustable[0]!] = Math.max(
        0,
        newDistribution[adjustable[0]!] + diff,
      );
    } else {
      // Distribute difference across adjustable fields
      newDistribution[adjustable[0]!] = Math.max(
        0,
        newDistribution[adjustable[0]!] + Math.floor(diff / adjustable.length),
      );
      // Last adjustable field absorbs the remainder to guarantee the total
      newDistribution[adjustable[1]!] = Math.max(
        0,
        totalQuestions -
          distributionKeys
            .filter((k) => k !== adjustable[1])
            .reduce((sum, k) => sum + newDistribution[k], 0),
      );
    }

    setDistribution(newDistribution);
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
      visibility,
    });
  };

  const distributionSum =
    distribution.directQuestion +
    distribution.twoStatementCompound +
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
          maxFiles={20}
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
              {(() => {
                const preset = QUESTION_PRESETS.find(
                  (p) => p.value === totalQuestions,
                );

                // Fix the SSR issue below by immediately returning the correct label if found
                if (preset) {
                  return (
                    <SelectValue placeholder="Select total questions">
                      {preset.label}
                    </SelectValue>
                  );
                }

                // SSR not working - label is not showing on initial render
                return <SelectValue placeholder="Select total questions" />;
              })()}
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
          {(
            [
              {
                key: "directQuestion" as const,
                label: "Direct Question",
                id: "directQuestion",
              },
              {
                key: "twoStatementCompound" as const,
                label: "Two-Statement Compound",
                id: "ts",
              },
              {
                key: "contextual" as const,
                label: "Contextual",
                id: "sit",
              },
            ] as const
          ).map(({ key, label, id }) => {
            const isLocked = lockedFields.has(key);
            const unlockedCount = distributionKeys.filter(
              (k) => !lockedFields.has(k),
            ).length;
            // Disable locking if this is the last unlocked field
            const canToggleLock = isLocked || unlockedCount > 1;
            // The sole unlocked field is fully determined by the total minus locked values
            const isSoleUnlocked = !isLocked && unlockedCount === 1;

            return (
              <div key={key} className="space-y-2">
                <Label htmlFor={id} className="text-sm">
                  {label}
                </Label>
                <div className="flex gap-1">
                  <Input
                    id={id}
                    type="number"
                    min={0}
                    max={totalQuestions}
                    value={distribution[key]}
                    onChange={(e) =>
                      handleDistributionChange(
                        key,
                        parseInt(e.target.value, 10) || 0,
                      )
                    }
                    disabled={isSubmitting || isLocked || isSoleUnlocked}
                    className={
                      isLocked || isSoleUnlocked ? "opacity-60 bg-muted" : ""
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    disabled={isSubmitting || !canToggleLock}
                    onClick={() => toggleLock(key)}
                    aria-label={isLocked ? `Unlock ${label}` : `Lock ${label}`}
                    title={
                      isLocked
                        ? "Unlock — allow auto-adjustment"
                        : "Lock — prevent auto-adjustment"
                    }
                  >
                    {isLocked ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <LockOpen className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
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
