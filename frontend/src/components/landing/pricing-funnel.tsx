"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Pricing from "./pricing";

/* PricingFunnel — wrapper around the (read-only) Pricing section that adds
 * plan context to the tier CTAs at click time.
 *
 * pricing.tsx renders all three tier buttons as plain <Link href="/dashboard">
 * and is intentionally not edited, so this wrapper intercepts clicks in the
 * CAPTURE phase (before next/link's own handler on the anchor) and resolves
 * the clicked tier from the `[data-price]` tag pricing.tsx already stamps on
 * each price display. Pro/Lifetime then client-navigate to
 * /dashboard?plan=<tier>; Free (and anything unrecognized) keeps the plain
 * /dashboard link, per the funnel spec.
 *
 * Keyboard activation (Enter on a focused link) also dispatches a click event
 * with button=0 and no modifiers, so the deep link works without a pointer.
 * Modified clicks (cmd/ctrl/shift/alt or middle button) fall through and open
 * the plain link in a new tab, which is acceptable for a new-tab context. */

type PaidPlan = "pro" | "lifetime";

function paidPlanFromAnchor(anchor: HTMLElement): PaidPlan | null {
  // Walk up from the CTA until we reach the tier card — the first ancestor
  // carrying a `[data-price]` tag. "free" / unknown tiers return null so the
  // default /dashboard navigation happens untouched.
  let node: HTMLElement | null = anchor;
  while (
    node &&
    node.tagName !== "SECTION" &&
    node.tagName !== "BODY" &&
    node.tagName !== "HTML"
  ) {
    const tier = node
      .querySelector<HTMLElement>("[data-price]")
      ?.getAttribute("data-price");
    if (tier === "pro" || tier === "lifetime") return tier;
    if (tier === "free") return null;
    node = node.parentElement;
  }
  return null;
}

export default function PricingFunnel() {
  const router = useRouter();

  const handleCaptureClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.defaultPrevented
    ) {
      return;
    }
    const anchor = (event.target as HTMLElement | null)?.closest<HTMLElement>(
      "a[href='/dashboard']"
    );
    if (!anchor) return;
    const plan = paidPlanFromAnchor(anchor);
    if (!plan) return;
    event.preventDefault();
    event.stopPropagation();
    router.push(`/dashboard?plan=${plan}`);
  };

  return (
    <div onClickCapture={handleCaptureClick} data-pricing-funnel="">
      <Pricing />
    </div>
  );
}
