import React from "react";
import { cn } from "@/shared/utils/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      fullWidth = false,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isPrimary = variant === "primary";

    return (
      <button
        ref={ref}
        style={
          isPrimary
            ? {
                background:
                  "linear-gradient(90deg, #FF2D87 0%, #FF6B1A 100%)",
                ...style,
              }
            : style
        }
        className={cn(
          "inline-flex items-center justify-center font-semibold transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2D87] disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
          {
            "text-white rounded-[var(--radius-full)] hover:opacity-90":
              isPrimary,
            "bg-[var(--color-background)] text-[var(--color-black)] hover:bg-[var(--color-border)] rounded-[var(--radius-full)]":
              variant === "secondary",
            "border border-[var(--color-border)] bg-transparent hover:bg-[var(--color-background)] rounded-[var(--radius-full)] text-[var(--color-black)]":
              variant === "outline",
            "bg-transparent hover:bg-[var(--color-background)] rounded-[var(--radius-full)]":
              variant === "ghost",
            "h-9 px-4 text-sm": size === "sm",
            "h-12 px-6 text-base": size === "md",
            "h-14 px-8 text-lg": size === "lg",
            "w-full": fullWidth,
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

