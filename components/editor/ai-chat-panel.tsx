"use client";

import { useState, useEffect, useRef } from "react";
import {
    X,
    Sparkles,
    Send,
    Loader2,
    Brain,
    ListTodo,
    FileText,
    Bot,
    User,
    KeyRound,
    Copy,
    Check
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Page } from "@/types";

interface AIChatPanelProps {
    page: Page;
    pageContent: string;
    onClose: () => void;
}

interface Message {
    role: "user" | "model";
    content: string;
}

// Lightweight Markdown Formatter
function formatMarkdown(text: string) {
    if (!text) return null;
    return text.split("\n").map((line, i) => {
        let formatted = line;

        // Bold: **text** -> <strong>text</strong>
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

        // Inline Code: `code` -> <code>code</code>
        formatted = formatted.replace(
            /`(.*?)`/g,
            '<code class="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px] text-foreground font-semibold border border-border/40">$1</code>'
        );

        // Bullet list formatting
        if (formatted.startsWith("* ") || formatted.startsWith("- ")) {
            return (
                <li
                    key={i}
                    className="ml-4 list-disc text-[13px] text-foreground/90 my-1 pl-0.5 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatted.substring(2) }}
                />
            );
        }

        // Numbered list formatting
        const matchNumbered = formatted.match(/^(\d+)\.\s(.*)/);
        if (matchNumbered) {
            return (
                <li
                    key={i}
                    className="ml-4 list-decimal text-[13px] text-foreground/90 my-1 pl-0.5 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: matchNumbered[2] }}
                />
            );
        }

        if (formatted.trim() === "") {
            return <div key={i} className="h-2" />;
        }

        return (
            <p
                key={i}
                className="text-[13px] text-foreground/90 leading-relaxed my-1"
                dangerouslySetInnerHTML={{ __html: formatted }}
            />
        );
    });
}

