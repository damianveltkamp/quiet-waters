import { useRef, useState } from 'react';
import { Dimensions, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { ThemedText, Toast } from '@/components';
import { colors, spacing } from '@/theme';
import { successFeedback } from '@/lib/haptics';
import { WallpaperCanvas } from '@/features/wallpaper/WallpaperCanvas';
import { useWallpaperDraft } from '@/features/wallpaper/wallpaperDraft';
import { saveWallpaperToPhotos } from '@/features/wallpaper/export';

export default function Create() {
  const router = useRouter();
  const { verse, background, textColor, backdropOpacity } = useWallpaperDraft();
  const canvasRef = useRef<View>(null);
  const [toast, setToast] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Capture at the true full-screen size so the exported image matches the
  // device wallpaper aspect ratio. The tab screen is shorter than the screen
  // (it sits above the tab bar), so StyleSheet.absoluteFill would crop it and
  // the centered text would land off-center once iOS fills the lock screen.
  const screen = Dimensions.get('screen');

  async function onSave() {
    if (saving) return;
    setSaving(true);
    try {
      const result = await saveWallpaperToPhotos(canvasRef);
      if (result === 'saved') {
        successFeedback();
        setHint('Set it via Settings › Wallpaper.');
        setToast(true);
      } else if (result === 'denied') {
        setHint('Enable Photos access in Settings to save.');
      } else {
        setHint("Couldn't save wallpaper. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Capture target: sized to the full device screen (not the tab-cropped
          area) so the exported PNG has the wallpaper aspect ratio. It extends
          behind the opaque tab bar. collapsable={false} keeps a native view for view-shot. */}
      <View
        ref={canvasRef}
        collapsable={false}
        style={{ position: 'absolute', top: 0, left: 0, width: screen.width, height: screen.height }}
      >
        <WallpaperCanvas
          verseText={verse.text}
          reference={verse.reference}
          background={background}
          textColor={textColor}
          backdropOpacity={backdropOpacity}
        />
      </View>

      <SafeAreaView style={{ flex: 1, justifyContent: 'flex-end' }}>
        <View style={{ padding: spacing.lg, gap: spacing.sm }}>
          {hint && <ThemedText variant="caption" color={background.textColor} align="center">{hint}</ThemedText>}
          {toast && <Toast message="Wallpaper saved" visible={toast} onHide={() => setToast(false)} />}

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Pressable
              onPress={() => router.push('/wallpaper-verse-picker')}
              style={{ flex: 1, backgroundColor: colors.white, borderRadius: 999, paddingVertical: spacing.md, paddingHorizontal: spacing.lg }}
            >
              <ThemedText variant="body" color={colors.textFaint}>Search a verse</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => router.push('/wallpaper-style')}
              accessibilityLabel="Text and backdrop"
              style={{ width: 52, backgroundColor: colors.white, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}
            >
              <ThemedText variant="button" color={colors.primary}>Aa</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => router.push('/wallpaper-backgrounds')}
              accessibilityLabel="Backgrounds"
              style={{ width: 52, backgroundColor: colors.white, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Rect x={3} y={3} width={7} height={7} rx={1.5} stroke={colors.primary} strokeWidth={1.8} />
                <Rect x={14} y={3} width={7} height={7} rx={1.5} stroke={colors.primary} strokeWidth={1.8} />
                <Rect x={3} y={14} width={7} height={7} rx={1.5} stroke={colors.primary} strokeWidth={1.8} />
                <Rect x={14} y={14} width={7} height={7} rx={1.5} stroke={colors.primary} strokeWidth={1.8} />
              </Svg>
            </Pressable>
          </View>

          <Pressable
            onPress={onSave}
            disabled={saving}
            style={({ pressed }) => ({ backgroundColor: colors.white, opacity: pressed ? 0.9 : 1, borderRadius: 999, paddingVertical: spacing.md + 2, alignItems: 'center' })}
          >
            <ThemedText variant="button" color={colors.primary}>Set as wallpaper</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
