"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Mock auth store — ResumeForge AI is a pure-frontend portfolio app, so
 * "authentication" is simulated client-side and persisted to localStorage.
 *
 * Three account states drive the whole product funnel:
 *   - "guest"  — default. Visiting /dashboard directly works exactly as before.
 *   - "demo"   — set by the landing "Try Live Demo" button (no signup needed).
 *                The dashboard shows a slim demo banner with a signup CTA.
 *   - "member" — set by /signin or /signup. The dashboard personalizes the
 *                avatar menu with the user's name/email.
 *
 * Hydration safety: identical pattern to resume-store — `skipHydration: true`
 * so the first client render always matches the server tree, with the actual
 * persisted state rehydrated post-mount by <StoreRehydrator /> in the root
 * layout. Anything reading `user`/`mode` must therefore treat guest/null as
 * the server-rendered default and only differentiate after mount.
 */

export type AuthMode = "guest" | "demo" | "member";

export interface AuthUser {
  name: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  mode: AuthMode;
  /** Mock credential sign-in (no real backend — accepts any validated input). */
  signIn: (user: AuthUser) => void;
  /** Mock account creation. */
  signUp: (user: AuthUser) => void;
  /** Landing "Try Live Demo" — enters the dashboard with zero friction. */
  enterDemo: () => void;
  /** Clears the session back to guest. */
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      mode: "guest",
      signIn: (user) => set({ user, mode: "member" }),
      signUp: (user) => set({ user, mode: "member" }),
      enterDemo: () => set({ mode: "demo", user: null }),
      signOut: () => set({ user: null, mode: "guest" }),
    }),
    {
      name: "resumeforge-auth",
      storage: createJSONStorage(() => localStorage),
      // Rehydrate AFTER React hydration — see <StoreRehydrator /> in the root
      // layout. Synchronous rehydration would make the first client render
      // read localStorage while the server rendered the guest tree, breaking
      // hydration on every route for returning members (same class of bug
      // fixed for resume-store in Round 11).
      skipHydration: true,
    }
  )
);

/** "Alexander Chen" → "AC"; single word → its first two letters. */
export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AC";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
