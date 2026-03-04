"use client";

import { useRouter } from "next/navigation";
import { usePageStore } from "@/stores/page-store";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WorkspacePage() {
    const router = useRouter();
    const { addPage, pages } = usePageStore();
    const activePages = pages.filter((p) => !p.is_archived);

    async function handleCreatePage() {
        const page = await addPage(null);
        if (page) {
            router.push(`/workspace/${page.id}`);
        }
    }

    return (
        <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-6 max-w-md text-center">
                <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center">
                    <FileText className="h-10 w-10 text-muted-foreground" />
                </div>
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">
                        {activePages.length === 0
                            ? "Welcome to Arquade"
                            : "Select a page"}
                    </h2>
                    <p className="text-muted-foreground mt-2">
                        {activePages.length === 0
                            ? "Create your first page to get started"
                            : "Choose a page from the sidebar, or create a new one"}
                    </p>
                </div>
                <Button onClick={handleCreatePage} size="lg" className="gap-2">
                    <Plus className="h-4 w-4" />
                    New page
                </Button>
            </div>
        </div>
    );
}
