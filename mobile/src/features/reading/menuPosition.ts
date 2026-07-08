/**
 * Compute the vertical `top` (in the reading screen's full-height coordinate
 * space) for the verse action menu so it opens at the press point without
 * running off-screen.
 *
 * - Opens just below the press by default.
 * - Flips above the press when there isn't room below.
 * - Clamps within the safe area; if the menu is taller than the available
 *   space it pins to the safe-area top.
 *
 * `menuHeight` is 0 before the menu has been measured; callers keep it hidden
 * (opacity 0) until a real height is known, so the pre-measure value is unused.
 */
export function computeMenuTop(params: {
  pressY: number;
  menuHeight: number;
  containerHeight: number;
  insetTop: number;
  insetBottom: number;
  margin: number;
}): number {
  const { pressY, menuHeight, containerHeight, insetTop, insetBottom, margin } = params;
  const minTop = insetTop + margin;
  const maxTop = containerHeight - insetBottom - menuHeight - margin;

  let top = pressY + margin; // open just below the press
  if (top > maxTop) {
    top = pressY - menuHeight - margin; // not enough room below — flip above
  }

  if (maxTop < minTop) return minTop; // menu taller than the available space
  return Math.max(minTop, Math.min(top, maxTop));
}
