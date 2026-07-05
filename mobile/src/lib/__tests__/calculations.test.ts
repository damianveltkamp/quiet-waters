import { bucketMidpoint, hoursPerYear, fullDays, vowHours, formatNumber, HOURS_BUCKETS } from '@/lib/calculations';

test('has six ordered buckets', () => {
  expect(HOURS_BUCKETS).toEqual(['1-3', '3-4', '4-5', '5-6', '6-7', '7+']);
});
test('midpoints', () => {
  expect(bucketMidpoint('1-3')).toBe(2);
  expect(bucketMidpoint('4-5')).toBe(4.5);
  expect(bucketMidpoint('7+')).toBe(7.5);
});
test('4-5 bucket matches mockup numbers', () => {
  expect(hoursPerYear('4-5')).toBe(1642);
  expect(fullDays('4-5')).toBe(68);
  expect(vowHours('4-5')).toBe(164);
});
test('formats with locale grouping', () => {
  expect(formatNumber(1642)).toBe('1,642');
});
