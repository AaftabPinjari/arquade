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
        const cachedPagesMap = new Map<string, Page>();
        cachedPages.forEach((p) => {
            cachedPagesMap.set(p.id, p);
        });

        // Merge: use server metadata + preserve cached content only if it is up-to-date
        const mergedPages = serverPages.map((serverPage) => {
            const cachedPage = cachedPagesMap.get(serverPage.id);
            if (cachedPage && cachedPage.content && Array.isArray(cachedPage.content) && cachedPage.content.length > 0) {
                const serverTime = new Date(serverPage.updated_at).getTime();
                const cachedTime = new Date(cachedPage.updated_at).getTime();
                
                // Only reuse cached content if the local copy is at least as new as the server's copy
                if (serverTime <= cachedTime) {
                    return { ...serverPage, content: cachedPage.content };
                }
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
