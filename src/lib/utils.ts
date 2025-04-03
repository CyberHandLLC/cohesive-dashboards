import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date using date-fns
 * @param date The date to format (Date object or ISO string)
 * @param formatString The format string (defaults to 'MMM d, yyyy')
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, formatString: string = 'MMM d, yyyy'): string {
  if (!date) return 'N/A';
  return format(new Date(date), formatString);
}
