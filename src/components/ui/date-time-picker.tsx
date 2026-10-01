"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateTimePickerProps {
  value?: string | null; // ISO string or YYYY-MM-DDTHH:mm
  onChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
  clearable?: boolean;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick date & time",
  className,
  clearable = true,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse initial date & time
  const parsedDate = React.useMemo(() => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }, [value]);

  const [selectedDate, setSelectedDate] = React.useState<Date | null>(parsedDate);
  const [hours, setHours] = React.useState<string>(
    parsedDate ? String(parsedDate.getHours()).padStart(2, "0") : "12"
  );
  const [minutes, setMinutes] = React.useState<string>(
    parsedDate ? String(parsedDate.getMinutes()).padStart(2, "0") : "00"
  );

  React.useEffect(() => {
    if (parsedDate) {
      setSelectedDate(parsedDate);
      setHours(String(parsedDate.getHours()).padStart(2, "0"));
      setMinutes(String(parsedDate.getMinutes()).padStart(2, "0"));
    } else {
      setSelectedDate(null);
    }
  }, [parsedDate]);

  const handleApply = (newDate: Date | null, h: string, m: string) => {
    if (!newDate) {
      onChange(null);
      setOpen(false);
      return;
    }
    const combined = new Date(newDate);
    combined.setHours(Number(h) || 0, Number(m) || 0, 0, 0);
    onChange(combined.toISOString());
    setOpen(false);
  };

  return (
    <div className={cn("relative flex items-center", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-medium text-xs h-9 px-3 bg-slate-50 border-slate-200 hover:bg-white hover:text-slate-900 rounded-xl transition-all",
              !parsedDate && "text-slate-400 font-normal",
              parsedDate && "text-slate-800 font-semibold"
            )}
          >
            <CalendarIcon className="mr-2 h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {parsedDate ? format(parsedDate, "PPp") : placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-4 border border-slate-200 shadow-xl rounded-2xl space-y-3 bg-white"
          align="start"
        >
          <Calendar
            mode="single"
            selected={selectedDate || undefined}
            onSelect={(d) => {
              setSelectedDate(d || null);
            }}
          />

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 font-bold">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Time:</span>
            </div>

            <div className="flex items-center gap-1">
              <select
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-primary"
              >
                {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map(
                  (h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  )
                )}
              </select>
              <span className="font-bold text-slate-400">:</span>
              <select
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-primary"
              >
                {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map(
                  (m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  )
                )}
              </select>
            </div>

            <Button
              size="sm"
              onClick={() => handleApply(selectedDate || new Date(), hours, minutes)}
              className="h-7 px-3 text-xs font-bold bg-primary hover:bg-primary-hover text-white rounded-lg cursor-pointer"
            >
              Set
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {clearable && parsedDate && (
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
