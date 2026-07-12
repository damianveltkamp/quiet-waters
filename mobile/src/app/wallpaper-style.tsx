import { Pressable, ScrollView, View } from 'react-native';
import { Slider } from '@expo/ui';
import { ThemedText } from '@/components';
import { colors, spacing } from '@/theme';
import { useWallpaperDraft } from '@/features/wallpaper/wallpaperDraft';

const TEXT_COLORS: readonly { label: string; value: string }[] = [
  { label: 'White', value: '#FFFFFF' },
  { label: 'Navy', value: colors.primary },
  { label: 'Gold', value: colors.gold },
  { label: 'Light Blue', value: colors.accent },
];

function ColorSwatch({ value, selected, onSelect }: { value: string; selected: boolean; onSelect: (v: string) => void }) {
  return (
    <Pressable
      accessibilityLabel={`Text color ${value}`}
      onPress={() => onSelect(value)}
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: value,
        borderWidth: selected ? 3 : 1,
        borderColor: selected ? colors.primary : colors.paleAlt,
      }}
    />
  );
}

export default function WallpaperStyleSheet() {
  const textColor = useWallpaperDraft((s) => s.textColor);
  const backdropOpacity = useWallpaperDraft((s) => s.backdropOpacity);
  const setTextColor = useWallpaperDraft((s) => s.setTextColor);
  const setBackdropOpacity = useWallpaperDraft((s) => s.setBackdropOpacity);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, padding: spacing.lg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ThemedText variant="eyebrow" color={colors.textMuted} style={{ marginBottom: spacing.md }}>
          Text Color
        </ThemedText>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          {TEXT_COLORS.map((c) => (
            <ColorSwatch key={c.value} value={c.value} selected={c.value === textColor} onSelect={setTextColor} />
          ))}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.sm }}>
          <ThemedText variant="eyebrow" color={colors.textMuted}>Backdrop Opacity</ThemedText>
          <ThemedText variant="eyebrow" color={colors.primary}>{Math.round(backdropOpacity * 100)}%</ThemedText>
        </View>
        <Slider
          testID="backdrop-opacity-slider"
          value={backdropOpacity}
          min={0}
          max={1}
          onValueChange={setBackdropOpacity}
        />
      </ScrollView>
    </View>
  );
}
