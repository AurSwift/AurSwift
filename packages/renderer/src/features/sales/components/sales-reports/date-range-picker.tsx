/**
 * Date Range Picker Component
 *
 * Component for selecting a custom date range.
 * Uses calendar component with range selection.
 * Touch-friendly and responsive for mobile/tablet devices.
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { format } from "date-fns";
import type { DateRange } from "./sales-reports-filters";

export interface DateRangePickerProps {
  dateRange?: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  className?: string;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(
    dateRange?.start,
  );
  const [endDate, setEndDate] = useState<Date | undefined>(dateRange?.end);
  const [selectingEnd, setSelectingEnd] = useState(false);

  // Sync internal state with prop changes
  useEffect(() => {
    if (dateRange) {
      setStartDate(dateRange.start);
      setEndDate(dateRange.end);
    } else {
      setStartDate(undefined);
      setEndDate(undefined);
    }
  }, [dateRange]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    if (!startDate || selectingEnd) {
      // If no start date or we're selecting end date
      if (!startDate) {
        // First selection - set as start date
        setStartDate(date);
        setEndDate(undefined);
        setSelectingEnd(true);
      } else if (date >= startDate) {
        // Valid end date
        setEndDate(date);
        setSelectingEnd(false);
      } else {
        // Selected date is before start, restart selection
        setStartDate(date);
        setEndDate(undefined);
        setSelectingEnd(true);
      }
    } else {
      // We have a start date and not selecting end
      if (date >= startDate) {
        setEndDate(date);
        setSelectingEnd(false);
      } else {
        // New selection before start, restart
        setStartDate(date);
        setEndDate(undefined);
        setSelectingEnd(true);
      }
    }
  };

  const handleApply = () => {
    if (startDate && endDate) {
      // Set start to beginning of day
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      // Set end to end of day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      onDateRangeChange({ start, end });
      setIsOpen(false);
      setSelectingEnd(false);
    }
  };

  const handleClear = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectingEnd(false);
  };

  const handleCancel = () => {
    // Reset to original values
    if (dateRange) {
      setStartDate(dateRange.start);
      setEndDate(dateRange.end);
    } else {
      setStartDate(undefined);
      setEndDate(undefined);
    }
    setSelectingEnd(false);
    setIsOpen(false);
  };

  const displayText = dateRange
    ? `${format(dateRange.start, "MMM dd, yyyy")} - ${format(dateRange.end, "MMM dd, yyyy")}`
    : "Select date range";

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full min-w-0 max-w-full justify-start text-left font-normal overflow-hidden touch-manipulation",
            !dateRange && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate text-sm sm:text-base">{displayText}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 max-w-[95vw]"
        align="start"
        sideOffset={4}
      >
        <div className="flex flex-col">
          {/* Instructions */}
          <div className="px-4 pt-4 pb-2 border-b">
            <p className="text-sm font-medium text-slate-900">
              {!startDate
                ? "Select start date"
                : !endDate
                  ? "Select end date"
                  : "Date range selected"}
            </p>
            {startDate && !endDate && (
              <p className="text-xs text-slate-600 mt-1">
                Start: {format(startDate, "MMM dd, yyyy")}
              </p>
            )}
            {startDate && endDate && (
              <p className="text-xs text-slate-600 mt-1">
                {format(startDate, "MMM dd, yyyy")} -{" "}
                {format(endDate, "MMM dd, yyyy")}
              </p>
            )}
          </div>

          {/* Calendar */}
          <div className="p-4 flex justify-center">
            <Calendar
              mode="single"
              selected={selectingEnd ? endDate : startDate}
              onSelect={handleDateSelect}
              disabled={(date) => {
                // Disable future dates
                const today = new Date();
                today.setHours(23, 59, 59, 999);
                if (date > today) return true;

                // When selecting end date, disable dates before start
                if (selectingEnd && startDate) {
                  return date < startDate;
                }

                return false;
              }}
              modifiers={{
                selected: (date) => {
                  if (!startDate || !endDate) return false;
                  return date >= startDate && date <= endDate;
                },
                start: (date) => {
                  if (!startDate) return false;
                  return date.getTime() === startDate.getTime();
                },
                end: (date) => {
                  if (!endDate) return false;
                  return date.getTime() === endDate.getTime();
                },
              }}
              modifiersClassNames={{
                selected: "bg-primary/10 hover:bg-primary/20",
                start:
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                end: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              }}
              className="rounded-md"
              buttonVariant="ghost"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 p-4 border-t bg-slate-50">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="flex-1 touch-manipulation min-h-11 sm:min-h-9"
            >
              Clear
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="flex-1 touch-manipulation min-h-11 sm:min-h-9"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              disabled={!startDate || !endDate}
              className="flex-1 touch-manipulation min-h-11 sm:min-h-9"
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
