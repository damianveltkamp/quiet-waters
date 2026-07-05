import { create } from 'zustand';
import type { HoursBucket } from '@/lib/calculations';

export interface OnboardingState {
  bucket: HoursBucket;
  setBucket: (b: HoursBucket) => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  bucket: '4-5',
  setBucket: (bucket) => set({ bucket }),
}));
