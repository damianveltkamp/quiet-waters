import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components';
import { colors } from '@/theme';
import type { WallpaperBackground } from '@/features/wallpaper/backgrounds';
import { familyLayout, type WidgetFamily } from './widgetLayout';

export interface WidgetPreviewProps {
  family: WidgetFamily;
  background: WallpaperBackground;
  verseText: string;
  reference: string;
}

/**
 * A faithful, non-interactive preview of the Daily Verse widget at one of the
 * three Apple size families. Mirrors widgets/QuietWatersWidget.tsx: gradient
 * background, centered cross + serif verse (auto-shrink/truncate) + uppercase
 * reference. Family controls proportions and type scale only.
 */
export function WidgetPreview({ family, background, verseText, reference }: WidgetPreviewProps) {
  const l = familyLayout(family);
  return (
    <LinearGradient
      colors={background.colors}
      style={{
        // Medium is wide (>1), large is tall (<1); cap width so tall large fits.
        width: l.aspectRatio >= 1 ? '80%' : undefined,
        height: l.aspectRatio < 1 ? '72%' : undefined,
        aspectRatio: l.aspectRatio,
        maxWidth: '92%',
        borderRadius: 24,
        overflow: 'hidden',
        padding: l.padding,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOpacity: 0.28,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 16 },
        elevation: 8,
      }}
    >
      <ThemedText
        variant="body"
        color={background.mutedColor}
        style={{ fontSize: l.crossSize, marginBottom: l.spacing }}
      >
        ✝
      </ThemedText>
      <ThemedText
        variant="title"
        color={background.textColor}
        align="center"
        numberOfLines={l.verseLineLimit}
        adjustsFontSizeToFit
        minimumFontScale={0.5}
        style={{ fontSize: l.verseFontSize, lineHeight: l.verseFontSize * 1.3 }}
      >
        {verseText}
      </ThemedText>
      <ThemedText
        variant="caption"
        color={background.mutedColor}
        align="center"
        style={{ fontSize: l.refFontSize, marginTop: l.spacing, letterSpacing: 1.5 }}
      >
        {reference.toUpperCase()}
      </ThemedText>
    </LinearGradient>
  );
}