export function AIChatPanel({ page, pageContent, onClose }: AIChatPanelProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [apiKey, setApiKey] = useState("");
    const [showKeyConfig, setShowKeyConfig] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleCopy = (content: string, index: number) => {
        if (!content) return;
        navigator.clipboard.writeText(content);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    // Load API Key from localStorage on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedKey = localStorage.getItem("arquade_gemini_api_key");
            if (savedKey) {
                setApiKey(savedKey);
            }
        }
    }, []);

    // Auto-scroll chat history to bottom when new message arrives
    useEffect(() => {
        if (scrollRef.current) {
            const scrollArea = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
            if (scrollArea) {
                scrollArea.scrollTop = scrollArea.scrollHeight;
            }
        }
    }, [messages]);

    const handleSend = async (textToSend: string) => {
        if (!textToSend.trim() || isLoading) return;

        const userMsg: Message = { role: "user", content: textToSend };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput("");
        setIsLoading(true);

        // Append an empty bot message to populate stream responses
        setMessages((prev) => [...prev, { role: "model", content: "" }]);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(apiKey ? { "x-gemini-api-key": apiKey } : {})
                },
                body: JSON.stringify({
                    pageTitle: page.title,
                    pageContent,
                    messages: updatedMessages,
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                const err = new Error(errData.error || "Failed to call Gemini API");
                (err as any).code = errData.code;
                throw err;
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error("Could not construct streaming reader.");

            const decoder = new TextDecoder();
            let done = false;
            let currentReply = "";

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                const chunk = decoder.decode(value, { stream: true });
                currentReply += chunk;

                setMessages((prev) => {
                    const next = [...prev];
                    next[next.length - 1] = { role: "model", content: currentReply };
                    return next;
                });
            }
        } catch (err: any) {
            console.error("AI assistant error:", err);

            const isMissingKey = err.code === "MISSING_API_KEY" || err.message?.includes("Gemini API key is not configured");
            if (isMissingKey) {
                setShowKeyConfig(true);
            }

            setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = {
                    role: "model",
                    content: `⚠️ **API Key Required:** ${err.message || "Gemini API key is not configured."} ${isMissingKey
                            ? "Please enter your Gemini API Key in the settings panel above."
                            : "Please check your network and key, then try again."
                        }`,
                };
                return next;
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col overflow-hidden bg-background border-l border-border md:shadow-2xs">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border select-none shrink-0 bg-muted/20">
                <div className="flex items-center gap-2">
                    <div className="bg-violet-500/10 dark:bg-violet-500/20 rounded-lg p-1.5">
                        <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400 animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground leading-none">Arquade AI</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">Grounded in page context</span>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    {/* Key Config Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "h-7 w-7 rounded-md transition-colors",
                            showKeyConfig
                                ? "text-violet-600 bg-violet-500/10 hover:bg-violet-500/20"
                                : "text-muted-foreground hover:bg-accent"
                        )}
                        onClick={() => setShowKeyConfig(!showKeyConfig)}
                        title="Configure Gemini API Key"
                    >
                        <KeyRound className="h-4 w-4" />
                    </Button>
                    {/* Close Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:bg-accent rounded-md"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* API Key Configuration Banner */}
            <div 
                className={cn(
                    "grid transition-all duration-300 ease-in-out border-border bg-violet-500/5",
                    showKeyConfig ? "grid-rows-[1fr] border-b opacity-100" : "grid-rows-[0fr] border-b-0 opacity-0"
                )}
            >
                <div className="overflow-hidden">
                    <div className="p-3.5 text-xs space-y-2.5">
                        <div className="flex items-center justify-between font-semibold text-foreground">
                            <span className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400">
                                <KeyRound className="h-3.5 w-3.5" />
                                Gemini API Key
                            </span>
                        </div>
                        <p className="text-muted-foreground text-[11px] leading-normal">
                            Paste your personal Gemini API Key below. Your key is stored strictly on your local browser/device.
                        </p>
                        <div className="flex gap-2">
                            <Input
                                type="password"
                                placeholder={apiKey ? "••••••••••••••••" : "AIzaSy..."}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="h-8 text-[11px] rounded-md bg-background border-border/80 focus-visible:ring-violet-500"
                            />
                            <Button
                                size="sm"
                                className="h-8 px-3.5 text-[11px] rounded-md bg-violet-600 hover:bg-violet-700 text-white font-medium"
                                onClick={() => {
                                    if (typeof window !== "undefined") {
                                        if (apiKey.trim()) {
                                            localStorage.setItem("arquade_gemini_api_key", apiKey.trim());
                                        } else {
                                            localStorage.removeItem("arquade_gemini_api_key");
                                        }
                                    }
                                    setShowKeyConfig(false);
                                }}
                            >
                                Save
                            </Button>
                        </div>
                        <div className="flex justify-between items-center text-[10px] pt-0.5">
                            <a
                                href="https://aistudio.google.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-violet-600 dark:text-violet-400 hover:underline font-medium flex items-center gap-0.5"
                            >
                                Get a free API key from Google AI Studio →
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat History View */}
            <ScrollArea ref={scrollRef} className="flex-1 min-h-0 p-4">
                {messages.length === 0 ? (
                    <div className="h-[250px] flex flex-col items-center justify-center text-center px-4 space-y-4 select-none mt-4">
                        <div className="bg-violet-500/5 dark:bg-violet-500/10 rounded-full p-4 border border-violet-500/10 dark:border-violet-500/20">
                            <Sparkles className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-sm font-medium text-foreground">Ask anything about this page</h3>
                            <p className="text-xs text-muted-foreground max-w-[220px]">
                                Summarize text, list action items, or ask specific context-based questions.
                            </p>
                        </div>

                        {/* Quick Actions Chips */}
                        <div className="flex flex-col gap-2 w-full max-w-[240px] pt-4">
                            <button
                                onClick={() => handleSend("Summarize this page in a few bullet points.")}
                                className="flex items-center gap-2 text-left text-xs bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg border border-border/50 transition-colors"
                            >
                                <FileText className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                <span className="font-medium truncate">Summarize Page</span>
                            </button>
                            <button
                                onClick={() => handleSend("Extract all actionable items, tasks, and TODOs from this page.")}
                                className="flex items-center gap-2 text-left text-xs bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg border border-border/50 transition-colors"
                            >
                                <ListTodo className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                <span className="font-medium truncate">Extract Action Items</span>
                            </button>
                            <button
                                onClick={() => handleSend("Give me some creative brainstorming ideas or next steps related to this page.")}
                                className="flex items-center gap-2 text-left text-xs bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg border border-border/50 transition-colors"
                            >
                                <Brain className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                <span className="font-medium truncate">Brainstorm Next Steps</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 pb-4">
                        {messages.map((msg, index) => {
                            const isBot = msg.role === "model";
                            return (
                                <div
                                    key={index}
                                    className={cn(
                                        "flex gap-3 text-sm",
                                        isBot ? "items-start" : "items-start justify-end"
                                    )}
                                >
                                    {/* Avatar */}
                                    {isBot && (
                                        <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5 select-none">
                                            <Bot className="h-4 w-4 text-primary" />
                                        </div>
                                    )}

                                    {/* Message Bubble */}
                                    <div
                                        className={cn(
                                            "relative rounded-xl py-2 pl-3.5 shadow-2xs leading-relaxed group/bubble max-w-[85%]",
                                            isBot
                                                ? "bg-muted/40 text-foreground border border-border/30 pr-8"
                                                : "bg-primary text-primary-foreground font-normal pr-3.5"
                                        )}
                                    >
                                        {isBot ? (
                                            msg.content === "" ? (
                                                <div className="flex items-center gap-1.5 py-1 select-none">
                                                    <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
                                                    <span className="text-xs text-muted-foreground font-medium animate-pulse">Thinking...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="space-y-1">
                                                        {formatMarkdown(msg.content)}
                                                    </div>
                                                    <button
                                                        onClick={() => handleCopy(msg.content, index)}
                                                        className="absolute right-2 top-2 opacity-0 group-hover/bubble:opacity-100 focus:opacity-100 transition-opacity p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground bg-background/50 backdrop-blur-xs border border-border/40 cursor-pointer animate-in fade-in duration-150"
                                                        title="Copy response"
                                                    >
                                                        {copiedIndex === index ? (
                                                            <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                                        ) : (
                                                            <Copy className="h-3 w-3" />
                                                        )}
                                                    </button>
                                                </>
                                            )
                                        ) : (
                                            <p className="text-[13px]">{msg.content}</p>
                                        )}
                                    </div>

                                    {!isBot && (
                                        <div className="h-7 w-7 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0 mt-0.5 select-none">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </ScrollArea>

            {/* Input Bar */}
            <div className="p-3 border-t border-border bg-muted/10 shrink-0">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend(input);
                    }}
                    className="flex items-center gap-2"
                >
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about this page..."
                        disabled={isLoading}
                        className="h-9 rounded-lg border-border/80 bg-background text-[13px] focus-visible:ring-primary shadow-3xs"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={isLoading || !input.trim()}
                        className="h-9 w-9 rounded-lg shrink-0"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}
