import { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ThemedText } from './ThemedText';
import { colors, spacing } from '@/theme';

interface Props {
  message: string;
  visible: boolean;
  onHide: () => void;
}

export function Toast({ message, visible, onHide }: Props) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onHide, 2600);
    return () => clearTimeout(timer);
  }, [visible, onHide]);

  if (!visible) return null;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.primary,
        borderRadius: 999,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: colors.success,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
          <Path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>
      <ThemedText variant="body" color={colors.white}>{message}</ThemedText>
    </View>
  );
}
