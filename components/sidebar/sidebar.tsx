"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePageStore } from "@/stores/page-store";
import { useUIStore } from "@/stores/ui-store";
import { signOut } from "@/lib/actions/auth";
import { PageTree } from "./page-tree";
import { TrashBox } from "./trash-box";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
    ChevronsLeft,
    Plus,
    Search,
    Star,
    Trash2,
    LogOut,
    FileText,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";

import { useUserStore } from "@/stores/user-store";
import { UserSettings } from "./user-settings";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export function Sidebar() {
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const { profile } = useUserStore();
    const { addPage, pages, fetchPageContent } = usePageStore();
    const { toggleSidebar } = useUIStore();
    const [trashOpen, setTrashOpen] = useState(false);
    
    // Avoid hydration mismatch by waiting for mount
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const favorites = pages.filter((p) => p.is_favorite && !p.is_archived);

    async function handleCreatePage() {
        const page = await addPage(null);
        if (page) {
            router.push(`/workspace/${page.id}`);
        }
    }

    const userName = profile?.display_name || profile?.email?.split("@")[0] || "User";

    return (
        <div className="h-full w-full flex flex-col bg-sidebar">
            {/* Header / User Menu */}
            <div className="flex items-center justify-between px-2 h-11 shrink-0 group gap-1">
                <UserSettings>
                    <button className="flex items-center gap-2 hover:bg-accent rounded-md px-2 py-1 transition-colors min-w-0 flex-1">
                        <Avatar className="h-5 w-5 shrink-0">
                            <AvatarImage src={profile?.avatar_url || ""} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                                {userName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium truncate text-muted-foreground group-hover:text-foreground">
                            {userName}
                        </span>
                    </button>
                </UserSettings>
                <Button
                    onClick={toggleSidebar}
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:bg-accent transition-colors"
                >
                    <ChevronsLeft className="h-4 w-4" />
                </Button>
            </div>

            <Separator />

            {/* Quick actions */}
            <div className="px-2 py-1 space-y-0.5">
                <button
                    onClick={() => { }}
                    className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                    <Search className="h-4 w-4" />
                    <span>Search</span>
                </button>
            </div>

            <Separator />

            {/* Favorites */}
            {favorites.length > 0 && (
                <div className="px-2 py-1">
                    <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Favorites
                    </p>
                    <div className="space-y-0.5">
                        {favorites.map((page) => (
                            <Link
                                key={page.id}
                                href={`/workspace/${page.id}`}
                                onMouseEnter={() => fetchPageContent(page.id)}
                                className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors truncate"
                            >
                                <span className="shrink-0">{page.icon}</span>
                                <span className="truncate">{page.title}</span>
                                <Star className="h-3 w-3 ml-auto shrink-0 text-yellow-500 fill-yellow-500" />
                            </Link>
                        ))}
                    </div>
                    <Separator className="mt-1" />
                </div>
            )}

            {/* Page Tree */}
            <div className="flex-1 min-h-0">
                <div className="flex items-center justify-between px-2 py-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Pages
                    </p>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-muted-foreground hover:text-foreground"
                        onClick={handleCreatePage}
                    >
                        <Plus className="h-3.5 w-3.5" />
                    </Button>
                </div>
                <ScrollArea className="flex-1" style={{ height: "calc(100% - 28px)" }}>
                    <PageTree />
                </ScrollArea>
            </div>

            {/* Bottom actions */}
            <div className="shrink-0 border-t border-border px-2 py-1.5 space-y-0.5">
                <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                    {!mounted ? (
                        <div className="h-4 w-4" /> // Spacing placeholder
                    ) : theme === "dark" ? (
                        <Sun className="h-4 w-4" />
                    ) : (
                        <Moon className="h-4 w-4" />
                    )}
                    <span>{!mounted ? "Mode" : theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                </button>
                <Dialog open={trashOpen} onOpenChange={setTrashOpen}>
                    <DialogTrigger asChild>
                        <button className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                            <Trash2 className="h-4 w-4" />
                            <span>Trash</span>
                        </button>
                    </DialogTrigger>
                    <DialogContent className="p-0 sm:max-w-md bg-background overflow-hidden border-none shadow-2xl">
                        <DialogHeader className="p-4 py-3 border-b space-y-0">
                           <DialogTitle className="text-sm font-semibold flex items-center gap-2">
                               <Trash2 className="h-4 w-4" />
                               Trash
                           </DialogTitle>
                        </DialogHeader>
                        <div className="p-1">
                            <TrashBox onClose={() => setTrashOpen(false)} />
                        </div>
                    </DialogContent>
                </Dialog>
                <button
                    onClick={() => signOut()}
                    className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    <span>Log out</span>
                </button>
            </div>
        </div>
    );
}
