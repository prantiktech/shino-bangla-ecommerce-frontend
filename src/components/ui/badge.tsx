import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-white shadow hover:bg-primary-hover",
        secondary:
          "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200",
        discount:
          "border-transparent bg-[#16A34A] text-white font-bold text-[11px] shadow-sm tracking-wide",
        outline: "text-foreground border border-gray-200",
        cartBadge:
          "bg-primary text-white rounded-full font-bold px-1.5 min-w-[18px] h-[18px] text-[10px] flex items-center justify-center",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
