import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '@/lib/mmkvStorage';
import { DEFAULT_WIDGET_CONFIG, type RefreshSetting, type WidgetConfig } from './config';

export interface WidgetState {
  config: WidgetConfig;
  setBackgroundId: (id: string) => void;
  setRefresh: (r: RefreshSetting) => void;
}

export const useWidgetStore = create<WidgetState>()(
  persist(
    (set) => ({
      config: DEFAULT_WIDGET_CONFIG,
      setBackgroundId: (id) =>
        set((s) => ({ config: { ...s.config, backgroundId: id } })),
      setRefresh: (refresh) =>
        set((s) => ({ config: { ...s.config, refresh } })),
    }),
    { name: 'widget', storage: createJSONStorage(() => mmkvStorage), version: 1 },
  ),
);
