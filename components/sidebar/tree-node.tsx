"use client";

import type { NodeRendererProps } from "react-arborist";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { usePageStore } from "@/stores/page-store";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import {
    ChevronRight,
    MoreHorizontal,
    Plus,
    Trash2,
    Star,
    Copy,
} from "lucide-react";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TreePage } from "@/types";

export function TreeNode({ node, style, dragHandle }: NodeRendererProps<TreePage>) {
    const router = useRouter();
    const { addPage, archivePage, toggleFavorite, fetchPageContent } = usePageStore();
    const { activePageId } = useUIStore();
    const isActive = activePageId === node.data.id;

    async function handleAddChild(e: React.MouseEvent) {
        e.stopPropagation();
        const newPage = await addPage(node.data.id);
        if (newPage) {
            node.open();
            router.push(`/workspace/${newPage.id}`);
        }
    }

    async function handleDelete(e: React.MouseEvent) {
        e.stopPropagation();
        await archivePage(node.data.id);
        if (isActive) {
            router.push("/workspace");
        }
    }

    async function handleToggleFavorite(e: React.MouseEvent) {
        e.stopPropagation();
        await toggleFavorite(node.data.id);
    }

    // Prefetch content on hover — so it's ready by the time user clicks
    const handleMouseEnter = useCallback(() => {
        fetchPageContent(node.data.id);
    }, [node.data.id, fetchPageContent]);

    return (
        <div
            ref={dragHandle}
            style={style}
            className={cn(
                "group flex items-center gap-1 pr-2 rounded-md cursor-pointer select-none",
                "hover:bg-accent transition-colors",
                isActive && "bg-accent"
            )}
            onClick={() => node.activate()}
            onMouseEnter={handleMouseEnter}
        >
            {/* Expand/collapse chevron */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    node.toggle();
                }}
                className="shrink-0 h-[30px] w-5 flex items-center justify-center hover:bg-accent"
            >
                {node.data.children && node.data.children.length > 0 ? (
                    <ChevronRight
                        className={cn(
                            "h-3.5 w-3.5 text-muted-foreground transition-transform",
                            node.isOpen && "rotate-90"
                        )}
                    />
                ) : (
                    <span className="w-3.5" />
                )}
            </button>

            {/* Icon */}
            <span className="shrink-0 text-sm">{node.data.icon}</span>

            {/* Title */}
            <span className="flex-1 truncate text-[13px] pl-1">
                {node.isEditing ? (
                    <input
                        type="text"
                        defaultValue={node.data.name}
                        autoFocus
                        onFocus={(e) => e.currentTarget.select()}
                        onBlur={() => node.reset()}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") node.submit(e.currentTarget.value);
                            if (e.key === "Escape") node.reset();
                        }}
                        className="bg-transparent outline-none w-full text-[13px]"
                    />
                ) : (
                    <Link
                        href={`/workspace/${node.data.id}`}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        className="w-full block"
                    >
                        {node.data.name}
                    </Link>
                )}
            </span>

            {/* Actions (always visible on touch, hover on desktop) */}
            <div className="shrink-0 flex items-center gap-0.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            onClick={(e) => e.stopPropagation()}
                            className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted"
                        >
                            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" side="right" className="w-48">
                        <DropdownMenuItem onClick={handleToggleFavorite}>
                            <Star className={cn("h-4 w-4 mr-2", node.data.isFavorite && "fill-yellow-500 text-yellow-500")} />
                            {node.data.isFavorite ? "Remove from favorites" : "Add to favorites"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => node.edit()}>
                            <Copy className="h-4 w-4 mr-2" />
                            Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={handleDelete}
                            className="text-destructive focus:text-destructive"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Move to trash
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <button
                    onClick={handleAddChild}
                    className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted"
                >
                    <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
            </div>
        </div>
    );
}
