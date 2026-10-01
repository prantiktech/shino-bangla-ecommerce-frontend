"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  date?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
  clearable?: boolean;
}

export function DatePicker({
  date,
  onChange,
  placeholder = "Pick a date",
  className,
  clearable = true,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={cn("relative flex items-center", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-medium text-xs h-9 px-3 bg-slate-50 border-slate-200 hover:bg-white hover:text-slate-900 rounded-xl transition-all",
              !date && "text-slate-400 font-normal",
              date && "text-slate-800 font-semibold"
            )}
          >
            <CalendarIcon className="mr-2 h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{date ? format(date, "PPP") : placeholder}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border border-slate-200 shadow-xl rounded-2xl" align="start">
          <Calendar
            mode="single"
            selected={date || undefined}
            onSelect={(selectedDate) => {
              onChange(selectedDate || null);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>

      {clearable && date && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChange(null);
          }}
          className="absolute right-2 p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
          title="Clear date"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
