import { Pressable } from 'react-native';
import { ThemedText } from './ThemedText';
import { colors, spacing } from '@/theme';
import { tapFeedback } from '@/lib/haptics';

interface Props { label: string; onPress: () => void; variant?: 'primary' | 'secondary'; }
export function CTAButton({ label, onPress, variant = 'primary' }: Props) {
  const bg = variant === 'primary' ? colors.primary : colors.accent;
  const fg = variant === 'primary' ? colors.white : colors.primary;
  const handle = () => { tapFeedback(); onPress(); };
  return (
    <Pressable
      onPress={handle}
      style={({ pressed }) => ({
        backgroundColor: bg, opacity: pressed ? 0.9 : 1,
        borderRadius: 999, paddingVertical: spacing.md + 2, alignItems: 'center',
      })}
    >
      <ThemedText variant="button" color={fg}>{label}</ThemedText>
    </Pressable>
  );
}
