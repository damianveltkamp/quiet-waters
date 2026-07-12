import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Host, Slider } from '@expo/ui';
import { ThemedText } from '@/components';
import { colors, spacing } from '@/theme';
import { useWallpaperDraft } from '@/features/wallpaper/wallpaperDraft';

const TEXT_COLORS: readonly { label: string; value: string }[] = [
  { label: 'White', value: '#FFFFFF' },
  { label: 'Navy', value: colors.primary },
  { label: 'Gold', value: colors.gold },
  { label: 'Light Blue', value: colors.accent },
];

function ColorSwatch({ label, value, selected, onSelect }: { label: string; value: string; selected: boolean; onSelect: (v: string) => void }) {
  return (
    <Pressable
      accessibilityLabel={`Text color ${label}`}
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

// Custom bottom sheet over a transparent modal: the native `formSheet` renders
// as an inset floating card on iOS and leaves an unfilled band below short
// content. Presenting transparent + a bottom-anchored panel gives a full-width
// sheet, filled edge-to-edge, with the wallpaper still visible behind.
export default function WallpaperStyleSheet() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const textColor = useWallpaperDraft((s) => s.textColor);
  const backdropOpacity = useWallpaperDraft((s) => s.backdropOpacity);
  const setTextColor = useWallpaperDraft((s) => s.setTextColor);
  const setBackdropOpacity = useWallpaperDraft((s) => s.setBackdropOpacity);

  return (
    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
      {/* Transparent tap-to-dismiss area above the sheet; keeps the wallpaper visible. */}
      <Pressable accessibilityLabel="Close" style={{ flex: 1 }} onPress={() => router.back()} />

      <View
        style={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: insets.bottom + spacing.lg,
        }}
      >
        <View style={{ alignSelf: 'center', width: 36, height: 5, borderRadius: 3, backgroundColor: colors.paleAlt, marginBottom: spacing.lg }} />

        <ThemedText variant="eyebrow" color={colors.textMuted} style={{ marginBottom: spacing.md }}>
          Text Color
        </ThemedText>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          {TEXT_COLORS.map((c) => (
            <ColorSwatch key={c.value} label={c.label} value={c.value} selected={c.value === textColor} onSelect={setTextColor} />
          ))}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.sm }}>
          <ThemedText variant="eyebrow" color={colors.textMuted}>Backdrop Opacity</ThemedText>
          <ThemedText variant="eyebrow" color={colors.primary}>{Math.round(backdropOpacity * 100)}%</ThemedText>
        </View>
        {/* @expo/ui controls must be wrapped in a Host to render on iOS. */}
        <Host style={{ height: 44 }}>
          <Slider
            testID="backdrop-opacity-slider"
            value={backdropOpacity}
            min={0}
            max={1}
            onValueChange={setBackdropOpacity}
          />
        </Host>
      </View>
    </View>
  );
}
