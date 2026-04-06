"use client";

import { useState } from "react";
import { signIn, signUp } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/mode-toggle";
import { FileText, Loader2, ChevronLeft } from "lucide-react";
import Link from "next/link";
export default function LoginPage() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setError(null);
        setLoading(true);
        try {
            const result = isSignUp
                ? await signUp(formData)
                : await signIn(formData);
            if (result?.error) {
                setError(result.error);
            }
        } catch {
            // redirect throws, which is expected
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Abstract Background Decoration */}
            <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]">
                <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-40 blur-[100px]"></div>
            </div>

            {/* Top Navigation */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                <Link href="/">
                    <Button variant="ghost" size="sm" className="gap-2 rounded-full font-medium">
                        <ChevronLeft className="h-4 w-4" />
                        Back to Home
                    </Button>
                </Link>
                <ModeToggle />
            </div>

            <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out z-10 relative">
                <div className="absolute inset-0 -z-10 bg-background/50 backdrop-blur-xl rounded-[2.5rem] border border-border/40 shadow-2xl scale-[1.1]"></div>
                
                <div className="p-2 sm:p-4">
                    {/* Logo */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
                            <FileText className="h-8 w-8 text-primary-foreground" />
                        </div>
                        <div className="text-center">
                            <h1 className="text-3xl font-extrabold tracking-tight">Arquade</h1>
                            <p className="text-muted-foreground mt-2 font-medium">
                                {isSignUp
                                    ? "Create your workspace"
                                    : "Welcome back"}
                            </p>
                        </div>
                    </div>

                    {/* Form */}
                    <form action={handleSubmit} className="space-y-4 mt-8">
                        {isSignUp && (
                            <div className="space-y-2">
                                <label
                                    htmlFor="name"
                                    className="text-sm font-semibold leading-none"
                                >
                                    Full name
                                </label>
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    placeholder="John Doe"
                                    required={isSignUp}
                                    className="h-12 rounded-xl bg-background/50 focus-visible:bg-background"
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <label
                                htmlFor="email"
                                className="text-sm font-semibold leading-none"
                            >
                                Email
                            </label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                required
                                className="h-12 rounded-xl bg-background/50 focus-visible:bg-background"
                            />
                        </div>
                        <div className="space-y-2">
                            <label
                                htmlFor="password"
                                className="text-sm font-semibold leading-none"
                            >
                                Password
                            </label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                minLength={6}
                                className="h-12 rounded-xl bg-background/50 focus-visible:bg-background"
                            />
                        </div>

                        {error && (
                            <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium border border-destructive/20">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full h-12 rounded-full shadow-lg shadow-primary/20 mt-2 font-semibold text-base transition-all hover:scale-[1.02]" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSignUp ? "Create account" : "Sign in"}
                        </Button>
                    </form>

                    {/* Toggle */}
                    <p className="text-center text-sm text-muted-foreground mt-8 font-medium">
                        {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                        <button
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError(null);
                            }}
                            className="font-bold text-primary underline-offset-4 hover:underline transition-all"
                        >
                            {isSignUp ? "Sign in" : "Sign up"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
