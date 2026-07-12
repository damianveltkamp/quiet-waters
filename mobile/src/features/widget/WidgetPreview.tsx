import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { ThemedText } from '@/components';
import type { WallpaperBackground } from '@/features/wallpaper/backgrounds';
import { familyLayout, type WidgetFamily } from './widgetLayout';

// Real on-device widget point sizes (iPhone 15 size class). Rendering the card
// AND the fonts at these sizes under ONE shared scale is what makes the preview
// proportional and 1:1 with the home screen: small and medium share a height,
// medium is double-width, large is medium-width but roughly double-height.
const POINT_SIZE: Record<WidgetFamily, { width: number; height: number }> = {
  small: { width: 158, height: 158 },
  medium: { width: 338, height: 158 },
  large: { width: 338, height: 354 },
};
// Largest footprint — bounds the shared scale so every family fits the same box.
const REF = POINT_SIZE.large;

export interface WidgetPreviewProps {
  family: WidgetFamily;
  background: WallpaperBackground;
  verseText: string;
  reference: string;
}

/**
 * A faithful, non-interactive preview of the Daily Verse widget at one of the
 * three Apple size families. Mirrors widgets/QuietWatersWidget.tsx: a SOLID
 * background (the widget's `containerBackground(bgTop)` — a gradient container
 * background isn't expressible in expo-widgets), centered cross + serif verse
 * (shrinks to fit, mirroring the widget's minimumScaleFactor) + uppercase
 * reference. All three families render at their real point sizes under one
 * shared scale, so their relative sizes match the home screen exactly.
 */
export function WidgetPreview({ family, background, verseText, reference }: WidgetPreviewProps) {
  const [avail, setAvail] = useState<{ w: number; h: number } | null>(null);
  const l = familyLayout(family);
  const dims = POINT_SIZE[family];
  // The widget renders a solid containerBackground: gradient backgrounds use their
  // top stop; image backgrounds use their dominant fallback color.
  const solidColor =
    background.kind === 'gradient' ? background.colors[0] : background.fallbackColor;
  // One scale for every family so their sizes stay relative; never upscale past
  // actual size (cap at 1 → the preview is at most life-size). Fonts scale too,
  // so the card looks like a scaled photo of the real widget.
  const scale = avail ? Math.min(avail.w / REF.width, avail.h / REF.height, 1) : 1;

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setAvail((prev) => (prev && prev.w === width && prev.h === height ? prev : { w: width, h: height }));
  };

  return (
    <View
      style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}
      onLayout={onLayout}
    >
      <View
        style={{
          width: dims.width * scale,
          height: dims.height * scale,
          borderRadius: 24 * scale,
          overflow: 'hidden',
          padding: l.padding * scale,
          backgroundColor: solidColor,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ThemedText
          variant="body"
          color={background.mutedColor}
          style={{ fontSize: l.crossSize * scale, marginBottom: l.spacing * scale }}
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
          // flexShrink + minHeight:0 bound the verse to the card so a long verse
          // shrinks to fit (like the widget's minimumScaleFactor) instead of
          // overflowing. No fixed lineHeight — it fights the shrink.
          style={{ flexShrink: 1, minHeight: 0, fontSize: l.verseFontSize * scale }}
        >
          {verseText}
        </ThemedText>
        <ThemedText
          variant="caption"
          color={background.mutedColor}
          align="center"
          style={{ fontSize: l.refFontSize * scale, marginTop: l.spacing * scale, letterSpacing: 1.5 }}
        >
          {reference.toUpperCase()}
        </ThemedText>
      </View>
    </View>
  );
}
