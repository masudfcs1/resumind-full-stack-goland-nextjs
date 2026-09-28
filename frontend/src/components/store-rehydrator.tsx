"use client";

import { useEffect } from "react";
import { useResumeStore } from "@/lib/resume-store";
import { useAuthStore } from "@/lib/auth-store";

/**
 * Rehydrates the persisted resume store AFTER React has hydrated.
 *
 * The store is configured with `skipHydration: true` so the first client
 * render always matches the server-rendered seed tree (prevents hydration
 * mismatches for returning users whose localStorage diverged from seed).
 *
 * The rehydrate call is deferred one macrotask: it must never run inside
 * the hydration window itself. React can keep hydrating suspended/late
 * parts of the tree past the first effect flush, and a synchronous
 * rehydrate in an effect can flip store-dependent content shape while
 * those passes are still diffing against server HTML — an intermittent
 * Radix useId/aria hydration error (observed on /dashboard/compare with
 * category-carrying score history). A macrotask boundary guarantees the
 * whole hydration pass is done before real data lands.
 */
export function StoreRehydrator() {
  useEffect(() => {
    const id = window.setTimeout(() => {
      void useResumeStore.persist.rehydrate();
      void useAuthStore.persist.rehydrate();
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  return null;
}
