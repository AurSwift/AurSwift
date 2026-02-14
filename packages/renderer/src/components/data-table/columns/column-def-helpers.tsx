import type { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ColumnHeader } from "./column-header";
import type { ReactNode } from "react";

/**
 * Create a selection checkbox column
 */
export function createSelectionColumn<TData>(): ColumnDef<TData> {
  return {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  };
}

/**
 * Create a text column with optional sorting
 */
export function createTextColumn<TData>(
  accessorKey: keyof TData & string,
  options: {
    header: string;
    sortable?: boolean;
    className?: string;
    cell?: (value: any, row: TData) => ReactNode;
  },
): ColumnDef<TData> {
  return {
    accessorKey,
    header: options.sortable
      ? ({ column }) => <ColumnHeader column={column} title={options.header} />
      : options.header,
    cell: ({ row }) => {
      const value = row.getValue(accessorKey);
      if (options.cell) {
        return options.cell(value, row.original);
      }
      return (
        <div className={options.className}>
          {value !== null && value !== undefined ? String(value) : "—"}
        </div>
      );
    },
    enableSorting: options.sortable ?? false,
  };
}

/**
 * Create a badge column
 */
export function createBadgeColumn<TData>(
  accessorKey: keyof TData & string,
  options: {
    header: string;
    getValue?: (row: TData) => string;
    getVariant?: (
      row: TData,
    ) => "default" | "secondary" | "destructive" | "outline";
    className?: string;
  },
): ColumnDef<TData> {
  return {
    accessorKey,
    header: options.header,
    cell: ({ row }) => {
      const value = options.getValue
        ? options.getValue(row.original)
        : String(row.getValue(accessorKey) ?? "");
      const variant = options.getVariant
        ? options.getVariant(row.original)
        : "default";

      return (
        <Badge variant={variant} className={options.className}>
          {value}
        </Badge>
      );
    },
  };
}

/**
 * Create a date column with formatting
 */
export function createDateColumn<TData>(
  accessorKey: keyof TData & string,
  options: {
    header: string;
    format?: string; // e.g., 'MMM dd, yyyy'
    sortable?: boolean;
    className?: string;
  },
): ColumnDef<TData> {
  return {
    accessorKey,
    header: options.sortable
      ? ({ column }) => <ColumnHeader column={column} title={options.header} />
      : options.header,
    cell: ({ row }) => {
      const value = row.getValue(accessorKey);
      if (!value) {
        return <span className={options.className}>—</span>;
      }

      const date = new Date(value as string | Date);
      const formatted = date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      return <div className={options.className}>{formatted}</div>;
    },
    enableSorting: options.sortable ?? true,
    sortingFn: "datetime",
  };
}

/**
 * Create an actions column
 */
export function createActionsColumn<TData>(options: {
  cell: (props: { row: any }) => ReactNode;
  className?: string;
}): ColumnDef<TData> {
  return {
    id: "actions",
    header: "Actions",
    cell: options.cell,
    enableSorting: false,
    enableHiding: false,
  };
}

/**
 * Create a number column with formatting
 */
export function createNumberColumn<TData>(
  accessorKey: keyof TData & string,
  options: {
    header: string;
    sortable?: boolean;
    format?: "currency" | "decimal" | "percent";
    currency?: string;
    decimals?: number;
    className?: string;
  },
): ColumnDef<TData> {
  return {
    accessorKey,
    header: options.sortable
      ? ({ column }) => <ColumnHeader column={column} title={options.header} />
      : options.header,
    cell: ({ row }) => {
      const value = row.getValue(accessorKey) as number;
      if (value === null || value === undefined) {
        return <div className={options.className}>—</div>;
      }

      let formatted: string;
      switch (options.format) {
        case "currency":
          formatted = new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: options.currency ?? "USD",
            minimumFractionDigits: options.decimals ?? 2,
          }).format(value);
          break;
        case "percent":
          formatted = new Intl.NumberFormat(undefined, {
            style: "percent",
            minimumFractionDigits: options.decimals ?? 0,
          }).format(value);
          break;
        case "decimal":
        default:
          formatted = new Intl.NumberFormat(undefined, {
            minimumFractionDigits: options.decimals ?? 0,
            maximumFractionDigits: options.decimals ?? 2,
          }).format(value);
          break;
      }

      return <div className={options.className}>{formatted}</div>;
    },
    enableSorting: options.sortable ?? true,
  };
}

/**
 * Column definition helpers object for convenience
 */
export const columnHelpers = {
  selection: createSelectionColumn,
  text: createTextColumn,
  badge: createBadgeColumn,
  date: createDateColumn,
  actions: createActionsColumn,
  number: createNumberColumn,
};
