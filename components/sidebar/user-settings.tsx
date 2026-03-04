"use client";

import { useState, useEffect } from "react";
import { useUserStore } from "@/stores/user-store";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserSettingsProps {
    children?: React.ReactNode;
}

export function UserSettings({ children }: UserSettingsProps) {
    const { profile, updateProfile } = useUserStore();
    const [displayName, setDisplayName] = useState("");
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (profile?.display_name) {
            setDisplayName(profile.display_name);
        }
    }, [profile]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        await updateProfile({ display_name: displayName });
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Account Settings</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSave} className="space-y-4 py-4">
                    <div className="flex flex-col items-center gap-4 mb-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={profile?.avatar_url || ""} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                                {profile?.display_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <p className="text-sm text-muted-foreground">{profile?.email}</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                            id="displayName"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Your name"
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            Save Changes
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
