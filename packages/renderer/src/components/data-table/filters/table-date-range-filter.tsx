import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/shared/utils/cn";
import { useDataTableContext } from "../data-table-context";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

interface TableDateRangeFilterProps {
  column: string;
  title?: string;
  className?: string;
}

/**
 * Date range filter component
 * Filters table data by date range
 */
export function TableDateRangeFilter({
  column: columnId,
  title = "Date range",
  className,
}: TableDateRangeFilterProps) {
  const { table } = useDataTableContext();
  const column = table.getColumn(columnId);
  const [date, setDate] = useState<DateRange | undefined>();

  if (!column) {
    console.warn(`Column "${columnId}" not found in table`);
    return null;
  }

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range);
    if (range?.from && range?.to) {
      column.setFilterValue([range.from, range.to]);
    } else {
      column.setFilterValue(undefined);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 border-dashed",
            !date && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {title}
          {date?.from && (
            <>
              {" : "}
              {date.from.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
              {date.to && (
                <>
                  {" - "}
                  {date.to.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </>
              )}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={date?.from}
          selected={date}
          onSelect={handleSelect}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}
