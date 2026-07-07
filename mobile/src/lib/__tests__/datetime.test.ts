import { formatHeaderDate, greeting } from '@/lib/datetime';

test('formats the header date as WEEKDAY · D MONTH', () => {
  expect(formatHeaderDate(new Date(2026, 6, 7))).toBe('TUESDAY · 7 JULY');
});

test('greets by time of day', () => {
  expect(greeting(new Date(2026, 6, 7, 8))).toBe('Good morning');
  expect(greeting(new Date(2026, 6, 7, 13))).toBe('Good afternoon');
  expect(greeting(new Date(2026, 6, 7, 20))).toBe('Good evening');
});
