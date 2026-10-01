import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  /** Visual size of the mark and wordmark. */
  size?: "sm" | "md" | "lg";
  /** Use light text for dark backgrounds (e.g. footer). */
  variant?: "default" | "light";
  /** Show the "Online Store" tagline under the wordmark (hidden on small screens). */
  showTagline?: boolean;
  /** Render as a link to the home page. */
  href?: string | null;
  className?: string;
}

const SIZES = {
  sm: { mark: "w-8 h-8 text-base rounded-lg", word: "text-lg" },
  md: { mark: "w-9 h-9 md:w-10 md:h-10 text-lg md:text-xl rounded-xl", word: "text-xl md:text-2xl" },
  lg: { mark: "w-11 h-11 text-2xl rounded-xl", word: "text-2xl md:text-3xl" },
} as const;

/**
 * Single source of truth for the Nogod Bazar brand mark.
 * Use this everywhere the logo appears so branding stays consistent.
 */
export const Logo: React.FC<LogoProps> = ({
  size = "md",
  variant = "default",
  showTagline = false,
  href = "/",
  className,
}) => {
  const s = SIZES[size];

  const content = (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "flex items-center justify-center shrink-0 bg-gradient-to-br from-brand-400 to-brand-600 text-white font-extrabold shadow-sm shadow-brand-500/25 transition-transform group-hover:scale-105",
          s.mark
        )}
      >
        N
      </span>
      <span className="flex flex-col">
        <span className={cn("flex items-baseline leading-none font-extrabold tracking-tight", s.word)}>
          <span className={variant === "light" ? "text-white" : "text-ink"}>nogod</span>
          <span className="text-primary ml-0.5">bazar</span>
        </span>
        {showTagline && (
          <span
            className={cn(
              "hidden sm:block text-[10px] font-semibold tracking-[0.14em] uppercase mt-1",
              variant === "light" ? "text-slate-400" : "text-slate-400"
            )}
          >
            Online Store
          </span>
        )}
      </span>
    </>
  );

  const classes = cn("inline-flex items-center gap-2 group select-none shrink-0", className);

  if (href === null) {
    return <span className={classes}>{content}</span>;
  }

  return (
    <Link href={href} className={classes} aria-label="Nogod Bazar home">
      {content}
    </Link>
  );
};
