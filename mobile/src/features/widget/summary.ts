import type { WidgetConfig } from './config';

function friendlyTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export function refreshSummary(config: WidgetConfig): string {
  if (config.refresh.mode === 'hourly') return 'Every hour';
  return `Every day · ${friendlyTime(config.refresh.time)}`;
}
