"use client";

import { createReactBlockSpec } from "@blocknote/react";
import { useState, useEffect, useRef } from "react";
import { Code2, Eye } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

// Dynamically import SandpackContent to keep the initial bundle light
const SandpackContent = dynamic(() => import("./sandpack-content"), {
  ssr: false,
  loading: () => (
    <div className="w-full flex items-center justify-center bg-muted/10 animate-pulse" style={{ height: "400px" }}>
      <div className="flex flex-col items-center gap-2">
        <Code2 className="h-8 w-8 text-muted-foreground/40" />
        <span className="text-xs text-muted-foreground/40 font-medium">Loading sandbox...</span>
      </div>
    </div>
  )
});

const ReactSandboxBlockSpec = createReactBlockSpec(
  {
    type: "react-sandbox",
    propSchema: {
      code: {
        default: `import React from 'react';\nimport { motion } from 'framer-motion';\nimport { Sparkles, Zap, Star } from 'lucide-react';\n\nexport default function App() {\n  return (\n    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 py-12 px-4 flex flex-col items-center justify-center text-white font-sans">\n      <motion.div\n        initial={{ scale: 0, rotate: -180 }}\n        animate={{ scale: 1, rotate: 0 }}\n        transition={{ type: "spring", stiffness: 260, damping: 20 }}\n        className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/20 shadow-2xl mb-8 flex items-center justify-center"\n      >\n        <Sparkles size={64} className="text-yellow-300 drop-shadow-lg" />\n      </motion.div>\n      \n      <motion.div\n        initial={{ y: 20, opacity: 0 }}\n        animate={{ y: 0, opacity: 1 }}\n        transition={{ delay: 0.2 }}\n        className="text-center"\n      >\n        <h1 className="text-5xl md:text-6xl font-black mb-4 tracking-tighter drop-shadow-md">\n          Tailwind + Motion\n        </h1>\n        <p className="text-xl text-white/80 font-medium mb-8 max-w-md mx-auto leading-relaxed">\n          Experience the power of real-time design with utility-first CSS and fluid animations.\n        </p>\n        \n        <div className="flex gap-4 justify-center flex-wrap">\n          <motion.button\n            whileHover={{ scale: 1.05 }}\n            whileTap={{ scale: 0.95 }}\n            className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-white/20 transition-all"\n          >\n            <Zap size={20} />\n            Get Started\n          </motion.button>\n          \n          <motion.button\n            whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.2)' }}\n            whileTap={{ scale: 0.95 }}\n            className="bg-white/10 border border-white/30 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 backdrop-blur-sm transition-all"\n          >\n            <Star size={20} />\n            Star on GitHub\n          </motion.button>\n        </div>\n      </motion.div>\n\n      {/* Feature Grid Demo */}\n      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-5xl w-full px-4">\n        {[1, 2, 3].map((i) => (\n          <motion.div \n            key={i}\n            initial={{ opacity: 0, y: 20 }}\n            animate={{ opacity: 1, y: 0 }}\n            transition={{ delay: 0.4 + (i * 0.1) }}\n            className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md"\n          >\n            <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center mb-4">\n              <Star size={20} className="text-white" />\n            </div>\n            <h3 className="text-lg font-bold mb-2 text-white">Feature {i}</h3>\n            <p className="text-sm text-white/60 leading-tight">Built-in support for multiple libraries.</p>\n          </motion.div>\n        ))}\n      </div>\n    </div>\n  );\n}`,
      },
      height: {
        default: 450,
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

      // Sync local state with props when props update externally (e.g. initial load or collab)
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
        
        // Use let variables to track the latest values for the onMouseUp callback
        let latestHeight = startHeight;
        let latestWidth = props.block.props.width;

        const onMouseMove = (moveEvent: MouseEvent) => {
          const deltaX = moveEvent.clientX - startX;
          const deltaY = moveEvent.clientY - startY;

          if (type === "height" || type === "diagonal") {
            latestHeight = Math.max(250, Math.min(1200, startHeight + deltaY));
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
          
          // Only update BlockNote state once at the end for performance
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

      if (!mounted) return <div className="h-64 rounded-xl bg-muted animate-pulse border" />;

      return (
        <div 
          ref={containerRef}
          style={{ 
            width: localWidth,
            margin: localWidth === "100%" ? "1rem 0" : "1rem auto",
            willChange: isResizing ? "width, height" : "auto",
            touchAction: "none"
          }}
          className={`group relative rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md overflow-hidden mx-auto ${isResizing ? 'ring-1 ring-blue-500/30' : ''}`} 
          contentEditable={false}
        >
          {/* Resize Overlay: Prevents iframe from stealing pointer events during resize */}
          {isResizing && (
            <div className="absolute inset-0 z-[100] cursor-inherit" />
          )}

          {/* Header */}
          <div className="flex items-center justify-between border-b bg-muted/20 px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/10 text-blue-500">
                <Code2 className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold tracking-tight text-foreground/80 lowercase">
                react-sandbox
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
                Editor
              </Button>
            </div>
          </div>

          {/* Dynamic Sandpack Content */}
          <SandpackContent 
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

          {/* Resize: Vertical Handle */}
          <div 
            onMouseDown={(e) => onMouseDown(e, "height")}
            className="absolute bottom-0 left-0 right-6 h-2.5 cursor-ns-resize bg-transparent hover:bg-blue-500/10 transition-colors z-[60] group/h-handle"
          >
            <div className="absolute inset-x-0 bottom-1 flex justify-center opacity-0 group-hover/h-handle:opacity-100 transition-opacity">
              <div className="h-1 w-12 rounded-full bg-blue-500/20" />
            </div>
          </div>

          {/* Resize: Horizontal Handle */}
          <div 
            onMouseDown={(e) => onMouseDown(e, "width")}
            className="absolute top-0 right-0 bottom-6 w-2.5 cursor-ew-resize bg-transparent hover:bg-blue-500/10 transition-colors z-[60] group/w-handle"
          >
            <div className="absolute inset-y-0 right-1 flex flex-col justify-center opacity-0 group-hover/w-handle:opacity-100 transition-opacity">
              <div className="w-1 h-12 rounded-full bg-blue-500/20" />
            </div>
          </div>

          {/* Resize: Diagonal Handle */}
          <div 
            onMouseDown={(e) => onMouseDown(e, "diagonal")}
            className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-[70] flex items-end justify-end p-1 group/d-handle"
          >
            <div className="w-2.5 h-2.5 rounded-br-lg border-r-2 border-b-2 border-muted-foreground/20 group-hover/d-handle:border-blue-500 transition-colors" />
          </div>
        </div>
      );
    },
  }
);

export const ReactSandboxBlock = ReactSandboxBlockSpec();
