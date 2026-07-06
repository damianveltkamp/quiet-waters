import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';

jest.mock('posthog-react-native', () => ({ useFeatureFlagWithPayload: jest.fn() }));
import { useFeatureFlagWithPayload } from 'posthog-react-native';
import { mergePaywallContent, usePaywallContent } from '@/hooks/usePaywallContent';
import { DEFAULT_PAYWALL_CONTENT } from '@/lib/experiments';

describe('mergePaywallContent', () => {
  test('returns defaults for undefined / null / non-object payloads', () => {
    expect(mergePaywallContent(undefined)).toEqual(DEFAULT_PAYWALL_CONTENT);
    expect(mergePaywallContent(null)).toEqual(DEFAULT_PAYWALL_CONTENT);
    expect(mergePaywallContent('nope')).toEqual(DEFAULT_PAYWALL_CONTENT);
  });

  test('merges provided fields over defaults, keeping defaults for missing ones', () => {
    const merged = mergePaywallContent({ title: 'New title', cta: 'Start now' });
    expect(merged.title).toBe('New title');
    expect(merged.cta).toBe('Start now');
    expect(merged.yearlyBadge).toBe(DEFAULT_PAYWALL_CONTENT.yearlyBadge);
    expect(merged.timeline).toEqual(DEFAULT_PAYWALL_CONTENT.timeline);
  });

  test('accepts a valid timeline override', () => {
    const timeline = [{ icon: 'bell', title: 'X', body: 'Y' }];
    expect(mergePaywallContent({ timeline }).timeline).toEqual(timeline);
  });

  test('falls back to the default timeline when a step has an invalid icon', () => {
    const merged = mergePaywallContent({ timeline: [{ icon: 'rocket', title: 'X', body: 'Y' }] });
    expect(merged.timeline).toEqual(DEFAULT_PAYWALL_CONTENT.timeline);
  });

  test('falls back to the default timeline when a step is missing fields', () => {
    const merged = mergePaywallContent({ timeline: [{ icon: 'bell', title: 'X' }] });
    expect(merged.timeline).toEqual(DEFAULT_PAYWALL_CONTENT.timeline);
  });

  test('ignores empty-string fields (uses default)', () => {
    expect(mergePaywallContent({ title: '' }).title).toBe(DEFAULT_PAYWALL_CONTENT.title);
  });
});

describe('usePaywallContent', () => {
  const Probe = () => {
    const { variant, content } = usePaywallContent();
    return <Text>{`${variant}|${content.cta}`}</Text>;
  };

  test('returns the assigned variant and its payload cta', async () => {
    (useFeatureFlagWithPayload as jest.Mock).mockReturnValue(['b', { cta: 'Start my free trial' }]);
    await render(<Probe />);
    expect(screen.getByText('b|Start my free trial')).toBeTruthy();
  });

  test('defaults to variant a and default cta when the flag is missing', async () => {
    (useFeatureFlagWithPayload as jest.Mock).mockReturnValue([undefined, undefined]);
    await render(<Probe />);
    expect(screen.getByText(`a|${DEFAULT_PAYWALL_CONTENT.cta}`)).toBeTruthy();
  });
});
