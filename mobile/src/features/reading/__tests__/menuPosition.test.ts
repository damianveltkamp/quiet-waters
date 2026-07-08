import { computeMenuTop } from '@/features/reading/menuPosition';

const base = { menuHeight: 200, containerHeight: 800, insetTop: 60, insetBottom: 34, margin: 16 };

test('opens just below the press when there is room', () => {
  expect(computeMenuTop({ ...base, pressY: 100 })).toBe(116); // 100 + margin
});

test('flips above the press when there is not enough room below', () => {
  // pressY 700: below (716) exceeds maxTop (800-34-200-16=550) -> flip above.
  expect(computeMenuTop({ ...base, pressY: 700 })).toBe(700 - 200 - 16); // 484
});

test('clamps to the safe-area top when the press is near the top', () => {
  // pressY 10: below (26) is under minTop (60+16=76) -> clamp to 76.
  expect(computeMenuTop({ ...base, pressY: 10 })).toBe(76);
});

test('clamps to the safe-area bottom edge when flipping still overflows', () => {
  // pressY 780 near the bottom: flip above -> 780-200-16=564, but maxTop=550 -> clamp to 550.
  expect(computeMenuTop({ ...base, pressY: 780 })).toBe(550);
});

test('pins to the top when the menu is taller than the available space', () => {
  expect(computeMenuTop({ ...base, pressY: 400, menuHeight: 900 })).toBe(76); // minTop
});
