"use client";

import PageViewClient from "./page-client";
import { use } from "react";

export default function Page({ params }: any) {
    const { pageId } = use(params);
    return <PageViewClient pageId={pageId} initialData={null} />;
}
