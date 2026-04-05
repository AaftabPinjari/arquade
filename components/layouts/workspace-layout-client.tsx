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

    return (
        <div className="h-screen flex overflow-hidden bg-background">
            <Toaster position="bottom-right" richColors />
            {/* Sidebar */}
            <aside
                className={cn(
                    "h-full flex-shrink-0 border-r border-border bg-sidebar transition-all duration-200 ease-in-out overflow-hidden relative",
                    sidebarOpen ? "w-60" : "w-0"
                )}
            >
                <div className="w-60 h-full">
                    <Sidebar />
                </div>
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
                <div className="flex-1 overflow-y-auto w-full">{children}</div>
            </main>
        </div>
    );
}
