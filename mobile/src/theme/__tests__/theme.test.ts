import { colors, spacing, typography, gradients } from '@/theme';

test('exposes brand primary color', () => {
  expect(colors.primary).toBe('#1C3344');
});
test('spacing scale is 4-pt based', () => {
  expect(spacing.md).toBe(16);
});
test('typography defines serif and sans families', () => {
  expect(typography.families.serif).toContain('Cormorant');
  expect(typography.families.sans).toContain('Hanken');
});
test('gradients define light and dark stop pairs', () => {
  expect(gradients.light).toHaveLength(2);
  expect(gradients.dark).toHaveLength(2);
});
test('exposes the gold text-color token', () => {
  expect(colors.gold).toBe('#C9A96A');
});
