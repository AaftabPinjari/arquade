"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageStore } from "@/stores/page-store";
import { PageHeader } from "@/components/editor/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";

// Dynamic load the editor to avoid blocking the main thread
const PageEditor = dynamic(() => import("@/components/editor/page-editor").then(mod => mod.PageEditor), {
    ssr: false,
    loading: () => (
        <div className="space-y-4 py-8">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-5/6" />
        </div>
    )
});

export default function PageViewClient() {
    const params = useParams();
    const router = useRouter();
    const pageId = params.pageId as string;
    const { pages, isLoaded, fetchPageContent } = usePageStore();
    const [page, setPage] = useState(() =>
        pages.find((p) => p.id === pageId) ?? null
    );

    // Fetch content on demand if not already loaded
    useEffect(() => {
        if (pageId && isLoaded) {
            fetchPageContent(pageId);
        }
    }, [pageId, isLoaded, fetchPageContent]);

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
                {page.content ? (
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
