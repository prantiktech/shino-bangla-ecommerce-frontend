"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 bg-white rounded-xl", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "space-y-4",
        month_caption: "flex justify-center pt-1 relative items-center mb-2",
        caption_label: "text-xs font-bold text-slate-900",
        nav: "space-x-1 flex items-center",
        button_previous:
          "absolute left-1 h-7 w-7 bg-transparent p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg flex items-center justify-center transition-colors cursor-pointer",
        button_next:
          "absolute right-1 h-7 w-7 bg-transparent p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg flex items-center justify-center transition-colors cursor-pointer",
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex justify-between",
        weekday: "text-slate-400 rounded-md w-8 font-semibold text-[10px] uppercase text-center",
        weeks: "space-y-1 mt-2",
        week: "flex w-full justify-between mt-1",
        day: "h-8 w-8 text-center text-xs p-0 relative focus-within:relative focus-within:z-20 flex items-center justify-center",
        day_button:
          "h-8 w-8 p-0 font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors flex items-center justify-center cursor-pointer",
        selected:
          "!bg-primary !text-white font-bold rounded-lg shadow-sm hover:!bg-primary-hover hover:!text-white",
        today: "font-bold text-primary bg-brand-50 rounded-lg border border-brand-200",
        outside: "text-slate-300 opacity-50",
        disabled: "text-slate-300 opacity-40 cursor-not-allowed",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          return orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          );
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
