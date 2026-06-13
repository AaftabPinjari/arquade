import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const userApiKey = req.headers.get("x-gemini-api-key");
    const apiKey = userApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { 
                error: "Gemini API key is not configured. Please paste your Gemini API Key using the settings key icon (🔑) in the Page AI panel.",
                code: "MISSING_API_KEY"
            },
            { status: 400 }
        );
    }

    try {
        const { pageTitle, pageContent, messages } = await req.json();

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: "Messages history is required" }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        
        // Ground the AI on the current document
        const systemInstruction = `You are an AI assistant integrated into a Notion-like workspace application called "Arquade".
Your task is to help the user with their document.
Document Title: "${pageTitle || "Untitled"}"
Document Content:
"""
${pageContent || ""}
"""

Ground all your answers strictly on this document context. If the user asks you to summarize, extract tasks, brainstorm, or rewrite, perform the action based on the document content above.
Always output standard Markdown formatting in your answers. Keep your answers clear, concise, and helpful.`;

        const model = genAI.getGenerativeModel({
            model: "gemini-3.1-flash-lite",
            systemInstruction,
        });

        // Format history for Gemini API
        // Gemini expects messages in the format: { role: "user" | "model", parts: [{ text: string }] }
        const formattedContents = messages.map((msg: any) => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }],
        }));

        const resultStream = await model.generateContentStream({
            contents: formattedContents,
        });

        // Create a ReadableStream to stream the chunks back to the client
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of resultStream.stream) {
                        const chunkText = chunk.text();
                        if (chunkText) {
                            controller.enqueue(encoder.encode(chunkText));
                        }
                    }
                    controller.close();
                } catch (err) {
                    controller.error(err);
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });
    } catch (error: any) {
        console.error("Gemini API stream error:", error);
        return NextResponse.json({ error: error.message || "Failed to generate AI response" }, { status: 500 });
    }
}
