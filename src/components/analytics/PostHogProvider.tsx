"use client";

import posthog from "posthog-js";
import { PostHogProvider as Provider } from "posthog-js/react";
import React from "react";

if (typeof window !== "undefined") {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";
  
  if (key && key !== "phc_dummy_client_key_for_build") {
    posthog.init(key, {
      api_host: host,
      person_profiles: "identified_only",
      capture_pageview: true, // Capturer automatiquement les pages vues
    });
  }
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return <Provider client={posthog}>{children}</Provider>;
}
