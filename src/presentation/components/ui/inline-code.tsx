import { cn } from "@/lib/utils";

function InlineCode({ className, ...props }: React.ComponentProps<"code">) {
  return (
    <code
      className={cn(
        "bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
        className
      )}
      {...props}
    />
  );
}

export { InlineCode };
