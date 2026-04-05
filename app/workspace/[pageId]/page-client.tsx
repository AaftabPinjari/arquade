"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePageStore } from "@/stores/page-store";
import { PageHeader } from "@/components/editor/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import type { Page } from "@/types";
import dynamic from "next/dynamic";

// Code-split the heavy editor bundle (~300KB+), but preload it eagerly
// so it's ready by the time the user navigates to any page.
const PageEditor = dynamic(
    () => import("@/components/editor/page-editor").then(mod => mod.PageEditor),
    { ssr: false }
);

// Preload the editor module immediately after this chunk loads.
// This downloads the editor JS in the background without blocking
// the current page render. By the time a user clicks a page, it's cached.
if (typeof window !== "undefined") {
    import("@/components/editor/page-editor");
}

interface PageViewClientProps {
    pageId: string;
    initialData: Page | null;
}

export default function PageViewClient({ pageId, initialData }: PageViewClientProps) {
    const router = useRouter();
    const pages = usePageStore((s) => s.pages);
    const isLoaded = usePageStore((s) => s.isLoaded);
    const fetchPageContent = usePageStore((s) => s.fetchPageContent);
    const loadedContentIds = usePageStore((s) => s.loadedContentIds);

    // Derive page from the store — this is instant, no network call
    const page = useMemo(() => {
        return pages.find((p) => p.id === pageId) || initialData || null;
    }, [pages, pageId, initialData]);

    // Content is "loaded" if:
    // - we've already fetched it (tracked in loadedContentIds), OR
    // - content is an Array (even empty — valid for a new page)
    const contentLoaded = page && (
        loadedContentIds.has(pageId) ||
        Array.isArray(page.content)
    );

    // Fetch content only when the page exists but content hasn't been fetched yet
    useEffect(() => {
        if (pageId && isLoaded && page && !contentLoaded) {
            fetchPageContent(pageId);
        }
    }, [pageId, isLoaded, page, contentLoaded, fetchPageContent]);

    // Handle 404 — only redirect if store is loaded and page truly doesn't exist
    useEffect(() => {
        if (isLoaded && !page) {
            const timer = setTimeout(() => {
                if (!usePageStore.getState().pages.find(p => p.id === pageId)) {
                    router.push("/workspace");
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isLoaded, page, pageId, router]);

    // Show skeleton only if the store hasn't loaded yet or page not found
    if (!page) {
        return (
            <div className="max-w-4xl mx-auto py-16 px-8 space-y-6">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-6 w-1/2" />
            </div>
        );
    }

    const containerWidth = page.full_width ? "max-w-full px-12" : "max-w-4xl mx-auto px-12";

    return (
        <div className="min-h-full">
            <PageHeader page={page} />
            <div className={`${containerWidth} py-4 pb-32`}>
                {contentLoaded ? (
                    <PageEditor key={page.id} page={page} />
                ) : (
                    <div className="space-y-4 py-8">
                        <Skeleton className="h-6 w-1/4" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-5/6" />
                    </div>
                )}
            </div>
        </div>
    );
}
