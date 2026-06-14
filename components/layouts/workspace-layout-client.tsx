"use client";

import { useEffect, useState } from "react";
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
    const { sidebarOpen, sidebarWidth, setSidebarWidth, toggleSidebar, setActivePageId } = useUIStore();

    const [isDragging, setIsDragging] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Track if screen is mobile size to prevent resizing and handle defaults
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Resize handlers for the sidebar
    const startResizing = (mouseDownEvent: React.MouseEvent) => {
        mouseDownEvent.preventDefault();
        setIsDragging(true);
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const newWidth = e.clientX;
            const minWidth = 200;
            const maxWidth = Math.min(480, window.innerWidth * 0.4); // max 40% of screen width
            if (newWidth >= minWidth && newWidth <= maxWidth) {
                setSidebarWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging]);

    useEffect(() => {
        if (isDragging) {
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
        } else {
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        }
        return () => {
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };
    }, [isDragging]);

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
                    "fixed md:relative inset-y-0 left-0 h-full flex-shrink-0 border-r border-border bg-sidebar z-50 overflow-hidden",
                    !isDragging && "transition-all duration-300 ease-in-out",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 overflow-hidden"
                )}
                style={{
                    width: sidebarOpen ? (isMobile ? "240px" : `${sidebarWidth}px`) : "0px"
                }}
            >
                <div className="w-full h-full relative">
                    <Sidebar />
                    
                    {/* Resizable Drag Handle */}
                    {sidebarOpen && !isMobile && (
                        <div
                            onMouseDown={startResizing}
                            className={cn(
                                "absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-50 transition-all duration-150 hover:bg-violet-500/40",
                                isDragging ? "bg-violet-500/60 w-1.5" : "bg-transparent"
                            )}
                        />
                    )}
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
