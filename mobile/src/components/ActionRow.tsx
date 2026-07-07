import { View, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ThemedText } from './ThemedText';
import { colors, spacing } from '@/theme';
import { tapFeedback } from '@/lib/haptics';

type IconName = 'cross';

interface Props {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
}

function RowIcon({ icon, color }: { icon: IconName; color: string }) {
  switch (icon) {
    case 'cross':
      return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path d="M12 4v16M7 9h10" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );
  }
}

function Chevron({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ActionRow({ icon, title, subtitle, onPress }: Props) {
  const handlePress = () => {
    tapFeedback();
    onPress();
  };
  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: colors.white,
        borderRadius: 20,
        padding: spacing.md,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          backgroundColor: colors.paleAlt,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <RowIcon icon={icon} color={colors.primary} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <ThemedText variant="body" color={colors.primary} style={{ fontFamily: 'HankenGrotesk_600SemiBold' }}>
          {title}
        </ThemedText>
        <ThemedText variant="caption" color={colors.textFaint}>{subtitle}</ThemedText>
      </View>
      <Chevron color={colors.soft} />
    </Pressable>
  );
}
