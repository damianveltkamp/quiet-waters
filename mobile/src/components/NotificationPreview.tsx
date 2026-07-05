import { View, Image } from 'react-native';
import { ThemedText } from './ThemedText';
import { colors, spacing } from '@/theme';

interface Props {
  title: string;
  body: string;
}

export function NotificationPreview({ title, body }: Props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        backgroundColor: colors.white,
        borderRadius: 18,
        padding: spacing.md,
        shadowColor: colors.primary,
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image
          source={require('../../assets/images/symbol-white.png')}
          style={{ width: 16, height: 16, resizeMode: 'contain' }}
        />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <ThemedText variant="eyebrow" color={colors.textFaint}>
            Quiet Waters
          </ThemedText>
          <ThemedText variant="caption" color={colors.textFaint}>
            now
          </ThemedText>
        </View>
        <ThemedText variant="body" color={colors.primary} style={{ fontFamily: 'HankenGrotesk_600SemiBold' }}>
          {title}
        </ThemedText>
        <ThemedText variant="quote" color={colors.textMuted} style={{ fontSize: 15, lineHeight: 20 }}>
          {body}
        </ThemedText>
      </View>
    </View>
  );
}
