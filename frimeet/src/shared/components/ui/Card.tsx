import React from "react";
import { cn } from "@/shared/utils/cn";

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-[var(--radius-xl)] bg-brand-white shadow-[var(--shadow-card)] text-brand-black",
      className
    )}
    {...props}
  />
));

Card.displayName = "Card";
