import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | string, locale = "fr-FR"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Format a date range
 */
export function formatDateRange(
  start: Date | string,
  end: Date | string,
  locale = "fr-FR"
): string {
  return `${formatDate(start, locale)} - ${formatDate(end, locale)}`;
}

/**
 * Get CSS color for a shift code
 */
export function getShiftColor(code: string): string {
  const colors: Record<string, string> = {
    "101": "#FFD9E6",
    "102": "#FFE6F0",
    "111": "#D9E6FF",
    "112": "#E6F0FF",
    "121": "#FFE6CC",
    "6101": "#FFD9E6",
    "6102": "#FFE6F0",
    "6111": "#D9E6FF",
    "6112": "#E6F0FF",
    "6121": "#FFE6CC",
    "7101": "#FFD9E6",
    "7102": "#FFE6F0",
    "7111": "#D9E6FF",
    "7112": "#E6F0FF",
    "7121": "#FFE6CC",
    X_AM: "#D9F2D9",
    X_PM: "#D9F2D9",
    X_10: "#E6D9FF",
    AG: "#FF4444",
    CN: "#FFFFCC",
    JC: "#FFFFCC",
    RH: "#CCCCCC",
    CH: "#D5D5D5",
    RR: "#C9C9C9",
    CV: "#96D1CC",
    ZM: "#F0F0F0",
  };

  return colors[code] || "#FFFFFF";
}

/**
 * Check if a color is light (for text contrast)
 */
export function isLightColor(hex: string): boolean {
  const color = hex.replace("#", "");
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 186;
}

/**
 * Get text color based on background
 */
export function getContrastColor(bgHex: string): string {
  return isLightColor(bgHex) ? "#000000" : "#FFFFFF";
}
