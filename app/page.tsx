import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, ArrowRight, LayoutDashboard, Zap, Shield, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/workspace");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 overflow-hidden relative">
      {/* Abstract Background Decoration */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-40 blur-[100px]"></div>
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 transition-all">
        <div className="container mx-auto max-w-6xl px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground shadow-sm">
              <FileText className="h-4 w-4" />
            </div>
            <span>Arquade</span>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <ModeToggle />
            <Link href="/login">
              <Button variant="ghost" className="hidden sm:inline-flex rounded-full px-5 font-medium transition-colors">
                Log in
              </Button>
            </Link>
            <Link href="/login">
              <Button className="rounded-full px-6 shadow-md hover:shadow-lg transition-all font-medium">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full pt-24 md:pt-36 pb-16 px-4 text-center flex flex-col items-center relative">
          
          <div className="inline-flex items-center rounded-full border border-border/50 bg-muted/30 px-3 py-1 text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out backdrop-blur-sm">
            <Sparkles className="mr-2 h-3.5 w-3.5 text-primary" />
            <span>Redefining how you work</span>
          </div>

          <h1 
            className="text-5xl md:text-7xl font-extrabold tracking-tighter text-balance max-w-4xl animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out fill-mode-both"
            style={{ animationDelay: '100ms' }}
          >
            Your thoughts, structured. <br className="hidden md:inline" />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Beautifully simple.
            </span>
          </h1>
          
          <p 
            className="mt-6 text-xl text-muted-foreground/90 max-w-2xl mx-auto leading-relaxed text-balance animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out fill-mode-both"
            style={{ animationDelay: '200ms' }}
          >
            Arquade is the premium workspace designed for clarity. 
            Bring your notes, documents, and ideas into a clean, distraction-free environment that empowers your finest work.
          </p>
          
          <div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 w-full px-4 sm:px-0 animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out fill-mode-both"
            style={{ animationDelay: '300ms' }}
          >
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-base h-14 px-8 rounded-full shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all group">
                Get started for free
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </section>

       
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background/40 backdrop-blur-md py-8 text-center text-muted-foreground">
        <div className="container mx-auto px-4 flex items-center justify-center gap-2 text-sm font-medium">
          <FileText className="h-4 w-4" />
          <span>© {new Date().getFullYear()} Arquade. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
