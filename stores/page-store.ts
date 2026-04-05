import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { generateKeyBetween } from "fractional-indexing";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "./user-store";
import type { Page } from "@/types";

interface PageStore {
    pages: Page[];
    isLoaded: boolean;
    loadedContentIds: Set<string>;
    _hasHydrated: boolean;
    setPages: (pages: Page[]) => void;

    addPage: (parentId: string | null) => Promise<Page | null>;
    updatePage: (id: string, updates: Partial<Page>) => Promise<void>;
    fetchPageContent: (id: string) => Promise<void>;
    fetchAllContent: () => Promise<void>;
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
    clearTrash: () => Promise<void>;
}

// Debounce tracking for Supabase sync
const pendingUpdates: Record<string, any> = {};
const updateTimers: Record<string, NodeJS.Timeout> = {};

export const usePageStore = create<PageStore>()(
    persist(
        (set, get) => ({
            pages: [],
            isLoaded: false,
            loadedContentIds: new Set(),
            _hasHydrated: false,

            setPages: (pages) => set({ pages, isLoaded: true }),

            addPage: async (parentId) => {
                const { profile } = useUserStore.getState();
                if (!profile) {
                    toast.error("You must be logged in to create a page");
                    return null;
                }

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
                    user_id: profile.id,
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

                // 1. Immediate optimistic UI update - this is what makes it "instant"
                set((state) => ({ pages: [...state.pages, newPage] }));

                // 2. Background sync with Supabase
                const supabase = createClient();
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
                    // Revert on error
                    set((state) => ({ pages: state.pages.filter((p) => p.id !== newPage.id) }));
                    toast.error("Failed to sync new page to database");
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
                const { pages, loadedContentIds } = get();
                
                // 1. Check if we've already attempted to load this or it already has content
                if (loadedContentIds.has(id)) return;
                
                const page = pages.find((p) => p.id === id);
                if (page && page.content && Array.isArray(page.content) && page.content.length > 0) {
                    // Mark it as loaded if it came with content
                    set((state) => {
                        const updatedIds = new Set(state.loadedContentIds);
                        updatedIds.add(id);
                        return { loadedContentIds: updatedIds };
                    });
                    return;
                }

                // 2. Fetch from database
                const supabase = createClient();
                const { data, error } = await supabase
                    .from("pages")
                    .select("content")
                    .eq("id", id)
                    .single();

                if (error) {
                    console.error("Fetch content error:", error);
                    // Still mark as loaded to avoid repeated failed attempts
                    set((state) => {
                        const updatedIds = new Set(state.loadedContentIds);
                        updatedIds.add(id);
                        return { loadedContentIds: updatedIds };
                    });
                    return;
                }

                if (data) {
                    set((state) => {
                        const updatedIds = new Set(state.loadedContentIds);
                        updatedIds.add(id);
                        return {
                            loadedContentIds: updatedIds,
                            pages: state.pages.map((p) =>
                                p.id === id ? { ...p, content: data.content } : p
                            ),
                        };
                    });
                }
            },

            // Fetch content for ALL pages in the background
            fetchAllContent: async () => {
                const { pages, loadedContentIds } = get();
                const pagesToFetch = pages.filter(
                    (p) => !p.is_archived && !loadedContentIds.has(p.id) && 
                           (!p.content || !Array.isArray(p.content) || p.content.length === 0)
                );

                if (pagesToFetch.length === 0) return;

                // Fetch all content in a single batch query
                const supabase = createClient();
                const { data, error } = await supabase
                    .from("pages")
                    .select("id, content")
                    .in("id", pagesToFetch.map(p => p.id));

                if (error) {
                    console.error("Background content sync error:", error);
                    return;
                }

                if (data && data.length > 0) {
                    const contentMap = new Map(data.map(d => [d.id, d.content]));
                    set((state) => {
                        const updatedIds = new Set(state.loadedContentIds);
                        data.forEach(d => updatedIds.add(d.id));
                        return {
                            loadedContentIds: updatedIds,
                            pages: state.pages.map((p) => {
                                const content = contentMap.get(p.id);
                                if (content !== undefined) {
                                    return { ...p, content };
                                }
                                return p;
                            }),
                        };
                    });
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

            clearTrash: async () => {
                const { pages } = get();
                const archivedIds = pages.filter((p) => p.is_archived).map((p) => p.id);
                
                if (archivedIds.length === 0) return;

                const prevPages = [...pages];
                set((state) => ({
                    pages: state.pages.filter((p) => !p.is_archived),
                }));

                const supabase = createClient();
                const { error } = await supabase
                    .from("pages")
                    .delete()
                    .in("id", archivedIds);

                if (error) {
                    set({ pages: prevPages });
                    toast.error("Failed to clear trash");
                } else {
                    toast.success("Trash cleared");
                }
            },
        }),
        {
            name: "arquade-pages",
            storage: createJSONStorage(() => localStorage),
            // Only persist serializable data — exclude Sets and functions
            partialize: (state) => ({
                pages: state.pages,
                isLoaded: state.isLoaded,
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    // Rebuild loadedContentIds from pages that already have content
                    const ids = new Set<string>();
                    state.pages.forEach((p) => {
                        if (p.content && Array.isArray(p.content)) {
                            ids.add(p.id);
                        }
                    });
                    // Use direct mutation since we're inside onRehydrate callback
                    usePageStore.setState({ 
                        loadedContentIds: ids,
                        _hasHydrated: true 
                    });
                }
            },
        }
    )
);
