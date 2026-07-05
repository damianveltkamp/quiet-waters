import { useOnboardingStore } from '@/store/onboarding';

test('defaults to 4-5 bucket', () => {
  expect(useOnboardingStore.getState().bucket).toBe('4-5');
});
test('setBucket updates selection', () => {
  useOnboardingStore.getState().setBucket('7+');
  expect(useOnboardingStore.getState().bucket).toBe('7+');
});
