"use client";

import * as React from "react";

/** Returns true after the component has mounted (client-only).
 *  Use to avoid hydration mismatches with persisted stores. */
export function useMounted(): boolean {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return mounted;
}
