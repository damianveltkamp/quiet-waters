import { Image, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components';
import { colors, spacing } from '@/theme';
import { BACKGROUNDS, type Background } from '@/features/wallpaper/backgrounds';
import { useWallpaperDraft } from '@/features/wallpaper/wallpaperDraft';

// Wallpaper aspect (generated assets are 1290x2796). Height/width so a card of
// width W is W * RATIO tall — the true phone shape the background will fill.
const IMAGE_RATIO = 2796 / 1290;

function Swatch({
  bg,
  selected,
  onSelect,
  imgW,
}: {
  bg: Background;
  selected: boolean;
  onSelect: (bg: Background) => void;
  imgW: number;
}) {
  return (
    <Pressable
      accessibilityLabel={`Background ${bg.name}`}
      onPress={() => onSelect(bg)}
      style={bg.kind === 'image' ? { width: imgW } : { width: '30%' }}
    >
      {bg.kind === 'gradient' ? (
        <LinearGradient
          colors={bg.colors}
          style={{ height: 140, borderRadius: 16, borderWidth: selected ? 3 : 0, borderColor: colors.primary }}
        />
      ) : (
        // Explicit pixel size (no % / aspectRatio) so the card is exactly the
        // phone shape and `cover` shows the whole framed image — a mini preview
        // of how the background will look on the creation canvas.
        <Image
          source={bg.source}
          style={{
            width: imgW,
            height: Math.round(imgW * IMAGE_RATIO),
            borderRadius: 16,
            borderWidth: selected ? 3 : 0,
            borderColor: colors.primary,
          }}
          resizeMode="cover"
        />
      )}
      <ThemedText variant="caption" color={selected ? colors.primary : colors.textFaint} style={{ marginTop: spacing.xs }}>
        {bg.name}
      </ThemedText>
    </Pressable>
  );
}

export default function BackgroundsSheet() {
  const router = useRouter();
  const { width: screenW } = useWindowDimensions();
  const selectedId = useWallpaperDraft((s) => s.background.id);
  const setBackground = useWallpaperDraft((s) => s.setBackground);

  // Two image cards per row: full content width minus the outer padding and the
  // single inter-card gap, halved.
  const imgW = Math.floor((screenW - spacing.lg * 2 - spacing.md) / 2);

  const gradients = BACKGROUNDS.filter((b) => b.kind === 'gradient');
  const images = BACKGROUNDS.filter((b) => b.kind === 'image');

  const handleSelect = (bg: Background) => {
    setBackground(bg);
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, padding: spacing.lg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
        <ThemedText variant="title">Backgrounds</ThemedText>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Close"
          style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.paleAlt, alignItems: 'center', justifyContent: 'center' }}
        >
          <ThemedText variant="body" color={colors.textMuted}>×</ThemedText>
        </Pressable>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ThemedText variant="eyebrow" color={colors.textMuted} style={{ marginBottom: spacing.md }}>
          Colors
        </ThemedText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          {gradients.map((bg) => (
            <Swatch key={bg.id} bg={bg} selected={bg.id === selectedId} onSelect={handleSelect} imgW={imgW} />
          ))}
        </View>
        <ThemedText variant="eyebrow" color={colors.textMuted} style={{ marginTop: spacing.xl, marginBottom: spacing.md }}>
          Images
        </ThemedText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          {images.map((bg) => (
            <Swatch key={bg.id} bg={bg} selected={bg.id === selectedId} onSelect={handleSelect} imgW={imgW} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
