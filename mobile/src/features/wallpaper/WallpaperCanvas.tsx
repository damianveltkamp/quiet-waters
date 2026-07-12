import { Image, ImageBackground, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { spacing } from '@/theme';
import type { Background } from './backgrounds';

interface Props {
  verseText: string;
  reference: string;
  background: Background;
  textColor: string;
  backdropOpacity: number; // 0..1
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function WallpaperCanvas({ verseText, reference, background, textColor, backdropOpacity }: Props) {
  const referenceColor = hexToRgba(textColor, 0.75);

  const content = (
    <>
      <Image
        source={require('../../../assets/images/symbol-white.png')}
        style={{ width: 22, height: 22, resizeMode: 'contain', tintColor: textColor, marginBottom: spacing.lg }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center' }}>
        <ThemedText variant="quote" align="center" color={textColor} style={{ fontSize: 30, lineHeight: 40 }}>
          "{verseText}"
        </ThemedText>
      </View>
      <ThemedText variant="eyebrow" color={referenceColor} style={{ marginTop: spacing.lg }}>
        {reference}
      </ThemedText>
    </>
  );

  const centered = {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: spacing.xl,
  };

  // Full-screen vignette scrim over every background. `s = 0` is fully
  // transparent; darker at the edges keeps centered text legible.
  const s = backdropOpacity;
  const scrim = [`rgba(0,0,0,${s})`, `rgba(0,0,0,${s * 0.35})`, `rgba(0,0,0,${s})`] as const;

  if (background.kind === 'image') {
    return (
      <ImageBackground testID="wallpaper-image" source={background.source} resizeMode="cover" style={{ flex: 1 }}>
        <LinearGradient testID="wallpaper-scrim" colors={scrim} style={centered}>
          {content}
        </LinearGradient>
      </ImageBackground>
    );
  }

  return (
    <LinearGradient colors={background.colors} style={{ flex: 1 }}>
      <LinearGradient testID="wallpaper-scrim" colors={scrim} style={centered}>
        {content}
      </LinearGradient>
    </LinearGradient>
  );
}
