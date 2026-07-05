import { Pressable, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { colors, spacing } from '@/theme';

interface Props {
  title: string;
  priceLabel: string;
  subLabel: string;
  periodLabel: string;
  selected: boolean;
  badge?: string;
  onPress: () => void;
}

export function PlanCard({ title, priceLabel, subLabel, periodLabel, selected, badge, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.white,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: selected ? colors.primary : colors.pale,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.sm,
      }}
    >
      {badge && (
        <View
          style={{
            position: 'absolute',
            top: -10,
            right: spacing.md,
            backgroundColor: colors.primary,
            borderRadius: 10,
            paddingVertical: 3,
            paddingHorizontal: spacing.sm,
          }}
        >
          <ThemedText variant="eyebrow" color={colors.white} style={{ fontSize: 10 }}>
            {badge}
          </ThemedText>
        </View>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            borderWidth: 2,
            borderColor: selected ? colors.primary : colors.soft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {selected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary }} />}
        </View>
        <View>
          <ThemedText variant="body" color={colors.primary} style={{ fontFamily: 'HankenGrotesk_600SemiBold' }}>
            {title}
          </ThemedText>
          <ThemedText variant="caption" color={colors.textFaint}>
            {subLabel}
          </ThemedText>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <ThemedText variant="body" color={colors.primary} style={{ fontFamily: 'HankenGrotesk_600SemiBold' }}>
          {priceLabel}
        </ThemedText>
        <ThemedText variant="caption" color={colors.textFaint}>
          {periodLabel}
        </ThemedText>
      </View>
    </Pressable>
  );
}
