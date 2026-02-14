import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/shared/utils/cn";
import { Label } from "@/components/ui/label";

export type AdaptiveTextareaVariant = "default" | "borderOnly";

interface AdaptiveTextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  onFocus?: () => void;
  /** Border-only style: underline, no box. Matches AdaptiveFormField borderOnly. */
  variant?: AdaptiveTextareaVariant;
}

export const AdaptiveTextarea = forwardRef<
  HTMLTextAreaElement,
  AdaptiveTextareaProps
>(({ label, error, className, onFocus, variant = "default", ...props }, ref) => {
  const isBorderOnly = variant === "borderOnly";
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      <textarea
        ref={ref}
        className={cn(
          "flex w-full placeholder:text-muted-foreground",
          "focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-colors duration-150 resize-none",
          isBorderOnly
            ? [
                "min-h-[80px] bg-transparent px-0 pt-1 pb-2",
                "border-0 border-b-2 rounded-none",
                "focus-visible:ring-0 text-sm sm:text-base",
                error
                  ? "border-destructive focus-visible:border-destructive"
                  : "border-input focus-visible:border-primary",
              ]
            : [
                "min-h-[100px] rounded-lg border-2 bg-input px-4 py-3",
                "text-lg font-medium",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                error
                  ? "border-destructive focus-visible:ring-destructive"
                  : "border-border focus-visible:border-primary",
              ],
          className
        )}
        onFocus={onFocus}
        {...props}
      />
    </div>
  );
});

AdaptiveTextarea.displayName = "AdaptiveTextarea";
