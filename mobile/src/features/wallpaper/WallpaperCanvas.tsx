import { Image, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { spacing } from '@/theme';
import type { WallpaperBackground } from './backgrounds';

interface Props {
  verseText: string;
  reference: string;
  background: WallpaperBackground;
}

export function WallpaperCanvas({ verseText, reference, background }: Props) {
  return (
    <LinearGradient
      colors={background.colors}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl }}
    >
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
    </LinearGradient>
  );
}
