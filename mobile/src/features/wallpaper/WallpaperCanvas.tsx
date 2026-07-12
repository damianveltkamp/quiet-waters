import { Image, ImageBackground, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { spacing } from '@/theme';
import type { Background } from './backgrounds';

interface Props {
  verseText: string;
  reference: string;
  background: Background;
}

export function WallpaperCanvas({ verseText, reference, background }: Props) {
  const content = (
    <>
      <Image
        source={require('../../../assets/images/symbol-white.png')}
        style={{
          width: 22,
          height: 22,
          resizeMode: 'contain',
          tintColor: background.textColor,
          marginBottom: spacing.lg,
        }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center' }}>
        <ThemedText variant="quote" align="center" color={background.textColor} style={{ fontSize: 30, lineHeight: 40 }}>
          "{verseText}"
        </ThemedText>
      </View>
      <ThemedText variant="eyebrow" color={background.mutedColor} style={{ marginTop: spacing.lg }}>
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

  if (background.kind === 'image') {
    const s = background.scrim ?? 0.4;
    const edge = Math.min(s + 0.15, 0.85);
    const mid = s * 0.3;
    const scrim = [`rgba(0,0,0,${edge})`, `rgba(0,0,0,${mid})`, `rgba(0,0,0,${edge})`] as const;
    return (
      <ImageBackground testID="wallpaper-image" source={background.source} resizeMode="cover" style={{ flex: 1 }}>
        <LinearGradient testID="wallpaper-scrim" colors={scrim} style={centered}>
          {content}
        </LinearGradient>
      </ImageBackground>
    );
  }

  return (
    <LinearGradient colors={background.colors} style={centered}>
      {content}
    </LinearGradient>
  );
}
