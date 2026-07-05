import { View } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { ThemedText } from './ThemedText';
import { colors, spacing } from '@/theme';

type Icon = 'lock' | 'bell' | 'sparkle';

interface Props {
  icon: Icon;
  title: string;
  body: string;
  isLast?: boolean;
}

const BUBBLE_SIZE = 40;

function IconGlyph({ icon, color }: { icon: Icon; color: string }) {
  switch (icon) {
    case 'lock':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Rect x={5} y={11} width={14} height={10} rx={2} stroke={color} strokeWidth={1.8} />
          <Path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth={1.8} />
        </Svg>
      );
    case 'bell':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path
            d="M18 16v-5a6 6 0 1 0-12 0v5l-1.5 2.5h15L18 16Z"
            stroke={color}
            strokeWidth={1.8}
            strokeLinejoin="round"
          />
          <Path d="M10 20.5a2 2 0 0 0 4 0" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );
    case 'sparkle':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
          <Circle cx={12} cy={12} r={2.5} fill={color} />
        </Svg>
      );
  }
}

export function TimelineStep({ icon, title, body, isLast }: Props) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.md }}>
      <View style={{ alignItems: 'center' }}>
        <View
          style={{
            width: BUBBLE_SIZE,
            height: BUBBLE_SIZE,
            borderRadius: BUBBLE_SIZE / 2,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconGlyph icon={icon} color={colors.white} />
        </View>
        {!isLast && (
          <View style={{ flex: 1, width: 1.5, backgroundColor: colors.pale, marginVertical: spacing.xs }} />
        )}
      </View>
      <View style={{ flex: 1, paddingBottom: isLast ? 0 : spacing.lg, gap: 2 }}>
        <ThemedText variant="body" color={colors.primary} style={{ fontFamily: 'HankenGrotesk_600SemiBold' }}>
          {title}
        </ThemedText>
        <ThemedText variant="caption" color={colors.textMuted}>
          {body}
        </ThemedText>
      </View>
    </View>
  );
}
