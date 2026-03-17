import { create } from "zustand";
import { generateKeyBetween } from "fractional-indexing";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Page } from "@/types";

interface PageStore {
    pages: Page[];
    isLoaded: boolean;
    setPages: (pages: Page[]) => void;

    addPage: (parentId: string | null) => Promise<Page | null>;
    updatePage: (id: string, updates: Partial<Page>) => Promise<void>;
    fetchPageContent: (id: string) => Promise<void>;
    deletePage: (id: string) => Promise<void>;
    archivePage: (id: string) => Promise<void>;
    restorePage: (id: string) => Promise<void>;
    permanentlyDeletePage: (id: string) => Promise<void>;
    movePage: (
        id: string,
        newParentId: string | null,
        newIndex: number
    ) => Promise<void>;
    toggleFavorite: (id: string) => Promise<void>;
}

// Debounce tracking for Supabase sync
const pendingUpdates: Record<string, any> = {};
const updateTimers: Record<string, NodeJS.Timeout> = {};

export const usePageStore = create<PageStore>((set, get) => ({
    pages: [],
    isLoaded: false,

    setPages: (pages) => set({ pages, isLoaded: true }),

    addPage: async (parentId) => {
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return null;

        // Calculate sort_order: put new page at the end of siblings
        const siblings = get()
            .pages.filter(
                (p) => p.parent_id === parentId && !p.is_archived
            )
            .sort((a, b) => (a.sort_order > b.sort_order ? 1 : -1));

        const lastOrder = siblings.length > 0 ? siblings[siblings.length - 1].sort_order : null;
        const sortOrder = generateKeyBetween(lastOrder, null);

        const newPage: Page = {
            id: crypto.randomUUID(),
            user_id: user.id,
            parent_id: parentId,
            title: "Untitled",
            icon: "📄",
            cover_url: null,
            content: [],
            sort_order: sortOrder,
            is_archived: false,
            is_favorite: false,
            is_published: false,
            full_width: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        // Optimistic update
        set((state) => ({ pages: [...state.pages, newPage] }));

        const { error } = await supabase.from("pages").insert({
            id: newPage.id,
            user_id: newPage.user_id,
            parent_id: newPage.parent_id,
            title: newPage.title,
            icon: newPage.icon,
            sort_order: newPage.sort_order,
            content: newPage.content,
        });

        if (error) {
            // Revert
            set((state) => ({ pages: state.pages.filter((p) => p.id !== newPage.id) }));
            toast.error("Failed to create page");
            return null;
        }

        return newPage;
    },

    updatePage: async (id, updates) => {
        const prev = get().pages.find((p) => p.id === id);
        if (!prev) return;

        // 1. Immediate optimistic UI update
        const updated_at = new Date().toISOString();
        set((state) => ({
            pages: state.pages.map((p) =>
                p.id === id ? { ...p, ...updates, updated_at } : p
            ),
        }));

        // 2. Accumulate updates for debounced batch save
        pendingUpdates[id] = { 
            ...(pendingUpdates[id] || {}), 
            ...updates,
            updated_at 
        };

        // 3. Clear existing timer to reset debounce
        if (updateTimers[id]) {
            clearTimeout(updateTimers[id]);
        }

        // 4. Set debounce timer (e.g., 1 second)
        updateTimers[id] = setTimeout(async () => {
            // Include user_id from previous state to satisfy RLS/constraints during upsert
            const dataToSync = { 
                ...pendingUpdates[id], 
                id,
                user_id: prev.user_id 
            };
            
            // Clean up tracking before the async call
            delete pendingUpdates[id];
            delete updateTimers[id];

            const supabase = createClient();
            
            const { error } = await supabase
                .from("pages")
                .upsert(dataToSync);

            if (error) {
                console.error("Supabase sync error:", error.message, error.details, error.hint);
                toast.error(`Sync failed: ${error.message}`);
            }
        }, 1000);
    },

    fetchPageContent: async (id) => {
        const page = get().pages.find((p) => p.id === id);
        // Don't refetch if we already have content (unless it's an empty array which could be default)
        // Check for specific marker or just always check updated_at vs local
        if (page && page.content && Array.isArray(page.content) && page.content.length > 0) {
            return;
        }

        const supabase = createClient();
        const { data, error } = await supabase
            .from("pages")
            .select("content")
            .eq("id", id)
            .single();

        if (error) {
            console.error("Fetch content error:", error);
            return;
        }

        if (data) {
            set((state) => ({
                pages: state.pages.map((p) =>
                    p.id === id ? { ...p, content: data.content } : p
                ),
            }));
        }
    },

    deletePage: async (id) => {
        // Soft delete (archive)
        return get().archivePage(id);
    },

    archivePage: async (id) => {
        const { pages } = get();
        const prev = pages.find((p) => p.id === id);
        if (!prev) return;

        // Archive this page and all descendants
        const idsToArchive = new Set<string>();
        const collectDescendants = (parentId: string) => {
            idsToArchive.add(parentId);
            pages.filter((p) => p.parent_id === parentId).forEach((p) => collectDescendants(p.id));
        };
        collectDescendants(id);

        const prevPages = [...pages];
        set((state) => ({
            pages: state.pages.map((p) =>
                idsToArchive.has(p.id) ? { ...p, is_archived: true } : p
            ),
        }));

        const supabase = createClient();
        const { error } = await supabase
            .from("pages")
            .update({ is_archived: true })
            .in("id", Array.from(idsToArchive));

        if (error) {
            set({ pages: prevPages });
            toast.error("Failed to archive page");
        } else {
            toast.success("Page moved to trash");
        }
    },

    restorePage: async (id) => {
        const prev = get().pages.find((p) => p.id === id);
        if (!prev) return;

        set((state) => ({
            pages: state.pages.map((p) =>
                p.id === id ? { ...p, is_archived: false, parent_id: null } : p
            ),
        }));

        const supabase = createClient();
        const { error } = await supabase
            .from("pages")
            .update({ is_archived: false, parent_id: null })
            .eq("id", id);

        if (error) {
            set((state) => ({
                pages: state.pages.map((p) => (p.id === id ? prev : p)),
            }));
            toast.error("Failed to restore page");
        } else {
            toast.success("Page restored");
        }
    },

    permanentlyDeletePage: async (id) => {
        const { pages } = get();

        const idsToDelete = new Set<string>();
        const collectDescendants = (parentId: string) => {
            idsToDelete.add(parentId);
            pages.filter((p) => p.parent_id === parentId).forEach((p) => collectDescendants(p.id));
        };
        collectDescendants(id);

        const prevPages = [...pages];
        set((state) => ({
            pages: state.pages.filter((p) => !idsToDelete.has(p.id)),
        }));

        const supabase = createClient();
        const { error } = await supabase.from("pages").delete().in("id", Array.from(idsToDelete));

        if (error) {
            set({ pages: prevPages });
            toast.error("Failed to delete page");
        } else {
            toast.success("Page permanently deleted");
        }
    },

    movePage: async (id, newParentId, newIndex) => {
        const { pages } = get();
        const prevPages = [...pages];

        // Get sorted siblings at the target location (excluding the moving page)
        const siblings = pages
            .filter(
                (p) =>
                    p.parent_id === newParentId &&
                    !p.is_archived &&
                    p.id !== id
            )
            .sort((a, b) => (a.sort_order > b.sort_order ? 1 : -1));

        const before = newIndex > 0 ? siblings[newIndex - 1]?.sort_order ?? null : null;
        const after = newIndex < siblings.length ? siblings[newIndex]?.sort_order ?? null : null;

        let newSortOrder: string;
        try {
            newSortOrder = generateKeyBetween(before, after);
        } catch {
            // Fallback: regenerate all sort orders for siblings
            newSortOrder = generateKeyBetween(before, null);
        }

        // Optimistic update
        set((state) => ({
            pages: state.pages.map((p) =>
                p.id === id
                    ? { ...p, parent_id: newParentId, sort_order: newSortOrder }
                    : p
            ),
        }));

        const supabase = createClient();
        const { error } = await supabase
            .from("pages")
            .update({ parent_id: newParentId, sort_order: newSortOrder })
            .eq("id", id);

        if (error) {
            set({ pages: prevPages });
            toast.error("Failed to move page");
        }
    },

    toggleFavorite: async (id) => {
        const prev = get().pages.find((p) => p.id === id);
        if (!prev) return;

        set((state) => ({
            pages: state.pages.map((p) =>
                p.id === id ? { ...p, is_favorite: !p.is_favorite } : p
            ),
        }));

        const supabase = createClient();
        const { error } = await supabase
            .from("pages")
            .update({ is_favorite: !prev.is_favorite })
            .eq("id", id);

        if (error) {
            set((state) => ({
                pages: state.pages.map((p) => (p.id === id ? prev : p)),
            }));
            toast.error("Failed to update favorite");
        }
    },
}));
