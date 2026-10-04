import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent-500 text-ink-950 font-semibold hover:bg-accent-400 disabled:bg-accent-500/40 disabled:text-ink-950/60 shadow-[0_8px_24px_-10px_rgba(14,165,233,0.7)]",
  secondary:
    "bg-ink-800 text-ink-100 border border-ink-600 hover:border-accent-400/60 hover:text-accent-300 disabled:opacity-50",
  ghost: "text-ink-300 hover:text-ink-100 hover:bg-ink-800 disabled:opacity-50",
  danger: "bg-risk-critical/15 text-risk-critical border border-risk-critical/40 hover:bg-risk-critical/25",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  );
}
