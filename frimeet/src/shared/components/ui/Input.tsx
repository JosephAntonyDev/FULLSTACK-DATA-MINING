import React from "react";
import { cn } from "@/shared/utils/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, icon, rightIcon, ...props }, ref) => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", width: "100%" }}>
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          {icon && (
            <div
              style={{
                position: "absolute",
                left: "0",
                color: "var(--color-gray)",
                pointerEvents: "none",
                display: "flex",
                alignItems: "center",
              }}
            >
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn("login-input", error && "login-input--error", className)}
            style={{
              paddingLeft: icon ? "1.75rem" : "0",
              paddingRight: rightIcon ? "2rem" : "0",
            }}
            {...props}
          />
          {rightIcon && (
            <div
              style={{
                position: "absolute",
                right: "0",
                display: "flex",
                alignItems: "center",
              }}
            >
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <span style={{ fontSize: "0.75rem", color: "#ef4444" }}>{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
