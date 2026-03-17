"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageStore } from "@/stores/page-store";
import { PageEditor } from "@/components/editor/page-editor";
import { PageHeader } from "@/components/editor/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function PageView() {
    const params = useParams();
    const router = useRouter();
    const pageId = params.pageId as string;
    const { pages, isLoaded } = usePageStore();
    const [page, setPage] = useState(() =>
        pages.find((p) => p.id === pageId) ?? null
    );

    useEffect(() => {
        const found = pages.find((p) => p.id === pageId);
        if (found) {
            setPage(found);
        } else if (isLoaded) {
            router.push("/workspace");
        }
    }, [pageId, pages, isLoaded, router]);

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
        <div className="min-h-full transition-all duration-300">
            <PageHeader page={page} />
            <div className={`${containerWidth} py-4 pb-32`}>
                <PageEditor key={page.id} page={page} />
            </div>
        </div>
    );
}
