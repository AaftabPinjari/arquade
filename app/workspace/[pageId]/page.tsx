"use client";

import PageViewClient from "./page-client";
import { use } from "react";

interface RouteParams {
    pageId: string;
}

export default function Page({ params }: { params: Promise<RouteParams> }) {
    const { pageId } = use(params);
    return <PageViewClient pageId={pageId} initialData={null} />;
}
