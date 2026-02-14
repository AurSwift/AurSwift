import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { RowActionItem, RowAction } from "../types";

interface TableRowActionsProps<TData> {
  row: TData;
  actions: RowActionItem<TData>[];
  className?: string;
}

/**
 * Table row actions dropdown component
 * Displays action menu for each row
 */
export function TableRowActions<TData>({
  row,
  actions,
  className,
}: TableRowActionsProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={className}
          aria-label="Open row actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action, index) => {
          if ("type" in action && action.type === "separator") {
            return <DropdownMenuSeparator key={`separator-${index}`} />;
          }

          const typedAction = action as RowAction<TData>;
          const { label, icon: Icon, onSelect, variant, disabled } = typedAction;

          return (
            <DropdownMenuItem
              key={label}
              onSelect={() => onSelect(row)}
              variant={variant}
              disabled={disabled}
            >
              {Icon && <Icon className="mr-2 h-4 w-4" />}
              {label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
