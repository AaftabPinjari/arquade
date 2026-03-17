import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import PageViewClient from "./page-client";

async function getPage(pageId: string) {
  const supabase = await createClient();

  const { data: page } = await supabase
    .from("pages")
    .select("title, icon")
    .eq("id", pageId)
    .single();

  return page;
}

export async function generateMetadata({ params }: any): Promise<Metadata> {
  const { pageId } = await params;
  const page = await getPage(pageId);

  return {
    title: page?.title ? `${page.icon || "📄"} ${page.title} - Arquade` : "Page - Arquade",
  };
}

export default async function Page({ params }: any) {
  const { pageId } = await params;
  return <PageViewClient />;
}
