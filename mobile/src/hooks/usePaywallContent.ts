import { useFeatureFlagWithPayload } from 'posthog-react-native';
import {
  DEFAULT_PAYWALL_CONTENT,
  type PaywallContent,
  type PaywallTimelineStep,
  type VariantOf,
} from '@/lib/experiments';

const ICONS: PaywallTimelineStep['icon'][] = ['lock', 'bell', 'sparkle'];

const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.length > 0;

function isValidStep(s: unknown): s is PaywallTimelineStep {
  if (typeof s !== 'object' || s === null) return false;
  const step = s as Record<string, unknown>;
  return (
    ICONS.includes(step.icon as PaywallTimelineStep['icon']) &&
    isNonEmptyString(step.title) &&
    isNonEmptyString(step.body)
  );
}

/**
 * Merge a remote PostHog payload over the baked-in defaults, field by field.
 * Any missing or malformed field falls back to the default, so a partial,
 * empty, or garbage payload can never break the paywall's layout.
 */
export function mergePaywallContent(raw: unknown): PaywallContent {
  const d = DEFAULT_PAYWALL_CONTENT;
  if (typeof raw !== 'object' || raw === null) return d;
  const p = raw as Record<string, unknown>;
  const timeline =
    Array.isArray(p.timeline) && p.timeline.length > 0 && p.timeline.every(isValidStep)
      ? (p.timeline as PaywallTimelineStep[])
      : d.timeline;
  return {
    title: isNonEmptyString(p.title) ? p.title : d.title,
    timeline,
    yearlyBadge: isNonEmptyString(p.yearlyBadge) ? p.yearlyBadge : d.yearlyBadge,
    cta: isNonEmptyString(p.cta) ? p.cta : d.cta,
  };
}

/**
 * Reads the `paywall-content` experiment: the assigned variant (defaulting to
 * 'a') plus the validated content object to render the paywall from.
 */
export function usePaywallContent(): {
  variant: VariantOf<'paywall-content'>;
  content: PaywallContent;
} {
  const [variant, payload] = useFeatureFlagWithPayload('paywall-content');
  const v: VariantOf<'paywall-content'> = variant === 'b' ? 'b' : 'a';
  return { variant: v, content: mergePaywallContent(payload) };
}
