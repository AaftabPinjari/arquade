import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Extract readable text from block note content structure recursively
export function extractTextFromBlocks(blocks: any): string {
  if (!blocks) return "";
  if (typeof blocks === "string") return blocks;
  if (Array.isArray(blocks)) {
    return blocks.map(extractTextFromBlocks).join(" ");
  }
  if (typeof blocks === "object") {
    let text = "";
    if (blocks.text && typeof blocks.text === "string") {
      text += blocks.text + " ";
    }
    if (blocks.content) {
      text += extractTextFromBlocks(blocks.content) + " ";
    }
    if (blocks.children) {
      text += extractTextFromBlocks(blocks.children) + " ";
    }
    return text.trim();
  }
  return "";
}
