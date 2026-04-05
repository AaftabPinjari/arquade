"use client";

import { useEffect } from "react";

/**
 * Registers the service worker for caching static assets.
 * Only registers in production to avoid interfering with HMR in dev.
 */
export function ServiceWorkerRegistration() {
    useEffect(() => {
        if (
            typeof window !== "undefined" &&
            "serviceWorker" in navigator &&
            process.env.NODE_ENV === "production"
        ) {
            // Register after the page has loaded to avoid competing with critical resources
            window.addEventListener("load", () => {
                navigator.serviceWorker
                    .register("/sw.js")
                    .then((registration) => {
                        console.log("[SW] Registered:", registration.scope);
                    })
                    .catch((error) => {
                        console.error("[SW] Registration failed:", error);
                    });
            });
        }
    }, []);

    return null;
}
