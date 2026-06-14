import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function WorkspaceLoading() {
    return (
        <div className="h-screen w-screen flex bg-background overflow-hidden select-none">
            {/* Sidebar Skeleton */}
            <aside className="w-60 h-full border-r border-border bg-sidebar flex flex-col shrink-0">
                {/* User Info Header */}
                <div className="flex items-center gap-2 px-4 h-11 shrink-0">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-4 w-24 rounded-md" />
                </div>
                
                <Separator />
                
                {/* Search / Action Block */}
                <div className="p-2 py-3">
                    <Skeleton className="h-8 w-full rounded-md" />
                </div>
                
                <Separator />
                
                {/* Favorites List */}
                <div className="p-3 space-y-3">
                    <Skeleton className="h-3 w-16 rounded" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-full rounded-md" />
                        <Skeleton className="h-6 w-[90%] rounded-md" />
                    </div>
                </div>
                
                <Separator />
                
                {/* Pages List */}
                <div className="flex-1 p-3 space-y-3">
                    <Skeleton className="h-3 w-14 rounded" />
                    <div className="space-y-2.5">
                        <Skeleton className="h-6 w-[80%] rounded-md" />
                        <div className="pl-4 space-y-2.5">
                            <Skeleton className="h-6 w-[85%] rounded-md" />
                            <Skeleton className="h-6 w-[70%] rounded-md" />
                        </div>
                        <Skeleton className="h-6 w-[90%] rounded-md" />
                        <Skeleton className="h-6 w-[75%] rounded-md" />
                    </div>
                </div>
                
                {/* Bottom Profile Settings Block */}
                <div className="border-t border-border p-3 space-y-2 mt-auto">
                    <Skeleton className="h-8 w-full rounded-md" />
                    <Skeleton className="h-8 w-full rounded-md" />
                </div>
            </aside>

            {/* Main Content Area Skeleton */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Topbar PageHeader Header */}
                <div className="h-11 border-b border-border/50 flex items-center justify-between px-6 bg-background/50">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded-md" />
                        <Skeleton className="h-4 w-28 rounded-md" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-7 w-12 rounded-md" />
                        <Skeleton className="h-7 w-20 rounded-md" />
                    </div>
                </div>
                
                {/* Document Body Skeleton */}
                <div className="max-w-4xl w-full mx-auto py-16 px-8 md:px-12 space-y-8 flex-1 overflow-y-auto">
                    {/* Page Icon placeholder */}
                    <div className="space-y-4">
                        <Skeleton className="h-14 w-14 rounded-2xl" />
                        {/* Title placeholder */}
                        <Skeleton className="h-10 w-[55%] rounded-lg" />
                    </div>
                    
                    {/* Paragraph line blocks */}
                    <div className="space-y-4 pt-4">
                        <Skeleton className="h-5 w-[85%] rounded" />
                        <Skeleton className="h-5 w-[80%] rounded" />
                        <Skeleton className="h-5 w-[65%] rounded" />
                        <div className="space-y-2.5 pl-4 pt-2">
                            <Skeleton className="h-5 w-[75%] rounded" />
                            <Skeleton className="h-5 w-[70%] rounded" />
                        </div>
                    </div>
                    
                    <div className="space-y-4 pt-4">
                        <Skeleton className="h-5 w-[90%] rounded" />
                        <Skeleton className="h-5 w-[45%] rounded" />
                    </div>
                </div>
            </main>
        </div>
    );
}
