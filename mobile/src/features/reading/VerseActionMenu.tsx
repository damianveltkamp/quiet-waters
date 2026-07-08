import { Pressable, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { ThemedText } from '@/components';
import { colors, spacing, typography } from '@/theme';
import { shareVerse } from '@/features/reading/shareVerse';
import { startWallpaperFromVerse } from '@/features/reading/startWallpaper';
import type { TranslationId } from '@/bible';

interface VerseActionMenuProps {
  verseText: string;
  reference: string;
  translation: TranslationId;
  onCreateWallpaper: () => void;
  onClose: () => void;
}

export default function VerseActionMenu({
  verseText,
  reference,
  translation,
  onCreateWallpaper,
  onClose,
}: VerseActionMenuProps) {
  async function onShare() {
    try {
      await shareVerse(verseText, reference, translation);
    } finally {
      onClose();
    }
  }

  function onWallpaper() {
    startWallpaperFromVerse(verseText, reference, translation);
    onCreateWallpaper();
  }

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ backgroundColor: colors.white, borderRadius: 16, padding: spacing.md, shadowColor: colors.primary, shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } }}>
        <ThemedText variant="body" color={colors.primary} style={{ fontFamily: typography.families.serif, fontSize: 20, lineHeight: 30 }}>
          {verseText}
        </ThemedText>
      </View>

      <View style={{ backgroundColor: colors.white, borderRadius: 16, overflow: 'hidden' }}>
        <Pressable onPress={onShare} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md }}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" stroke={colors.primary} strokeWidth={1.8} strokeLinejoin="round" />
          </Svg>
          <ThemedText variant="body" color={colors.primary}>Share verse</ThemedText>
        </Pressable>
        <View style={{ height: 1, backgroundColor: colors.paleAlt, marginHorizontal: spacing.md }} />
        <Pressable onPress={onWallpaper} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md }}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Rect x={3} y={4} width={18} height={16} rx={2} stroke={colors.primary} strokeWidth={1.8} />
            <Path d="m3 16 5-5 4 4 3-3 6 6" stroke={colors.primary} strokeWidth={1.8} strokeLinejoin="round" />
          </Svg>
          <ThemedText variant="body" color={colors.primary}>Create wallpaper</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}
