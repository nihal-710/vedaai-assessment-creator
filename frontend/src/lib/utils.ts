// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDifficultyColor(d: string) {
  if (d === "Easy")        return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (d === "Moderate")    return "bg-amber-50 text-amber-700 border-amber-200";
  if (d === "Challenging") return "bg-red-50 text-red-700 border-red-200";
  return "bg-gray-50 text-gray-600 border-gray-200";
}