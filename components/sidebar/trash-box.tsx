"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePageStore } from "@/stores/page-store";
import { Input } from "@/components/ui/input";
import { Undo2, Trash2, Search } from "lucide-react";

interface TrashBoxProps {
    onClose: () => void;
}

export function TrashBox({ onClose }: TrashBoxProps) {
    const router = useRouter();
    const { pages, restorePage, permanentlyDeletePage, clearTrash } = usePageStore();
    const [search, setSearch] = useState("");

    const archivedPages = pages.filter(
        (p) =>
            p.is_archived &&
            p.title.toLowerCase().includes(search.toLowerCase())
    );

    const hasArchived = pages.some(p => p.is_archived);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-1 px-4 py-2 bg-muted/30">
                <div className="flex flex-1 items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search trash…"
                        className="h-8 border-none bg-transparent shadow-none focus-visible:ring-0 px-0 text-sm"
                    />
                </div>
                {hasArchived && (
                    <button
                        onClick={() => {
                            if (window.confirm("Are you sure you want to permanently delete all items in the trash?")) {
                                clearTrash();
                            }
                        }}
                        className="p-1.5 px-3 text-xs uppercase font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                    >
                        Clear
                    </button>
                )}
            </div>
            <div className="max-h-[60vh] overflow-y-auto px-1 pb-2 space-y-0.5 no-scrollbar">
                {archivedPages.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-4">
                        Trash is empty
                    </p>
                ) : (
                    archivedPages.map((page) => (
                        <div
                            key={page.id}
                            className="flex items-center justify-between rounded-md px-4 py-2 hover:bg-accent text-sm cursor-pointer group"
                            onClick={() => {
                                router.push(`/workspace/${page.id}`);
                                onClose();
                            }}
                        >
                            <div className="flex items-center gap-2 truncate">
                                <span className="shrink-0">{page.icon}</span>
                                <span className="truncate">{page.title}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        restorePage(page.id);
                                    }}
                                    className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted"
                                    title="Restore"
                                >
                                    <Undo2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        permanentlyDeletePage(page.id);
                                    }}
                                    className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-destructive"
                                    title="Delete permanently"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
