// src/components/ui/Button.tsx
"use client";
import { Loader2 } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "dark";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export function Button({
  children, variant = "primary", size = "md",
  loading = false, icon, iconRight, className, disabled, ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";
  const variants = {
    primary:   "bg-brand text-white hover:bg-brand-dark shadow-sm",
    secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",
    ghost:     "text-gray-600 hover:bg-gray-100",
    dark:      "bg-gray-900 text-white hover:bg-gray-800",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-sm",
  };

  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
      {loading ? <Loader2 size={15} className="animate-spin" /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  );
}