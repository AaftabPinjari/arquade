"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { usePageStore } from "@/stores/page-store";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, extractTextFromBlocks } from "@/lib/utils";
import type { Page } from "@/types";

interface SearchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// Generate contextual snippet with query match
interface Snippet {
    prefix: string;
    match: string;
    suffix: string;
}

function getSnippet(text: string, query: string): Snippet | null {
    if (!query) return null;
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return null;

    const start = Math.max(0, index - 40);
    const end = Math.min(text.length, index + query.length + 40);

    const prefix = (start > 0 ? "..." : "") + text.substring(start, index);
    const match = text.substring(index, index + query.length);
    const suffix = text.substring(index + query.length, end) + (end < text.length ? "..." : "");

    return { prefix, match, suffix };
}

// Trace parent titles hierarchy
function getBreadcrumbs(pageId: string, pages: Page[]): string[] {
    const breadcrumbs: string[] = [];
    let currentId: string | null = pages.find((p) => p.id === pageId)?.parent_id ?? null;
    while (currentId) {
        const parent = pages.find((p) => p.id === currentId);
        if (parent) {
            breadcrumbs.unshift(parent.title);
            currentId = parent.parent_id;
        } else {
            break;
        }
    }
    return breadcrumbs;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
    const router = useRouter();
    const { pages, fetchAllContent } = usePageStore();
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fetch all page contents in background when search dialog opens
    useEffect(() => {
        if (open) {
            fetchAllContent();
            setQuery("");
            setSelectedIndex(0);
            // Focus input element
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        }
    }, [open, fetchAllContent]);

    // Show recent pages when query is empty, sorted by updated_at
    const recentPages = useMemo(() => {
        return [...pages]
            .filter((p) => !p.is_archived)
            .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
            .slice(0, 5);
    }, [pages]);

    // Perform title and content searching
    const searchResults = useMemo(() => {
        if (!query.trim()) return [];

        const normalizedQuery = query.toLowerCase().trim();
        const results: { page: Page; snippet: Snippet | null }[] = [];

        pages
            .filter((p) => !p.is_archived)
            .forEach((page) => {
                const titleMatch = page.title.toLowerCase().includes(normalizedQuery);
                const textContent = extractTextFromBlocks(page.content);
                const contentSnippet = getSnippet(textContent, normalizedQuery);

                if (titleMatch || contentSnippet) {
                    results.push({
                        page,
                        snippet: contentSnippet,
                    });
                }
            });

        return results;
    }, [pages, query]);

    const activeList = query.trim() ? searchResults.map(r => r.page) : recentPages;

    // Reset selected index when active results list changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Handle keyboard navigation inside search input/list
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (activeList.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % activeList.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + activeList.length) % activeList.length);
        } else if (e.key === "Enter") {
            e.preventDefault();
            const targetPage = activeList[selectedIndex];
            if (targetPage) {
                router.push(`/workspace/${targetPage.id}`);
                onOpenChange(false);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="p-0 sm:max-w-lg bg-background overflow-hidden border border-border shadow-2xl gap-0 rounded-xl" showCloseButton={false}>
                <DialogTitle className="sr-only">Search Pages</DialogTitle>
                {/* Search Bar Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                    <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                    <Input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search pages and content..."
                        className="h-8 border-none bg-transparent shadow-none focus-visible:ring-0 px-0 text-base focus-visible:ring-offset-0 placeholder:text-muted-foreground/70"
                    />
                </div>

                {/* List Container */}
                <ScrollArea className="max-h-[350px] p-2">
                    <div className="text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-wider px-3 py-1.5 select-none">
                        {query.trim() ? "Search Results" : "Recent Pages"}
                    </div>

                    <div className="space-y-0.5 pb-2">
                        {activeList.length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground py-8 select-none">
                                {query.trim() ? "No results found" : "No recent pages"}
                            </p>
                        ) : (
                            activeList.map((page, index) => {
                                const isSelected = index === selectedIndex;
                                const breadcrumbs = getBreadcrumbs(page.id, pages);
                                const result = query.trim() ? searchResults[index] : null;
                                const snippet = result?.snippet;

                                return (
                                    <div
                                        key={page.id}
                                        className={cn(
                                            "flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer transition-all duration-150 select-none",
                                            isSelected 
                                                ? "bg-accent text-accent-foreground shadow-xs" 
                                                : "hover:bg-accent/40 text-foreground"
                                        )}
                                        onClick={() => {
                                            router.push(`/workspace/${page.id}`);
                                            onOpenChange(false);
                                        }}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                    >
                                        <span className="shrink-0 text-lg mt-0.5">
                                            {page.icon || "📄"}
                                        </span>
                                        <div className="flex-1 min-w-0 flex flex-col">
                                            {breadcrumbs.length > 0 && (
                                                <span className="text-[10px] text-muted-foreground/70 truncate mb-0.5 font-normal tracking-wide">
                                                    {breadcrumbs.join(" / ")}
                                                </span>
                                            )}
                                            <span className="font-medium truncate text-[13.5px] leading-tight">
                                                {page.title}
                                            </span>
                                            {snippet && (
                                                <span className="text-xs text-muted-foreground/90 mt-1.5 line-clamp-1 leading-normal bg-muted/40 rounded px-1.5 py-0.5 border border-border/40 font-normal">
                                                    {snippet.prefix}
                                                    <mark className="bg-amber-500/25 dark:bg-amber-500/35 text-foreground px-0.5 rounded font-semibold border-b-2 border-amber-500/40">
                                                        {snippet.match}
                                                    </mark>
                                                    {snippet.suffix}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>

                {/* Keyboard Shortcuts Hint Bar */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30 text-[10px] text-muted-foreground/80 shrink-0 font-medium select-none">
                    <div className="flex items-center gap-2">
                        <span>Navigate:</span>
                        <kbd className="px-1.5 py-0.5 rounded border border-border bg-background shadow-2xs font-sans text-[9px]">↑↓</kbd>
                        <span>Open:</span>
                        <kbd className="px-1.5 py-0.5 rounded border border-border bg-background shadow-2xs font-sans text-[9px]">Enter</kbd>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span>Close:</span>
                        <kbd className="px-1.5 py-0.5 rounded border border-border bg-background shadow-2xs font-sans text-[9px]">Esc</kbd>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
