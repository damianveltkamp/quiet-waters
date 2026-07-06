export const EXPERIMENTS = {
  'paywall-content': { variants: ['a', 'b'], default: 'a' },
  'aspiration-headline': { variants: ['control', 'v2'], default: 'control' },
} as const;

export type ExperimentKey = keyof typeof EXPERIMENTS;
export type VariantOf<K extends ExperimentKey> = (typeof EXPERIMENTS)[K]['variants'][number];

// Content for the paywall screen, delivered as a PostHog feature-flag payload
// (one payload per variant). Prices are NOT here — they come from RevenueCat.
export type TimelineIcon = 'lock' | 'bell' | 'sparkle';
export type PaywallTimelineStep = {
  icon: TimelineIcon;
  title: string;
  body: string;
};
export type PaywallContent = {
  title: string;
  timeline: PaywallTimelineStep[];
  yearlyBadge: string;
  cta: string;
};

// Baked-in fallback. Also the bootstrap payload, and the per-field default the
// remote payload is merged over — so the screen always renders fully.
export const DEFAULT_PAYWALL_CONTENT: PaywallContent = {
  title: "We'll remind you before your trial ends.",
  timeline: [
    { icon: 'lock', title: 'Today', body: 'Unlock full access to Quiet Waters and start getting closer to God.' },
    { icon: 'bell', title: 'In 2 days', body: "We'll send a reminder before your trial ends." },
    { icon: 'sparkle', title: 'In 3 days', body: 'Your subscription begins unless you cancel before.' },
  ],
  yearlyBadge: 'SAVE 92%',
  cta: 'Try for FREE',
};

export const bootstrapFlags: Record<string, string> = Object.fromEntries(
  Object.entries(EXPERIMENTS).map(([key, exp]) => [key, exp.default]),
);

export const bootstrapPayloads: Record<string, PaywallContent> = {
  'paywall-content': DEFAULT_PAYWALL_CONTENT,
};
