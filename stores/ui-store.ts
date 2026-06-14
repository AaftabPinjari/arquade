import { create } from "zustand";

interface UIStore {
    sidebarOpen: boolean;
    sidebarWidth: number;
    activePageId: string | null;
    aiOpen: boolean;
    aiSelectedText: string | null;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    setSidebarWidth: (width: number) => void;
    setActivePageId: (id: string | null) => void;
    setAiOpen: (open: boolean) => void;
    setAiSelectedText: (text: string | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
    sidebarOpen: true,
    sidebarWidth: 240,
    activePageId: null,
    aiOpen: false,
    aiSelectedText: null,
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    setSidebarWidth: (width) => set({ sidebarWidth: width }),
    setActivePageId: (id) => set({ activePageId: id }),
    setAiOpen: (open) => set({ aiOpen: open }),
    setAiSelectedText: (text) => set({ aiSelectedText: text }),
}));
