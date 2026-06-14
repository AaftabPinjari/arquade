"use client";

import { useCallback, useEffect, useRef, useMemo } from "react";
import { 
  useCreateBlockNote, 
  SuggestionMenuController, 
  getDefaultReactSlashMenuItems,
  FormattingToolbarController,
  FormattingToolbar,
  BlockTypeSelect,
  BasicTextStyleButton,
  TextAlignButton,
  ColorStyleButton,
  NestBlockButton,
  UnnestBlockButton,
  CreateLinkButton,
  useComponentsContext
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { usePageStore } from "@/stores/page-store";
import { useUIStore } from "@/stores/ui-store";
import { createClient } from "@/lib/supabase/client";
import type { Page } from "@/types";
import { useTheme } from "next-themes";
import { schema, getCustomSlashMenuItems } from "./schema";
import { uuidv4 } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface PageEditorProps {
    page: Page;
}

function AskAIButton({ editor }: { editor: any }) {
    const Components = useComponentsContext();
    const { setAiOpen, setAiSelectedText } = useUIStore();

    if (!Components) return null;

    const handleAskAI = () => {
        const selectedText = editor.getSelectedText();
        if (selectedText) {
            setAiSelectedText(selectedText);
            setAiOpen(true);
        }
    };

    return (
        <Components.Generic.Toolbar.Button
            onClick={handleAskAI}
            mainTooltip="Ask AI"
        >
            <div className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400 font-semibold px-1 py-0.5 select-none transition-colors duration-150 rounded hover:text-violet-700 dark:hover:text-violet-300">
                <Sparkles className="h-3.5 w-3.5 text-violet-500 fill-violet-500/15 animate-pulse shrink-0" />
                <span className="text-xs font-semibold tracking-wide">Ask AI</span>
            </div>
        </Components.Generic.Toolbar.Button>
    );
}

function deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (a && b && typeof a === "object") {
        if (Array.isArray(a)) {
            if (!Array.isArray(b) || a.length !== b.length) return false;
            for (let i = 0; i < a.length; i++) {
                if (!deepEqual(a[i], b[i])) return false;
            }
            return true;
        }
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length) return false;
        for (const key of keysA) {
            if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
            if (!deepEqual(a[key], b[key])) return false;
        }
        return true;
    }
    return false;
}

export function PageEditor({ page }: PageEditorProps) {
    const { resolvedTheme } = useTheme();
    const { updatePage } = usePageStore();
    
    const pendingSaveRef = useRef(false);
    const isSyncingRef = useRef(false);
    const latestContentRef = useRef<unknown>(null);
    const pageIdRef = useRef(page.id);
    // Track page ID changes for beforeunload
    useEffect(() => {
        pageIdRef.current = page.id;
    }, [page.id]);

    // Image upload handler
    const uploadFile = useCallback(
        async (file: File) => {
            const supabase = createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return "";

            const ext = file.name.split(".").pop();
            const path = `${user.id}/${page.id}/${uuidv4()}.${ext}`;

            const { error } = await supabase.storage
                .from("page-images")
                .upload(path, file);

            if (error) return "";

            const {
                data: { publicUrl },
            } = supabase.storage.from("page-images").getPublicUrl(path);

            return publicUrl;
        },
        [page.id]
    );

    const initialContent = useMemo(() => {
        if (
            page.content &&
            Array.isArray(page.content) &&
            (page.content as unknown[]).length > 0
        ) {
            return page.content as any;
        }
        return undefined;
    }, [page.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const editor = useCreateBlockNote({
        initialContent,
        uploadFile,
        schema,
    });

    // Sync external content changes into the editor
    useEffect(() => {
        if (!page.content || !Array.isArray(page.content)) return;
        
        // If we are currently typing/saving locally, don't overwrite
        if (pendingSaveRef.current) return;
        
        // If the editor document matches the page content, do nothing
        if (deepEqual(editor.document, page.content)) return;
        
        // Replace blocks in the editor
        isSyncingRef.current = true;
        try {
            editor.replaceBlocks(editor.document, page.content as any);
        } finally {
            // Delay resetting the syncing flag to let synchronous onChange event cycles settle
            setTimeout(() => {
                isSyncingRef.current = false;
            }, 0);
        }
    }, [page.content, editor]);

    // Save function
    const saveContent = useCallback(
        (content: unknown) => {
            pendingSaveRef.current = false;
            updatePage(page.id, { content: content as any });
        },
        [page.id, updatePage]
    );

    // onChange handler (now leverages global store debounce)
    const handleChange = useCallback(() => {
        if (isSyncingRef.current) return;
        const content = editor.document;
        latestContentRef.current = content;
        pendingSaveRef.current = true;
        saveContent(content);
    }, [editor, saveContent]);

    // Save on beforeunload
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (pendingSaveRef.current && latestContentRef.current) {
                // Force synchronous save via navigator.sendBeacon
                const supabase = createClient();
                const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pages?id=eq.${pageIdRef.current}`;
                const body = JSON.stringify({ content: latestContentRef.current });
                navigator.sendBeacon(url, body);
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, []);

    // Cleanup on unmount — flush pending save to store
    useEffect(() => {
        return () => {
            if (pendingSaveRef.current && latestContentRef.current) {
                saveContent(latestContentRef.current);
            }
        };
    }, [saveContent]);

    return (
        <BlockNoteView
            editor={editor}
            onChange={handleChange}
            theme={resolvedTheme === "dark" ? "dark" : "light"}
            className="min-h-[50vh]"
            slashMenu={false}
            formattingToolbar={false}
        >
            <SuggestionMenuController
                triggerCharacter={"/"}
                getItems={async (query) =>
                    [
                        ...getDefaultReactSlashMenuItems(editor),
                        ...getCustomSlashMenuItems(editor),
                    ].filter((item) =>
                        item.title.toLowerCase().includes(query.toLowerCase()) ||
                        (item as any).aliases?.some((alias: string) =>
                            alias.toLowerCase().includes(query.toLowerCase())
                        )
                    )
                }
            />
            <FormattingToolbarController
                formattingToolbar={() => (
                    <FormattingToolbar>
                        <BlockTypeSelect key="blockTypeSelect" />
                        
                        <AskAIButton editor={editor} key="askAIButton" />
                        
                        <BasicTextStyleButton basicTextStyle="bold" key="boldStyleButton" />
                        <BasicTextStyleButton basicTextStyle="italic" key="italicStyleButton" />
                        <BasicTextStyleButton basicTextStyle="underline" key="underlineStyleButton" />
                        <BasicTextStyleButton basicTextStyle="strike" key="strikeStyleButton" />
                        
                        <ColorStyleButton key="colorStyleButton" />
                        <NestBlockButton key="nestBlockButton" />
                        <UnnestBlockButton key="unnestBlockButton" />
                        
                        <TextAlignButton textAlignment="left" key="textAlignLeftButton" />
                        <TextAlignButton textAlignment="center" key="textAlignCenterButton" />
                        <TextAlignButton textAlignment="right" key="textAlignRightButton" />
                        
                        <CreateLinkButton key="createLinkButton" />
                    </FormattingToolbar>
                )}
            />
        </BlockNoteView>
    );
}
