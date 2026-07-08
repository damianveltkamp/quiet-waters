import { Pressable, View } from 'react-native';
import { ThemedText } from '@/components';
import { colors, spacing, typography } from '@/theme';
import type { FontFace } from '@/features/reading/readingStore';

const MIN = 0.85;
const MAX = 1.5;
const STEP = 0.1;
const clamp = (n: number) => Math.min(MAX, Math.max(MIN, Math.round(n * 100) / 100));

interface Props {
  fontFace: FontFace;
  fontScale: number;
  onSelectFace: (f: FontFace) => void;
  onScaleChange: (n: number) => void;
}

const FACES: { key: FontFace; label: string; family: string }[] = [
  { key: 'serif', label: 'Serif', family: typography.families.serif },
  { key: 'sans', label: 'Sans', family: typography.families.sans },
];

export default function TypePanel({ fontFace, fontScale, onSelectFace, onScaleChange }: Props) {
  return (
    <View style={{ backgroundColor: colors.white, borderRadius: 20, padding: spacing.md, gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable testID="type-smaller" hitSlop={12} onPress={() => onScaleChange(clamp(fontScale - STEP))}>
          <ThemedText variant="body" color={colors.soft}>A</ThemedText>
        </Pressable>
        <ThemedText variant="caption" color={colors.textFaint}>{`${Math.round(fontScale * 100)}%`}</ThemedText>
        <Pressable testID="type-larger" hitSlop={12} onPress={() => onScaleChange(clamp(fontScale + STEP))}>
          <ThemedText variant="title" color={colors.primary}>A</ThemedText>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {FACES.map((f) => {
          const active = f.key === fontFace;
          return (
            <Pressable
              key={f.key}
              onPress={() => onSelectFace(f.key)}
              style={{ flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: active ? colors.accent : colors.paleAlt, backgroundColor: active ? colors.pale : colors.white }}
            >
              <ThemedText variant="body" color={colors.primary} style={{ fontFamily: f.family }}>Aa</ThemedText>
              <ThemedText variant="eyebrow" color={active ? colors.mid : colors.textFaint}>{f.label}</ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
