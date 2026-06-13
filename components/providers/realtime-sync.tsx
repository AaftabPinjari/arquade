"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePageStore } from "@/stores/page-store";
import { useUserStore } from "@/stores/user-store";

export function RealtimeSync() {
    const { profile } = useUserStore();
    
    useEffect(() => {
        if (!profile) return;
        
        const supabase = createClient();
        
        // Subscribe to changes on the pages table for the current user
        const channel = supabase
            .channel(`realtime-pages-${profile.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*", // Listen to INSERT, UPDATE, and DELETE
                    schema: "public",
                    table: "pages",
                    filter: `user_id=eq.${profile.id}`,
                },
                (payload) => {
                    const { eventType, new: newRecord, old: oldRecord } = payload;
                    
                    if (eventType === "INSERT") {
                        const newPage = newRecord as any;
                        usePageStore.setState((state) => {
                            // Avoid adding duplicates
                            if (state.pages.some((p) => p.id === newPage.id)) {
                                return state;
                            }
                            return {
                                pages: [...state.pages, newPage],
                            };
                        });
                    } else if (eventType === "UPDATE") {
                        const updatedPage = newRecord as any;
                        
                        usePageStore.setState((state) => {
                            const existing = state.pages.find((p) => p.id === updatedPage.id);
                            
                            // If local page doesn't exist, add it
                            if (!existing) {
                                return {
                                    pages: [...state.pages, updatedPage],
                                };
                            }
                            
                            // Only update if incoming update is strictly newer than local state
                            const incomingTime = new Date(updatedPage.updated_at).getTime();
                            const localTime = new Date(existing.updated_at).getTime();
                            
                            if (incomingTime > localTime) {
                                // If the incoming update has content, or if we need to preserve content
                                const content = updatedPage.content !== undefined 
                                    ? updatedPage.content 
                                    : existing.content;
                                    
                                return {
                                    pages: state.pages.map((p) =>
                                        p.id === updatedPage.id 
                                            ? { ...p, ...updatedPage, content } 
                                            : p
                                    ),
                                };
                            }
                            
                            return state;
                        });
                    } else if (eventType === "DELETE") {
                        const deletedId = oldRecord.id;
                        usePageStore.setState((state) => ({
                            pages: state.pages.filter((p) => p.id !== deletedId),
                        }));
                    }
                }
            )
            .subscribe();
            
        return () => {
            supabase.removeChannel(channel);
        };
    }, [profile]);

    return null;
}
