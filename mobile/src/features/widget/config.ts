export type RefreshMode = 'daily' | 'hourly';

export interface RefreshSetting {
  mode: RefreshMode;
  /** 'HH:mm', 24-hour. Only meaningful when mode === 'daily'. */
  time: string;
}

export interface WidgetConfig {
  backgroundId: string;
  refresh: RefreshSetting;
}

// Default background matches the mockup's "Still Water" selection.
export const DEFAULT_WIDGET_CONFIG: WidgetConfig = {
  backgroundId: 'still-water',
  refresh: { mode: 'daily', time: '07:00' },
};
