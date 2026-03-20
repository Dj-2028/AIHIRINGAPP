"use client";
import { cn } from "@/lib/utils";

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div
        className="w-4 h-4 rounded-full border-2 border-[#1A1A18] border-t-transparent animate-spin"
      />
    </div>
  );
}
