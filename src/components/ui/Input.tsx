"use client";

import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, className, id, ...props }, ref) {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm text-white/50"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "border bg-transparent px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/25",
            error
              ? "border-red-500/40 focus:border-red-500"
              : "border-white/[0.08] focus:border-[var(--color-accent)]/40",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </div>
    );
  }
);
