"use client";

import { useState, useCallback, useRef } from "react";
import { usePageStore } from "@/stores/page-store";
import { createClient } from "@/lib/supabase/client";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ImagePlus, Maximize2, Minimize2, Smile, X } from "lucide-react";
import type { EmojiClickData } from "emoji-picker-react";
import type { Page } from "@/types";
import dynamic from "next/dynamic";
import { 
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// Lazy load the heavy emoji picker
const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
    ssr: false,
    loading: () => (
        <div className="w-[350px] h-[450px] bg-popover flex items-center justify-center border rounded-lg animate-pulse">
            <Smile className="h-8 w-8 text-muted-foreground/20" />
        </div>
    )
});

interface PageHeaderProps {
    page: Page;
}

export function PageHeader({ page }: PageHeaderProps) {
    const { updatePage } = usePageStore();
    const [title, setTitle] = useState(page.title);
    const [emojiOpen, setEmojiOpen] = useState(false);
    const titleRef = useRef<HTMLTextAreaElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const handleTitleChange = useCallback(
        (value: string) => {
            setTitle(value);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                updatePage(page.id, { title: value || "Untitled" });
            }, 500);
        },
        [page.id, updatePage]
    );

    const handleEmojiSelect = (emojiData: EmojiClickData) => {
        updatePage(page.id, { icon: emojiData.emoji });
        setEmojiOpen(false);
    };

    const toggleFullWidth = () => {
        updatePage(page.id, { full_width: !page.full_width });
    };

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const ext = file.name.split(".").pop();
        const path = `${user.id}/${page.id}/cover.${ext}`;

        const { error } = await supabase.storage
            .from("page-images")
            .upload(path, file, { upsert: true });

        if (!error) {
            const {
                data: { publicUrl },
            } = supabase.storage.from("page-images").getPublicUrl(path);
            updatePage(page.id, { cover_url: publicUrl });
        }
    };

    const removeCover = () => {
        updatePage(page.id, { cover_url: null });
    };

    const containerWidth = page.full_width ? "max-w-full px-12" : "max-w-4xl mx-auto px-12";

    return (
        <div className="relative">
            {/* Cover Image */}
            {page.cover_url && (
                <div className="relative h-[30vh] w-full group">
                    <img
                        src={page.cover_url}
                        alt="Page cover"
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <label>
                            <Button variant="secondary" size="sm" className="cursor-pointer" asChild>
                                <span>
                                    <ImagePlus className="h-3.5 w-3.5 mr-1" />
                                    Change cover
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleCoverUpload}
                                    />
                                </span>
                            </Button>
                        </label>
                        <Button variant="secondary" size="sm" onClick={removeCover}>
                            <X className="h-3.5 w-3.5 mr-1" />
                            Remove
                        </Button>
                    </div>
                </div>
            )}

            {/* Page header area */}
            <div className={`${containerWidth} pt-12 pb-2 relative group/header`}>
                {/* Hover actions for icon and cover when no cover exists */}
                <div className="absolute top-4 right-12 flex items-center gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity z-10">
                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:bg-muted"
                                    onClick={toggleFullWidth}
                                >
                                    {page.full_width ? (
                                        <Minimize2 className="h-4 w-4" />
                                    ) : (
                                        <Maximize2 className="h-4 w-4" />
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-[10px]">
                                {page.full_width ? "Standard width" : "Full width"}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {!page.cover_url && (
                        <label>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-muted-foreground text-xs cursor-pointer"
                                asChild
                            >
                                <span>
                                    <ImagePlus className="h-3.5 w-3.5 mr-1" />
                                    Add cover
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleCoverUpload}
                                    />
                                </span>
                            </Button>
                        </label>
                    )}
                </div>

                {/* Icon */}
                <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                    <PopoverTrigger asChild>
                        <button className="text-5xl mb-2 hover:opacity-80 transition-opacity -ml-1">
                            {page.icon}
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-none" align="start">
                        <EmojiPicker onEmojiClick={handleEmojiSelect} />
                    </PopoverContent>
                </Popover>

                {/* Title */}
                <textarea
                    ref={titleRef}
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Untitled"
                    className="w-full text-4xl font-bold bg-transparent outline-none resize-none placeholder:text-muted-foreground/50 leading-tight"
                    rows={1}
                    onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = "auto";
                        target.style.height = target.scrollHeight + "px";
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            // Move focus to editor
                            (document.querySelector(".bn-editor") as HTMLElement)?.focus();
                        }
                    }}
                />
            </div>
        </div>
    );
}
