"use client";

import { BlockNoteSchema, defaultBlockSpecs, createCodeBlockSpec } from "@blocknote/core";
import { codeBlockOptions } from "@blocknote/code-block";
import { ReactSandboxBlock } from "./blocks/react-sandbox-block";
import { WebSandboxBlock } from "./blocks/web-sandbox-block";
import { createHighlighter } from "./blocks/shiki.bundle";
import { Code2, Globe } from "lucide-react";
import { DefaultReactSuggestionItem } from "@blocknote/react";

// Build the enhanced code block with Shiki syntax highlighting + language selector
const codeBlock = createCodeBlockSpec({
  ...codeBlockOptions,
  defaultLanguage: "typescript",
  createHighlighter,
});

// Define the custom schema
export const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    codeBlock,
    "react-sandbox": ReactSandboxBlock,
    "web-sandbox": WebSandboxBlock,
  },
});

// Create a function to get the custom slash menu item
export const getCustomSlashMenuItems = (editor: any): DefaultReactSuggestionItem[] => [
  {
    title: "React Preview",
    onItemClick: () => {
      editor.insertBlocks(
        [
          {
            type: "react-sandbox",
          },
        ],
        editor.getTextCursorPosition().block,
        "after"
      );
    },
    aliases: ["react", "sandbox", "preview", "code", "component"],
    group: "Components",
    icon: <Code2 size={18} />,
  },
  {
    title: "Web Preview",
    onItemClick: () => {
      editor.insertBlocks(
        [
          {
            type: "web-sandbox",
          },
        ],
        editor.getTextCursorPosition().block,
        "after"
      );
    },
    aliases: ["html", "css", "js", "web", "static", "vanilla", "preview"],
    group: "Components",
    icon: <Globe size={18} />,
  },
];

