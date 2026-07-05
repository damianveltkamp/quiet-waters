import * as Haptics from 'expo-haptics';
import { tapFeedback, successFeedback, pulseFeedback } from '@/lib/haptics';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success' },
}));

test('tap fires medium impact', () => {
  tapFeedback();
  expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
});
test('success fires success notification', () => {
  successFeedback();
  expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
});
test('pulse fires medium impact', () => {
  pulseFeedback();
  expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
});
