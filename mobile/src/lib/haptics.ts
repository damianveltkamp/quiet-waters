import * as Haptics from 'expo-haptics';

export function tapFeedback(): void { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }
export function successFeedback(): void { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
export function pulseFeedback(): void { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }
