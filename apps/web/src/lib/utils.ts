import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitizes text to prevent ByteString conversion errors in AI SDK
 * Replaces problematic Unicode characters with ASCII equivalents
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return text
    .replace(/[\u2013\u2014]/g, '-')  // En dash, Em dash -> hyphen
    .replace(/[\u2018\u2019]/g, "'")  // Smart single quotes -> apostrophe
    .replace(/[\u201C\u201D]/g, '"')  // Smart double quotes -> straight quotes
    .replace(/[\u2026]/g, '...')      // Ellipsis -> three periods
    .replace(/[\u00A0]/g, ' ')        // Non-breaking space -> regular space
    .replace(/[^\x00-\x7F]/g, '?')    // Replace any remaining non-ASCII with ?
    .replace(/\s+/g, ' ')             // Normalize whitespace
    .trim();
} 