import {
  EXPERIMENTS,
  bootstrapFlags,
  bootstrapPayloads,
  DEFAULT_PAYWALL_CONTENT,
} from '@/lib/experiments';

test('every experiment lists its default among its variants', () => {
  for (const [key, exp] of Object.entries(EXPERIMENTS)) {
    expect(exp.variants).toContain(exp.default);
    expect(bootstrapFlags[key]).toBe(exp.default);
  }
});

test('the paywall-content and aspiration-headline experiments exist', () => {
  expect(EXPERIMENTS['paywall-content'].variants).toEqual(['a', 'b']);
  expect(EXPERIMENTS['aspiration-headline'].variants).toEqual(['control', 'v2']);
});

test('paywall-content bootstraps its default content payload', () => {
  expect(bootstrapPayloads['paywall-content']).toBe(DEFAULT_PAYWALL_CONTENT);
  expect(DEFAULT_PAYWALL_CONTENT.timeline).toHaveLength(3);
  expect(DEFAULT_PAYWALL_CONTENT.cta).toBe('Try for FREE');
});
