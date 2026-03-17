"use client";

import { createReactBlockSpec } from "@blocknote/react";
import { useState, useEffect, useRef } from "react";
import { Globe, Eye, Code2 } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

// Dynamically import WebSandpackContent to keep the initial bundle light
const WebSandpackContent = dynamic(() => import("./web-sandpack-content"), {
  ssr: false,
  loading: () => (
    <div className="w-full flex items-center justify-center bg-muted/10 animate-pulse" style={{ height: "400px" }}>
      <div className="flex flex-col items-center gap-2">
        <Globe className="h-8 w-8 text-muted-foreground/40" />
        <span className="text-xs text-muted-foreground/40 font-medium">Loading preview...</span>
      </div>
    </div>
  )
});

const defaultCode = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Outfit', sans-serif; }
    .glass {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
  </style>
</head>
<body class="bg-[#050505] text-white min-h-screen flex items-center justify-center overflow-hidden">
  <div class="relative p-12 glass rounded-[40px] max-w-xl w-full mx-4 overflow-hidden group">
    <!-- Animated background blob -->
    <div class="absolute -top-24 -right-24 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
    <div class="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-600 rounded-full blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>

    <div class="relative z-10 text-center">
      <div class="inline-flex items-center justify-center w-20 h-20 mb-8 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-3xl shadow-2xl shadow-blue-500/20 transform group-hover:rotate-12 transition-transform duration-500">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      </div>

      <h1 class="text-5xl font-black mb-4 tracking-tight leading-none">
        Modern <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Web Preview</span>
      </h1>
      
      <p class="text-gray-400 text-lg mb-10 leading-relaxed font-medium">
        Experience seamless HTML, CSS, and JS development with real-time feedback and premium aesthetics.
      </p>

      <button class="px-8 py-4 bg-white text-black font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10 hover:shadow-white/20">
        Explore Features
      </button>
    </div>
  </div>

  <script>
    console.log("Web Preview Initialized!");
    // You can add JS logic here
  </script>
</body>
</html>`;

const WebSandboxBlockSpec = createReactBlockSpec(
  {
    type: "web-sandbox",
    propSchema: {
      code: {
        default: defaultCode,
      },
      height: {
        default: 500,
      },
      width: {
        default: "100%",
      },
    },
    content: "none",
  },
  {
    render: (props: any) => {
      const { resolvedTheme } = useTheme();
      const [showPreview, setShowPreview] = useState(true);
      const [mounted, setMounted] = useState(false);
      const [isResizing, setIsResizing] = useState(false);
      const [localHeight, setLocalHeight] = useState(props.block.props.height);
      const [localWidth, setLocalWidth] = useState(props.block.props.width);
      const containerRef = useRef<HTMLDivElement>(null);

      useEffect(() => {
        if (!isResizing) {
          setLocalHeight(props.block.props.height);
          setLocalWidth(props.block.props.width);
        }
      }, [props.block.props.height, props.block.props.width, isResizing]);

      useEffect(() => {
        setMounted(true);
      }, []);

      const onMouseDown = (e: React.MouseEvent, type: "height" | "width" | "diagonal") => {
        e.preventDefault();
        setIsResizing(true);
        
        const startX = e.clientX;
        const startY = e.clientY;
        const startHeight = props.block.props.height;
        const currentRect = containerRef.current?.getBoundingClientRect();
        const startWidth = currentRect?.width || 800;
        
        let latestHeight = startHeight;
        let latestWidth = props.block.props.width;

        const onMouseMove = (moveEvent: MouseEvent) => {
          const deltaX = moveEvent.clientX - startX;
          const deltaY = moveEvent.clientY - startY;

          if (type === "height" || type === "diagonal") {
            latestHeight = Math.max(250, Math.min(1500, startHeight + deltaY));
            setLocalHeight(latestHeight);
          }

          if (type === "width" || type === "diagonal") {
            const newWidthPx = Math.max(300, startWidth + deltaX);
            latestWidth = `${newWidthPx}px`;
            setLocalWidth(latestWidth);
          }
        };

        const onMouseUp = () => {
          setIsResizing(false);
          props.editor.updateBlock(props.block, {
            props: { 
              ...props.block.props, 
              height: latestHeight, 
              width: latestWidth 
            },
          });
          
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      };

      if (!mounted) return <div className="h-64 rounded-xl bg-orange-500/5 animate-pulse border border-orange-500/10" />;

      return (
        <div 
          ref={containerRef}
          style={{ 
            width: localWidth,
            margin: localWidth === "100%" ? "1.5rem 0" : "1.5rem auto",
            willChange: isResizing ? "width, height" : "auto",
            touchAction: "none"
          }}
          className={`group relative rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md overflow-hidden mx-auto ${isResizing ? 'ring-1 ring-orange-500/30' : ''}`} 
          contentEditable={false}
        >
          {isResizing && (
            <div className="absolute inset-0 z-[100] cursor-inherit" />
          )}

          {/* Header */}
          <div className="flex items-center justify-between border-b bg-muted/20 px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-500/10 text-orange-500">
                <Globe className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold tracking-tight text-foreground/80 lowercase">
                web-preview
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant={showPreview ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setShowPreview(true)}
                className="h-7 px-3 text-[11px] font-medium"
              >
                <Eye className="mr-1.5 h-3 w-3" />
                Preview
              </Button>
              <Button
                variant={!showPreview ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setShowPreview(false)}
                className="h-7 px-3 text-[11px] font-medium"
              >
                <Code2 className="mr-1.5 h-3 w-3" />
                HTML
              </Button>
            </div>
          </div>

          {/* Content */}
          <WebSandpackContent 
            code={props.block.props.code}
            theme={resolvedTheme === "dark" ? "dark" : "light"}
            height={localHeight}
            showPreview={showPreview}
            onCodeChange={(newCode) => {
              if (newCode !== props.block.props.code) {
                props.editor.updateBlock(props.block, {
                  props: { ...props.block.props, code: newCode },
                });
              }
            }}
          />

          {/* Resize Handles */}
          <div 
            onMouseDown={(e) => onMouseDown(e, "height")}
            className="absolute bottom-0 left-0 right-6 h-2.5 cursor-ns-resize bg-transparent hover:bg-orange-500/10 transition-colors z-[60] group/h-handle"
          >
            <div className="absolute inset-x-0 bottom-1 flex justify-center opacity-0 group-hover/h-handle:opacity-100 transition-opacity">
              <div className="h-1 w-12 rounded-full bg-orange-500/20" />
            </div>
          </div>

          <div 
            onMouseDown={(e) => onMouseDown(e, "width")}
            className="absolute top-0 right-0 bottom-6 w-2.5 cursor-ew-resize bg-transparent hover:bg-orange-500/10 transition-colors z-[60] group/w-handle"
          >
            <div className="absolute inset-y-0 right-1 flex flex-col justify-center opacity-0 group-hover/w-handle:opacity-100 transition-opacity">
              <div className="w-1 h-12 rounded-full bg-orange-500/20" />
            </div>
          </div>

          <div 
            onMouseDown={(e) => onMouseDown(e, "diagonal")}
            className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-[70] flex items-end justify-end p-1 group/d-handle"
          >
            <div className="w-2.5 h-2.5 rounded-br-lg border-r-2 border-b-2 border-muted-foreground/20 group-hover/d-handle:border-orange-500 transition-colors" />
          </div>
        </div>
      );
    },
  }
);

export const WebSandboxBlock = WebSandboxBlockSpec();
