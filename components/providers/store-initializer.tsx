"use client";

import { useRef } from "react";
import { usePageStore } from "@/stores/page-store";
import { useUserStore } from "@/stores/user-store";
import type { Page, Profile } from "@/types";

interface Props {
    pages: Page[];
    profile: Profile | null;
}

export function StoreInitializer({ pages: serverPages, profile }: Props) {
    const initialized = useRef(false);

    if (!initialized.current) {
        // MERGE server metadata with locally cached content.
        // Server pages have fresh metadata (title, icon, sort_order, etc.)
        // but DON'T have content (layout.tsx only fetches metadata columns).
        // Locally cached pages (from persist) may have content from previous sessions.
        const cachedPages = usePageStore.getState().pages;
        const cachedContentMap = new Map<string, unknown>();
        cachedPages.forEach((p) => {
            if (p.content && Array.isArray(p.content) && p.content.length > 0) {
                cachedContentMap.set(p.id, p.content);
            }
        });

        // Merge: use server metadata + preserve cached content
        const mergedPages = serverPages.map((serverPage) => {
            const cachedContent = cachedContentMap.get(serverPage.id);
            if (cachedContent && (!serverPage.content || (Array.isArray(serverPage.content) && serverPage.content.length === 0))) {
                return { ...serverPage, content: cachedContent };
            }
            return serverPage;
        });

        // Rebuild loadedContentIds from merged pages
        const loadedIds = new Set<string>();
        mergedPages.forEach((p) => {
            if (p.content && Array.isArray(p.content)) {
                loadedIds.add(p.id);
            }
        });

        usePageStore.setState({ 
            pages: mergedPages, 
            isLoaded: true,
            loadedContentIds: loadedIds,
        });
        useUserStore.setState({ profile });
        initialized.current = true;
    }

    return null;
}
