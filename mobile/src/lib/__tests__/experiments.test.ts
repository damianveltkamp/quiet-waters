import { EXPERIMENTS, bootstrapFlags } from '@/lib/experiments';

test('every experiment lists its default among its variants', () => {
  for (const [key, exp] of Object.entries(EXPERIMENTS)) {
    expect(exp.variants).toContain(exp.default);
    expect(bootstrapFlags[key]).toBe(exp.default);
  }
});

test('the paywall-cta and aspiration-headline experiments exist', () => {
  expect(EXPERIMENTS['paywall-cta'].variants).toEqual(['try_free', 'start_trial']);
  expect(EXPERIMENTS['aspiration-headline'].variants).toEqual(['control', 'v2']);
});
