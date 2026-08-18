import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "danger" | "surface";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-[#12141A] font-semibold disabled:bg-surface-3 disabled:text-text-faint",
  surface: "border border-border bg-surface-2 text-text",
  ghost: "text-text-dim hover:text-text",
  danger: "border border-danger/50 text-danger",
};

export function Button({ variant = "primary", className = "", children, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={`w-full rounded-2xl px-4 py-3.5 text-[15px] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:active:scale-100 ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
