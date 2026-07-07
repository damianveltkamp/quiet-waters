import { Pressable, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components';
import { colors, spacing } from '@/theme';
import { BACKGROUNDS } from '@/features/wallpaper/backgrounds';
import { useWallpaperDraft } from '@/features/wallpaper/wallpaperDraft';

export default function BackgroundsSheet() {
  const router = useRouter();
  const { background, setBackground } = useWallpaperDraft();

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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}
        keyboardShouldPersistTaps="handled"
      >
        {BACKGROUNDS.map((bg) => {
          const selected = bg.id === background.id;
          return (
            <Pressable key={bg.id} onPress={() => setBackground(bg)} style={{ width: '30%' }}>
              <LinearGradient
                colors={bg.colors}
                style={{
                  height: 140,
                  borderRadius: 16,
                  borderWidth: selected ? 3 : 0,
                  borderColor: colors.primary,
                }}
              />
              <ThemedText variant="caption" color={selected ? colors.primary : colors.textFaint} style={{ marginTop: spacing.xs }}>
                {bg.name}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
