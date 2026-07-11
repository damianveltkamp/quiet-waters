import QuietWatersWidget from '../../../widgets/QuietWatersWidget';
import QuietWatersLockWidget from '../../../widgets/QuietWatersLockWidget';
import { buildTimeline } from './timeline';
import { useWidgetStore } from './widgetStore';
import type { WidgetConfig } from './config';

/**
 * Regenerate the verse buffer and hand it to both widget targets. Safe to call
 * on every app launch (tops the buffer back up) and on save.
 */
export function pushWidgetTimeline(
  config: WidgetConfig = useWidgetStore.getState().config,
  now: Date = new Date(),
): void {
  const entries = buildTimeline(config, now).map((e) => ({ date: e.date, props: e.props }));
  QuietWatersWidget.updateTimeline(entries);
  QuietWatersLockWidget.updateTimeline(entries);
}
