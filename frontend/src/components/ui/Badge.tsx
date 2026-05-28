// src/components/ui/Badge.tsx
import { cn } from "@/src/lib/utils";

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold border mr-1.5", className)}>
      {children}
    </span>
  );
}