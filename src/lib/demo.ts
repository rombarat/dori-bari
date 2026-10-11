/**
 * Public showcase deployment (separate database, reset nightly).
 * Set NEXT_PUBLIC_DEMO_MODE=true only on that deployment; the real store leaves it unset.
 */
export const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
