import { View, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ThemedText } from './ThemedText';
import { colors, spacing } from '@/theme';
import { tapFeedback } from '@/lib/haptics';

interface Props {
  onPress: () => void;
}

function PlusIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function WallpaperPromoCard({ onPress }: Props) {
  const handlePress = () => {
    tapFeedback();
    onPress();
  };
  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        backgroundColor: colors.primary,
        borderRadius: 24,
        padding: spacing.lg,
        gap: spacing.md,
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <View style={{ flex: 1, justifyContent: 'center', gap: spacing.xs }}>
        <ThemedText variant="title" color={colors.white} style={{ fontSize: 26, lineHeight: 30 }}>
          Create a wallpaper
        </ThemedText>
        <ThemedText variant="caption" color={colors.soft}>
          Set today’s verse on your lock screen in seconds.
        </ThemedText>
      </View>
      <View
        style={{
          width: 72,
          height: 96,
          borderRadius: 14,
          backgroundColor: colors.deep,
          borderWidth: 1,
          borderColor: colors.mid,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.sm,
        }}
      >
        <ThemedText variant="caption" color={colors.soft} align="center" style={{ fontSize: 9 }}>
          quiet waters
        </ThemedText>
        <View
          style={{
            position: 'absolute',
            bottom: -10,
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PlusIcon color={colors.primary} />
        </View>
      </View>
    </Pressable>
  );
}
