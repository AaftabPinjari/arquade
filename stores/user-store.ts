import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Profile } from "@/types";

interface UserState {
    profile: Profile | null;
    setProfile: (profile: Profile | null) => void;
    updateProfile: (updates: Partial<Profile>) => Promise<void>;
    isLoading: boolean;
}

export const useUserStore = create<UserState>((set, get) => ({
    profile: null,
    isLoading: true,
    setProfile: (profile) => set({ profile, isLoading: false }),
    updateProfile: async (updates) => {
        const { profile } = get();
        if (!profile) return;

        // Optimistic update
        const previousProfile = { ...profile };
        set({ profile: { ...profile, ...updates } });

        const supabase = createClient();
        const { error } = await supabase
            .from("profiles")
            .update(updates)
            .eq("id", profile.id);

        if (error) {
            set({ profile: previousProfile });
            toast.error("Failed to update profile");
            return;
        }

        toast.success("Profile updated");
    },
}));
