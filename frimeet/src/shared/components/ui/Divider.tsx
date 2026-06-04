import React from "react";
import { cn } from "@/shared/utils/cn";

export const Divider = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("h-[1px] w-full bg-brand-border", className)}
    {...props}
  />
));

Divider.displayName = "Divider";
