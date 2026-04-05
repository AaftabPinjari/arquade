"use client";

import { useEffect, useRef } from "react";
import { usePageStore } from "@/stores/page-store";

/**
 * Silently fetches content for ALL pages in the background after initial load.
 * This guarantees that every page navigation is instant — no content fetch needed.
 * Runs once after mount, with a small delay to avoid competing with critical renders.
 */
export function BackgroundContentSync() {
    const started = useRef(false);
    const isLoaded = usePageStore((s) => s.isLoaded);
    const fetchAllContent = usePageStore((s) => s.fetchAllContent);

    useEffect(() => {
        if (isLoaded && !started.current) {
            started.current = true;
            // Small delay to let the critical UI paint first
            const timer = setTimeout(() => {
                fetchAllContent();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isLoaded, fetchAllContent]);

    return null;
}
