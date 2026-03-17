"use client";

import { useCallback, useEffect, useRef, useMemo } from "react";
import { 
  useCreateBlockNote, 
  SuggestionMenuController, 
  getDefaultReactSlashMenuItems 
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { usePageStore } from "@/stores/page-store";
import { createClient } from "@/lib/supabase/client";
import type { Page } from "@/types";
import { useTheme } from "next-themes";
import { schema, getCustomSlashMenuItems } from "./schema";

interface PageEditorProps {
    page: Page;
}

export function PageEditor({ page }: PageEditorProps) {
    const { resolvedTheme } = useTheme();
    const { updatePage } = usePageStore();
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const pendingSaveRef = useRef(false);
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
            const path = `${user.id}/${page.id}/${crypto.randomUUID()}.${ext}`;

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

    // Save function
    const saveContent = useCallback(
        (content: unknown) => {
            pendingSaveRef.current = false;
            updatePage(page.id, { content: content as any });
        },
        [page.id, updatePage]
    );

    // Debounced onChange
    const handleChange = useCallback(() => {
        const content = editor.document;
        latestContentRef.current = content;
        pendingSaveRef.current = true;

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            saveContent(content);
        }, 1500);
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

    // Cleanup debounce on unmount — flush pending save
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
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
        </BlockNoteView>
    );
}
