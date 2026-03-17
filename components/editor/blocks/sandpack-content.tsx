"use client";

import { SandpackProvider, SandpackLayout, SandpackCodeEditor, SandpackPreview, useSandpack } from "@codesandbox/sandpack-react";
import { useEffect } from "react";

// Separated into its own component for lazy loading
const CodeSync = ({ onCodeChange }: { onCodeChange: (code: string) => void }) => {
  const { sandpack } = useSandpack();
  
  useEffect(() => {
    const code = sandpack.files["/App.js"].code;
    onCodeChange(code);
  }, [sandpack.files, onCodeChange]);

  return null;
};

export default function SandpackContent({ 
  code, 
  theme, 
  height, 
  showPreview, 
  onCodeChange 
}: { 
  code: string; 
  theme: "dark" | "light"; 
  height: number; 
  showPreview: boolean;
  onCodeChange: (code: string) => void;
}) {
  return (
    <div style={{ height }}>
      <SandpackProvider
        template="react"
        theme={theme}
        files={{
          "/App.js": code,
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
              style={{ height }}
            />
          ) : (
            <SandpackPreview 
              showOpenInCodeSandbox={false}
              className="!bg-background w-full flex-1"
              style={{ height }}
            />
          )}
        </SandpackLayout>
        
        <CodeSync onCodeChange={onCodeChange} />
      </SandpackProvider>
    </div>
  );
}
