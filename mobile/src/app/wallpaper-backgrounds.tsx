import { Image, Pressable, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components';
import { colors, spacing } from '@/theme';
import { BACKGROUNDS, type Background } from '@/features/wallpaper/backgrounds';
import { useWallpaperDraft } from '@/features/wallpaper/wallpaperDraft';

export default function BackgroundsSheet() {
  const router = useRouter();
  const selectedId = useWallpaperDraft((s) => s.background.id);
  const setBackground = useWallpaperDraft((s) => s.setBackground);

  const gradients = BACKGROUNDS.filter((b) => b.kind === 'gradient');
  const images = BACKGROUNDS.filter((b) => b.kind === 'image');

  const Swatch = ({ bg }: { bg: Background }) => {
    const selected = bg.id === selectedId;
    return (
      <Pressable
        accessibilityLabel={`Background ${bg.name}`}
        onPress={() => {
          setBackground(bg);
          router.back();
        }}
        style={{ width: '30%' }}
      >
        {bg.kind === 'gradient' ? (
          <LinearGradient
            colors={bg.colors}
            style={{ height: 140, borderRadius: 16, borderWidth: selected ? 3 : 0, borderColor: colors.primary }}
          />
        ) : (
          <Image
            source={bg.source}
            style={{ height: 140, borderRadius: 16, borderWidth: selected ? 3 : 0, borderColor: colors.primary }}
            resizeMode="cover"
          />
        )}
        <ThemedText variant="caption" color={selected ? colors.primary : colors.textFaint} style={{ marginTop: spacing.xs }}>
          {bg.name}
        </ThemedText>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, padding: spacing.lg }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ThemedText variant="eyebrow" color={colors.textMuted} style={{ marginBottom: spacing.md }}>
          Colors
        </ThemedText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          {gradients.map((bg) => (
            <Swatch key={bg.id} bg={bg} />
          ))}
        </View>
        <ThemedText variant="eyebrow" color={colors.textMuted} style={{ marginTop: spacing.xl, marginBottom: spacing.md }}>
          Images
        </ThemedText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          {images.map((bg) => (
            <Swatch key={bg.id} bg={bg} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
