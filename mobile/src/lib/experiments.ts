export const EXPERIMENTS = {
  'paywall-cta': { variants: ['try_free', 'start_trial'], default: 'try_free' },
  'aspiration-headline': { variants: ['control', 'v2'], default: 'control' },
} as const;

export type ExperimentKey = keyof typeof EXPERIMENTS;
export type VariantOf<K extends ExperimentKey> = (typeof EXPERIMENTS)[K]['variants'][number];

export const bootstrapFlags: Record<string, string> = Object.fromEntries(
  Object.entries(EXPERIMENTS).map(([key, exp]) => [key, exp.default]),
);
