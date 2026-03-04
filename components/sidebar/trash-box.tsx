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
    const { pages, restorePage, permanentlyDeletePage } = usePageStore();
    const [search, setSearch] = useState("");

    const archivedPages = pages.filter(
        (p) =>
            p.is_archived &&
            p.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 px-2 pt-1">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search trash…"
                    className="h-7 border-none bg-transparent shadow-none focus-visible:ring-0 px-0"
                />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-0.5">
                {archivedPages.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-4">
                        Trash is empty
                    </p>
                ) : (
                    archivedPages.map((page) => (
                        <div
                            key={page.id}
                            className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-accent text-sm cursor-pointer group"
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
