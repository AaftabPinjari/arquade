"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { usePageStore } from "@/stores/page-store";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "sonner";
import type { Page } from "@/types";
import { useUserStore } from "@/stores/user-store";
import dynamic from "next/dynamic";

// Lazy load the sidebar to improve initial load
const DynamicSidebar = dynamic(() => import("@/components/sidebar/sidebar").then(mod => mod.Sidebar), {
    ssr: false,
    loading: () => <div className="w-60 h-full bg-sidebar border-r animate-pulse" />
});

export default function WorkspaceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { sidebarOpen, toggleSidebar, setActivePageId } = useUIStore();
    const { setPages, isLoaded } = usePageStore();
    const { setProfile } = useUserStore();
    const [loading, setLoading] = useState(true);

    const loadPages = useCallback(async () => {
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            router.push("/login");
            return;
        }

        // Fetch pages (shallow) and profile in parallel
        const [pagesRes, profileRes] = await Promise.all([
            supabase
                .from("pages")
                .select("id, user_id, parent_id, title, icon, cover_url, sort_order, is_archived, is_favorite, is_published, full_width, created_at, updated_at")
                .eq("user_id", user.id)
                .order("sort_order", { ascending: true }),
            supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single()
        ]);

        if (!pagesRes.error && pagesRes.data) {
            setPages(pagesRes.data as Page[]);
        }

        if (!profileRes.error && profileRes.data) {
            setProfile(profileRes.data);
        }

        setLoading(false);
    }, [router, setPages, setProfile]);

    useEffect(() => {
        if (!isLoaded) {
            loadPages();
        } else {
            setLoading(false);
        }
    }, [isLoaded, loadPages]);

    // Track active page from URL
    useEffect(() => {
        const match = pathname.match(/\/workspace\/(.+)/);
        if (match) {
            setActivePageId(match[1]);
        } else {
            setActivePageId(null);
        }
    }, [pathname, setActivePageId]);

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Loading workspace…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex overflow-hidden bg-background">
            <Toaster position="bottom-right" richColors />
            {/* Sidebar */}
            <aside
                className={cn(
                    "h-full flex-shrink-0 border-r border-border bg-sidebar transition-all duration-200 ease-in-out overflow-hidden",
                    sidebarOpen ? "w-60" : "w-0"
                )}
            >
                <DynamicSidebar />
            </aside>
            {/* Main content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {!sidebarOpen && (
                    <div className="h-11 flex items-center px-3 border-b border-border shrink-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={toggleSidebar}
                        >
                            <PanelLeft className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                <div className="flex-1 overflow-y-auto">{children}</div>
            </main>
        </div>
    );
}
