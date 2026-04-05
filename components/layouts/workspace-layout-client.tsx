"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/sidebar/sidebar";
import { Toaster } from "sonner";

export function WorkspaceLayoutClient({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { sidebarOpen, toggleSidebar, setActivePageId } = useUIStore();

    // Track active page from URL
    useEffect(() => {
        const match = pathname.match(/\/workspace\/(.+)/);
        if (match) {
            setActivePageId(match[1]);
        } else {
            setActivePageId(null);
        }
    }, [pathname, setActivePageId]);

    // Close sidebar on mobile navigation
    useEffect(() => {
        if (sidebarOpen && window.innerWidth < 768) {
            toggleSidebar();
        }
    }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="h-screen flex overflow-hidden bg-background relative">
            <Toaster position="bottom-right" richColors />
            
            {/* Sidebar (Desktop flex / Mobile absolute) */}
            <aside
                className={cn(
                    "fixed md:relative inset-y-0 left-0 h-full flex-shrink-0 border-r border-border bg-sidebar transition-all duration-300 ease-in-out z-50 overflow-hidden",
                    sidebarOpen ? "w-60 translate-x-0" : "w-0 -translate-x-full md:translate-x-0 overflow-hidden"
                )}
            >
                <div className="w-60 h-full">
                    <Sidebar />
                </div>
            </aside>

            {/* Backdrop for mobile */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
                    onClick={toggleSidebar}
                />
            )}

            {/* Main content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Mobile/Closed Trigger Top Bar */}
                {!sidebarOpen && (
                    <div className="md:hidden h-12 flex items-center px-4 border-b border-border/50 shrink-0 bg-background/80 backdrop-blur-md z-30">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-accent"
                            onClick={toggleSidebar}
                        >
                            <PanelLeft className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                {/* Desktop Trigger (only if closed) */}
                <div className={cn(
                    "hidden md:block absolute top-4 left-4 z-40 md:z-10 transition-opacity",
                    sidebarOpen ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
                )}>
                    {!sidebarOpen && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-accent shadow-sm border border-border bg-sidebar"
                            onClick={toggleSidebar}
                        >
                            <PanelLeft className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto w-full no-scrollbar">
                    {children}
                </div>
            </main>
        </div>
    );
}
