import { Image, Pressable, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components';
import { colors, spacing } from '@/theme';
import { BACKGROUNDS, type Background } from '@/features/wallpaper/backgrounds';
import { useWallpaperDraft } from '@/features/wallpaper/wallpaperDraft';

function Swatch({ bg, selected, onSelect }: { bg: Background; selected: boolean; onSelect: (bg: Background) => void }) {
  return (
    <Pressable
      accessibilityLabel={`Background ${bg.name}`}
      onPress={() => onSelect(bg)}
      // Images are 2-up (wider, so the scene is legible); gradients are 3-up.
      style={{ width: bg.kind === 'image' ? '47%' : '30%' }}
    >
      {bg.kind === 'gradient' ? (
        <LinearGradient
          colors={bg.colors}
          style={{ height: 140, borderRadius: 16, borderWidth: selected ? 3 : 0, borderColor: colors.primary }}
        />
      ) : (
        // A mini-wallpaper: the card holds the phone aspect (aspectRatio on the
        // View is reliable, unlike on Image), and the image covers it — matching
        // how the background will be framed on the creation canvas.
        <View
          style={{
            width: '100%',
            aspectRatio: 1290 / 2796,
            borderRadius: 16,
            overflow: 'hidden',
            borderWidth: selected ? 3 : 0,
            borderColor: colors.primary,
          }}
        >
          <Image source={bg.source} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>
      )}
      <ThemedText variant="caption" color={selected ? colors.primary : colors.textFaint} style={{ marginTop: spacing.xs }}>
        {bg.name}
      </ThemedText>
    </Pressable>
  );
}

export default function BackgroundsSheet() {
  const router = useRouter();
  const selectedId = useWallpaperDraft((s) => s.background.id);
  const setBackground = useWallpaperDraft((s) => s.setBackground);

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
            <Swatch key={bg.id} bg={bg} selected={bg.id === selectedId} onSelect={handleSelect} />
          ))}
        </View>
        <ThemedText variant="eyebrow" color={colors.textMuted} style={{ marginTop: spacing.xl, marginBottom: spacing.md }}>
          Images
        </ThemedText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          {images.map((bg) => (
            <Swatch key={bg.id} bg={bg} selected={bg.id === selectedId} onSelect={handleSelect} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
