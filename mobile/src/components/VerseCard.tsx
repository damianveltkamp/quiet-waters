import { View, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from './ThemedText';
import { colors, spacing } from '@/theme';
import { tapFeedback } from '@/lib/haptics';

interface Props {
  verse: string;
  reference: string;
  onShare: () => void;
}

function ShareIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v13M12 3l-4 4M12 3l4 4" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function VerseCard({ verse, reference, onShare }: Props) {
  const handleShare = () => {
    tapFeedback();
    onShare();
  };
  return (
    <LinearGradient colors={[colors.mid, colors.primary]} style={{ borderRadius: 28, padding: spacing.lg, gap: spacing.md }}>
      <View style={{ paddingVertical: spacing.md, alignItems: 'center' }}>
        <ThemedText variant="quote" color={colors.white} align="center">{`“${verse}”`}</ThemedText>
      </View>
      <ThemedText variant="eyebrow" color={colors.accent} align="center">{reference}</ThemedText>
      <Pressable
        onPress={handleShare}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          alignSelf: 'stretch',
          paddingVertical: spacing.md,
          borderRadius: 999,
          backgroundColor: 'rgba(255,255,255,0.14)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.22)',
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <ShareIcon color={colors.white} />
        <ThemedText variant="button" color={colors.white}>Share</ThemedText>
      </Pressable>
    </LinearGradient>
  );
}
