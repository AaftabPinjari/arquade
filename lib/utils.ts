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

function inlineContentToMarkdown(inlineContent: any): string {
  if (!inlineContent) return "";
  if (typeof inlineContent === "string") return inlineContent;
  if (Array.isArray(inlineContent)) {
    return inlineContent.map(inlineContentToMarkdown).join("");
  }
  
  if (typeof inlineContent === "object") {
    if (inlineContent.type === "text") {
      let text = inlineContent.text || "";
      const styles = inlineContent.styles || {};
      
      if (styles.code) {
        text = `\`${text}\``;
      }
      if (styles.bold) {
        text = `**${text}**`;
      }
      if (styles.italic) {
        text = `*${text}*`;
      }
      if (styles.strike) {
        text = `~~${text}~~`;
      }
      return text;
    }
    
    if (inlineContent.type === "link") {
      const href = inlineContent.href || "";
      const text = inlineContentToMarkdown(inlineContent.content);
      return `[${text}](${href})`;
    }
  }
  
  return "";
}

export function blocksToMarkdown(blocks: any, depth = 0): string {
  if (!blocks) return "";
  if (typeof blocks === "string") return blocks;
  if (Array.isArray(blocks)) {
    return blocks.map(b => blocksToMarkdown(b, depth)).join("\n");
  }
  
  const indent = "  ".repeat(depth);
  let result = "";
  
  if (typeof blocks === "object" && blocks.type) {
    const type = blocks.type;
    const props = blocks.props || {};
    const contentText = inlineContentToMarkdown(blocks.content);
    
    switch (type) {
      case "paragraph":
        result = `${indent}${contentText}`;
        break;
        
      case "heading":
        const level = props.level || 1;
        const headingPrefix = "#".repeat(level);
        result = `${indent}${headingPrefix} ${contentText}`;
        break;
        
      case "bulletListItem":
        result = `${indent}- ${contentText}`;
        break;
        
      case "numberedListItem":
        result = `${indent}1. ${contentText}`;
        break;
        
      case "checkListItem":
        const checked = props.checked ? "x" : " ";
        result = `${indent}- [${checked}] ${contentText}`;
        break;
        
      case "codeBlock":
        const language = props.language || "";
        result = `${indent}\`\`\`${language}\n${indent}${contentText}\n${indent}\`\`\``;
        break;
        
      default:
        if (contentText) {
          result = `${indent}${contentText}`;
        }
        break;
    }
    
    if (blocks.children && Array.isArray(blocks.children) && blocks.children.length > 0) {
      const childrenMarkdown = blocksToMarkdown(blocks.children, depth + 1);
      if (childrenMarkdown) {
        result += "\n" + childrenMarkdown;
      }
    }
  }
  
  return result;
}

