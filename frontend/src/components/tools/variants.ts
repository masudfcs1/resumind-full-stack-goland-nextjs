import type { Variants } from "framer-motion";

/** Shared cubic-bezier ease used across tool pages (fast-out, long settle). */
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Parent container that staggers its children on mount. */
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

/** Standard child item: fade + rise. */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

/** Fade + slight scale-in, for hero visuals like the paper sheet. */
export const fadeInScale: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: EASE } },
};
