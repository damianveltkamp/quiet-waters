import { Pressable, View } from 'react-native';
import { listTranslations, type TranslationId } from '@/bible';
import { ThemedText } from '@/components';
import { colors, spacing } from '@/theme';

interface Props {
  current: TranslationId;
  onSelect: (id: TranslationId) => void;
}

export default function TranslationSheet({ current, onSelect }: Props) {
  return (
    <View style={{ backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, gap: spacing.md }}>
      <ThemedText variant="eyebrow" color={colors.soft}>Translation</ThemedText>
      {listTranslations().map((t) => {
        const active = t.id === current;
        return (
          <Pressable
            key={t.id}
            onPress={() => onSelect(t.id)}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderRadius: 12, paddingHorizontal: spacing.sm, backgroundColor: active ? colors.paleAlt : 'transparent' }}
          >
            <View style={{ flex: 1 }}>
              <ThemedText variant="button" color={colors.primary}>{t.id}</ThemedText>
              <ThemedText variant="caption" color={colors.textFaint}>{t.name}</ThemedText>
            </View>
            {active && <ThemedText variant="body" color={colors.mid}>✓</ThemedText>}
          </Pressable>
        );
      })}
    </View>
  );
}
