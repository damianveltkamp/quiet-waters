import { View, Image } from 'react-native';
import { ThemedText } from './ThemedText';
import { colors, spacing } from '@/theme';

interface Props {
  verse: string;
  reference: string;
  showTodayWidget?: boolean;
  showBranding?: boolean;
}

export function LockScreenPreview({ verse, reference, showTodayWidget, showBranding }: Props) {
  return (
    <View
      style={{
        backgroundColor: colors.primary,
        borderRadius: 28,
        padding: spacing.lg,
        alignItems: 'center',
        gap: spacing.sm,
      }}
    >
      <ThemedText variant="caption" color={colors.pale} align="center">
        Saturday, July 5
      </ThemedText>
      <ThemedText variant="display" color={colors.white} style={{ fontSize: 56, lineHeight: 60 }}>
        9:41
      </ThemedText>
      <Image
        source={require('../../assets/images/symbol-white.png')}
        style={{ width: 20, height: 20, resizeMode: 'contain', marginVertical: spacing.sm }}
      />
      <ThemedText variant="quote" color={colors.white} align="center">
        {verse}
      </ThemedText>
      <ThemedText variant="eyebrow" color={colors.soft}>
        {reference}
      </ThemedText>
      {showTodayWidget && (
        <View
          style={{
            marginTop: spacing.md,
            backgroundColor: colors.deep,
            borderRadius: 14,
            padding: spacing.md,
            alignSelf: 'stretch',
          }}
        >
          <ThemedText variant="eyebrow" color={colors.soft}>
            Today's verse
          </ThemedText>
          <ThemedText variant="quote" color={colors.pale}>
            Be still, and know…
          </ThemedText>
        </View>
      )}
      {showBranding && (
        <ThemedText variant="eyebrow" color={colors.soft} style={{ marginTop: spacing.md }}>
          Quiet Waters
        </ThemedText>
      )}
    </View>
  );
}
