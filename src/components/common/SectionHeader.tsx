import React, { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SectionHeaderProps {
  title: ReactNode;
  subtitle?: string;
  countdown?: ReactNode;
  onPrev?: () => void;
  onNext?: () => void;
  showArrows?: boolean;
  align?: "left" | "center" | "between";
  className?: string;
  actionText?: string;
  actionHref?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  countdown,
  onPrev,
  onNext,
  showArrows = false,
  align = "between",
  className = "",
  actionText,
  actionHref,
}) => {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-4 mb-6 ${className}`}>
      {/* Title & Countdown Area */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <div className={align === "center" ? "text-center w-full" : ""}>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>

        {countdown && (
          <div className="flex items-center">
            {countdown}
          </div>
        )}
      </div>

      {/* Actions & Carousel Arrows */}
      <div className="flex items-center gap-3">
        {actionText && actionHref && (
          <a
            href={actionHref}
            className="text-xs sm:text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
          >
            {actionText} →
          </a>
        )}

        {showArrows && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={onPrev}
              aria-label="Previous items"
              className="w-8 h-8 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 shadow-2xs active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onNext}
              aria-label="Next items"
              className="w-8 h-8 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 shadow-2xs active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
