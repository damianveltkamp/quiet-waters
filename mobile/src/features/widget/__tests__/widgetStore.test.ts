import { useWidgetStore } from '../widgetStore';
import { DEFAULT_WIDGET_CONFIG } from '../config';

beforeEach(() => {
  useWidgetStore.setState({ config: DEFAULT_WIDGET_CONFIG });
});

test('defaults to still-water daily at 07:00', () => {
  expect(useWidgetStore.getState().config).toEqual({
    backgroundId: 'still-water',
    refresh: { mode: 'daily', time: '07:00' },
  });
});

test('setBackgroundId updates only the background', () => {
  useWidgetStore.getState().setBackgroundId('deep-night');
  expect(useWidgetStore.getState().config.backgroundId).toBe('deep-night');
  expect(useWidgetStore.getState().config.refresh).toEqual(DEFAULT_WIDGET_CONFIG.refresh);
});

test('setRefresh switches to hourly', () => {
  useWidgetStore.getState().setRefresh({ mode: 'hourly', time: '07:00' });
  expect(useWidgetStore.getState().config.refresh.mode).toBe('hourly');
});
