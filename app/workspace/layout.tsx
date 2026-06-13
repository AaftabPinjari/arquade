import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { WorkspaceLayoutClient } from "@/components/layouts/workspace-layout-client";
import { StoreInitializer } from "@/components/providers/store-initializer";
import { BackgroundContentSync } from "@/components/providers/background-content-sync";
import type { Page } from "@/types";

export default async function WorkspaceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    // Check session on the server
    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
        redirect("/login");
    }

    // Fetch pages (shallow) and profile in parallel on the server
    const [pagesRes, profileRes] = await Promise.all([
        supabase
            .from("pages")
            .select("id, user_id, parent_id, title, icon, cover_url, sort_order, is_archived, is_favorite, is_published, full_width, created_at, updated_at")
            .eq("user_id", session.user.id)
            .order("sort_order", { ascending: true }),
        supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single()
    ]);

    const pages = (pagesRes.data || []) as Page[];
    const profile = profileRes.data || null;

    return (
        <>
            {/* Initialize Zustand store with server data (merged with cached content) */}
            <StoreInitializer pages={pages} profile={profile} />
            
            {/* Silently fetch ALL page content in background after 2s */}
            <BackgroundContentSync />
            
            {/* Render the UI shell */}
            <WorkspaceLayoutClient>
                {children}
            </WorkspaceLayoutClient>
        </>
    );
}
