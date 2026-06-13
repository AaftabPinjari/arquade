"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageStore } from "@/stores/page-store";
import { PageHeader } from "@/components/editor/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import type { Page } from "@/types";
import dynamic from "next/dynamic";
import { Sparkles } from "lucide-react";
import { AIChatPanel } from "@/components/editor/ai-chat-panel";
import { extractTextFromBlocks, cn } from "@/lib/utils";

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
    const [aiOpen, setAiOpen] = useState(false);
    const [aiWidth, setAiWidth] = useState(320);
    const [isDragging, setIsDragging] = useState(false);

    // Resize handlers for the AI panel on desktop
    const startResizing = (mouseDownEvent: React.MouseEvent) => {
        mouseDownEvent.preventDefault();
        setIsDragging(true);
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const newWidth = window.innerWidth - e.clientX;
            const minWidth = 320;
            const maxWidth = Math.min(600, window.innerWidth * 0.5); // max 50% of viewport width
            if (newWidth >= minWidth && newWidth <= maxWidth) {
                setAiWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging]);

    useEffect(() => {
        if (isDragging) {
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
        } else {
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        }
        return () => {
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };
    }, [isDragging]);

    // Derive page from the store — this is instant, no network call
    const page = useMemo(() => {
        return pages.find((p) => p.id === pageId) || initialData || null;
    }, [pages, pageId, initialData]);

    // Extract raw text for Gemini API prompt
    const plainText = useMemo(() => {
        return page ? extractTextFromBlocks(page.content) : "";
    }, [page, page?.content]); // eslint-disable-line react-hooks/exhaustive-deps

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

    const containerWidth = page.full_width ? "max-w-full px-6 md:px-12" : "max-w-4xl mx-auto px-6 md:px-12";

    return (
        <div className="flex w-full min-h-screen relative">
            {/* Editor Area */}
            <div className="flex-1 min-w-0">
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

            {/* Ask AI Floating Button (FAB) */}
            {!aiOpen && (
                <button
                    onClick={() => setAiOpen(true)}
                    className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/25 dark:shadow-indigo-500/10 rounded-full p-3 md:px-4 md:py-2.5 transition-all duration-200 hover:scale-105 active:scale-95 border border-violet-500/20 animate-in fade-in zoom-in-95 duration-200"
                >
                    <Sparkles className="h-4 w-4 shrink-0 animate-pulse text-violet-100 fill-violet-100/25" />
                    <span className="hidden md:inline text-xs font-bold tracking-wide">Ask AI</span>
                </button>
            )}

            {/* AI Side-Panel (Desktop) */}
            {aiOpen && (
                <div 
                    style={{ width: `${aiWidth}px` }}
                    className="hidden md:block sticky top-0 h-screen shrink-0 animate-in slide-in-from-right duration-200 relative group"
                >
                    {/* Resizable Drag Handle */}
                    <div
                        onMouseDown={startResizing}
                        className={cn(
                            "absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-50 transition-all duration-150 hover:bg-violet-500/40",
                            isDragging ? "bg-violet-500/60 w-1.5" : "bg-transparent"
                        )}
                    />
                    <AIChatPanel page={page} pageContent={plainText} onClose={() => setAiOpen(false)} />
                </div>
            )}

            {/* AI Bottom-Drawer (Mobile) */}
            {aiOpen && (
                <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/40">
                    {/* Backdrop closer */}
                    <div className="absolute inset-0" onClick={() => setAiOpen(false)} />
                    
                    {/* Drawer Content */}
                    <div className="relative w-full h-[65vh] bg-background border-t border-border rounded-t-2xl shadow-2xl flex flex-col z-10 animate-in slide-in-from-bottom duration-300">
                        {/* Drag Bar decoration */}
                        <div className="w-10 h-1 bg-muted-foreground/25 rounded-full mx-auto my-3 shrink-0" />
                        <div className="flex-1 min-h-0">
                            <AIChatPanel page={page} pageContent={plainText} onClose={() => setAiOpen(false)} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
