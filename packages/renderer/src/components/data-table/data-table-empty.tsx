import { FileQuestion } from "lucide-react";
import { cn } from "@/shared/utils/cn";

interface DataTableEmptyProps {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  className?: string;
}

/**
 * DataTable Empty state component
 * Shows when table has no data
 */
export function DataTableEmpty({
  title = "No results",
  description = "No data to display",
  icon: Icon = FileQuestion,
  action,
  className,
}: DataTableEmptyProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-8 sm:py-12 text-center",
        className,
      )}
    >
      <Icon className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mb-4" />
      <h3 className="text-base sm:text-lg font-semibold mb-2">{title}</h3>
      <p className="text-xs sm:text-sm text-muted-foreground mb-4">
        {description}
      </p>
      {action}
    </div>
  );
}
