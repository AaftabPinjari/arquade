"use client";

import { useState } from "react";
import { signIn, signUp } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Loader2 } from "lucide-react";

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
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="w-full max-w-md space-y-8">
                {/* Logo */}
                <div className="flex flex-col items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                        <FileText className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-3xl font-bold tracking-tight">Arquade</h1>
                        <p className="text-muted-foreground mt-2">
                            {isSignUp
                                ? "Create your workspace"
                                : "Welcome back to your workspace"}
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form action={handleSubmit} className="space-y-4">
                    {isSignUp && (
                        <div className="space-y-2">
                            <label
                                htmlFor="name"
                                className="text-sm font-medium leading-none"
                            >
                                Full name
                            </label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="John Doe"
                                required={isSignUp}
                                className="h-11"
                            />
                        </div>
                    )}
                    <div className="space-y-2">
                        <label
                            htmlFor="email"
                            className="text-sm font-medium leading-none"
                        >
                            Email
                        </label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            required
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <label
                            htmlFor="password"
                            className="text-sm font-medium leading-none"
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
                            className="h-11"
                        />
                    </div>

                    {error && (
                        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full h-11" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSignUp ? "Create account" : "Sign in"}
                    </Button>
                </form>

                {/* Toggle */}
                <p className="text-center text-sm text-muted-foreground">
                    {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                    <button
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError(null);
                        }}
                        className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                        {isSignUp ? "Sign in" : "Sign up"}
                    </button>
                </p>
            </div>
        </div>
    );
}
