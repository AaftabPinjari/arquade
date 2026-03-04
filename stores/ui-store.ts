import { create } from "zustand";

interface UIStore {
    sidebarOpen: boolean;
    activePageId: string | null;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    setActivePageId: (id: string | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
    sidebarOpen: true,
    activePageId: null,
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    setActivePageId: (id) => set({ activePageId: id }),
}));
