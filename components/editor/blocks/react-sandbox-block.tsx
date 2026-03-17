"use client";

import { createReactBlockSpec } from "@blocknote/react";
import { 
  SandpackProvider, 
  SandpackLayout, 
  SandpackCodeEditor, 
  SandpackPreview,
  useSandpack
} from "@codesandbox/sandpack-react";
import { useState, useEffect, useRef } from "react";
import { Code2, Eye } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

// A small helper to sync the code from Sandpack back to BlockNote
const CodeSync = ({ onCodeChange }: { onCodeChange: (code: string) => void }) => {
  const { sandpack } = useSandpack();
  
  useEffect(() => {
    const code = sandpack.files["/App.js"].code;
    onCodeChange(code);
  }, [sandpack.files, onCodeChange]);

  return null;
};

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
      const containerRef = useRef<HTMLDivElement>(null);

      useEffect(() => {
        setMounted(true);
      }, []);

      const onMouseDown = (e: React.MouseEvent, type: "height" | "width" | "diagonal") => {
        e.preventDefault();
        const startX = e.clientX;
        const startY = e.clientY;
        const startHeight = props.block.props.height;
        const startWidth = containerRef.current?.offsetWidth || 800;

        const onMouseMove = (moveEvent: MouseEvent) => {
          const deltaX = moveEvent.clientX - startX;
          const deltaY = moveEvent.clientY - startY;

          if (type === "height" || type === "diagonal") {
            const newHeight = Math.max(250, Math.min(1200, startHeight + deltaY));
            props.editor.updateBlock(props.block, {
              props: { ...props.block.props, height: newHeight },
            });
          }

          if (type === "width" || type === "diagonal") {
            const newWidth = Math.max(300, startWidth + deltaX);
            props.editor.updateBlock(props.block, {
              props: { ...props.block.props, width: `${newWidth}px` },
            });
          }
        };

        const onMouseUp = () => {
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      };

      if (!mounted) return <div className="h-64 rounded-xl bg-muted animate-pulse" />;

      return (
        <div 
          ref={containerRef}
          style={{ 
            width: props.block.props.width,
            margin: props.block.props.width === "100%" ? "1rem 0" : "1rem auto"
          }}
          className="group relative rounded-2xl border bg-card shadow-sm transition-all hover:shadow-md overflow-hidden mx-auto" 
          contentEditable={false}
        >
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

          {/* Sandpack */}
          <div style={{ height: props.block.props.height }}>
            <SandpackProvider
              template="react"
              theme={resolvedTheme === "dark" ? "dark" : "light"}
              files={{
                "/App.js": props.block.props.code,
              }}
              customSetup={{
                dependencies: {
                  "lucide-react": "latest",
                  "framer-motion": "latest",
                  "clsx": "latest",
                  "tailwind-merge": "latest"
                }
              }}
              options={{
                recompileDelay: 500,
                externalResources: ["https://cdn.tailwindcss.com"]
              }}
            >
              <SandpackLayout className="!rounded-none !border-none">
                {!showPreview ? (
                  <SandpackCodeEditor 
                    showLineNumbers 
                    showTabs={false}
                    className="w-full flex-1"
                    style={{ height: props.block.props.height }}
                  />
                ) : (
                  <SandpackPreview 
                    showOpenInCodeSandbox={false}
                    className="!bg-background w-full flex-1"
                    style={{ height: props.block.props.height }}
                  />
                )}
              </SandpackLayout>
              
              <CodeSync 
                onCodeChange={(newCode) => {
                  if (newCode !== props.block.props.code) {
                    props.editor.updateBlock(props.block, {
                      props: { ...props.block.props, code: newCode },
                    });
                  }
                }} 
              />
            </SandpackProvider>
          </div>

          {/* Resize: Vertical Handle */}
          <div 
            onMouseDown={(e) => onMouseDown(e, "height")}
            className="absolute bottom-0 left-0 right-4 h-1.5 cursor-ns-resize bg-transparent hover:bg-blue-500/40 transition-colors z-10"
          />

          {/* Resize: Horizontal Handle */}
          <div 
            onMouseDown={(e) => onMouseDown(e, "width")}
            className="absolute top-0 right-0 bottom-4 w-1.5 cursor-ew-resize bg-transparent hover:bg-blue-500/40 transition-colors z-10"
          />

          {/* Resize: Diagonal Handle */}
          <div 
            onMouseDown={(e) => onMouseDown(e, "diagonal")}
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-20 flex items-center justify-center group/diag"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 group-hover/diag:bg-blue-500 transition-colors" />
          </div>
        </div>
      );
    },
  }
);

export const ReactSandboxBlock = ReactSandboxBlockSpec();
