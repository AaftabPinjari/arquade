import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col h-full w-full">
      {/* Skeleton for PageHeader */}
      <div className="h-[200px] w-full bg-muted/20 relative">
        <div className="absolute -bottom-8 left-12 h-16 w-16 rounded-2xl bg-muted animate-pulse border-4 border-background" />
      </div>
      
      <div className="max-w-4xl mx-auto w-full py-16 px-12 space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
        
        <div className="space-y-4 pt-8">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
          <Skeleton className="h-4 w-full" />
        </div>

        <div className="pt-12">
            <Skeleton className="h-[400px] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
