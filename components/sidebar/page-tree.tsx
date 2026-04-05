"use client";

import { useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Tree, type NodeRendererProps, type MoveHandler } from "react-arborist";
import { usePageStore } from "@/stores/page-store";
import { useUIStore } from "@/stores/ui-store";
import { TreeNode } from "./tree-node";
import type { TreePage } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

export function PageTree() {
    const router = useRouter();
    const { pages, movePage, addPage, isLoaded } = usePageStore();
    const { activePageId } = useUIStore();
    const treeRef = useRef<ReturnType<typeof Tree<TreePage>> | null>(null);

    // Build the tree data from flat pages array
    const treeData = useMemo(() => {
        const activePages = pages.filter((p) => !p.is_archived);
        const map = new Map<string | null, TreePage[]>();

        // Group by parent_id
        activePages.forEach((p) => {
            const parentKey = p.parent_id ?? "__root__";
            if (!map.has(parentKey)) map.set(parentKey, []);
            map.get(parentKey)!.push({
                id: p.id,
                name: p.title,
                icon: p.icon,
                isFavorite: p.is_favorite,
                isArchived: p.is_archived,
                sortOrder: p.sort_order,
                children: [],
            });
        });

        // Sort each group by sort_order
        map.forEach((children) => {
            children.sort((a, b) => (a.sortOrder > b.sortOrder ? 1 : -1));
        });

        // Build tree recursively
        function buildChildren(parentId: string | null): TreePage[] {
            const key = parentId ?? "__root__";
            const children = map.get(key) ?? [];
            return children.map((child) => ({
                ...child,
                children: buildChildren(child.id),
            }));
        }

        return buildChildren(null);
    }, [pages]);

    const handleMove: MoveHandler<TreePage> = async ({ dragIds, parentId, index }) => {
        const id = dragIds[0];
        if (!id) return;
        await movePage(id, parentId ?? null, index);
    };

    const handleActivate = (node: { data: TreePage }) => {
        router.push(`/workspace/${node.data.id}`);
    };

    if (!isLoaded) {
        return (
            <div className="space-y-2.5 px-2 py-2">
                <Skeleton className="h-5 w-[80%] rounded-md" />
                <Skeleton className="h-5 w-[75%] rounded-md" />
                <Skeleton className="h-5 w-[85%] rounded-md" />
                <Skeleton className="h-5 w-[70%] rounded-md" />
                <Skeleton className="h-5 w-[90%] rounded-md" />
            </div>
        );
    }

    return (
        <Tree<TreePage>
            ref={treeRef as any}
            data={treeData}
            onMove={handleMove}
            onActivate={handleActivate}
            selection={activePageId ?? undefined}
            openByDefault={false}
            width={240}
            indent={16}
            rowHeight={30}
            overscanCount={10}
            paddingBottom={20}
            disableMultiSelection
        >
            {(props: NodeRendererProps<TreePage>) => <TreeNode {...props} />}
        </Tree>
    );
}
