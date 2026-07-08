import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { colors, spacing, typography } from '@/theme';
import type { FontFace } from '@/features/reading/readingStore';

export interface VerseItem {
  number: number;
  text: string;
}

export function topVisibleVerse(
  offsets: { number: number; y: number }[],
  scrollY: number,
): number {
  if (offsets.length === 0) return 1;
  let current = offsets[0].number;
  for (const o of offsets) {
    if (o.y <= scrollY + 1) current = o.number;
    else break;
  }
  return current;
}

interface VerseParagraphsProps {
  verses: VerseItem[];
  liftedVerse: number | null;
  fontFace: FontFace;
  fontScale: number;
  onLongPressVerse: (verseNumber: number) => void;
  onVerseLayout: (verseNumber: number, y: number) => void;
}

const FONT_FAMILY: Record<FontFace, string> = {
  serif: typography.families.serif,
  sans: typography.families.sans,
};

// Every verse shares this box geometry, so the lifted state never changes a
// verse's footprint — the "lifted card" is a separate absolutely-positioned
// layer that only fades its opacity. No reflow when the lift appears or clears.
const BOX_STYLE = {
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.sm,
  marginBottom: spacing.xs,
};

const CARD_STYLE = {
  backgroundColor: colors.white,
  borderRadius: 16,
  shadowColor: colors.primary,
  shadowOpacity: 0.12,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 6 },
};

interface VerseRowProps {
  verse: VerseItem;
  lifted: boolean;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  onLongPressVerse: (verseNumber: number) => void;
  onVerseLayout: (verseNumber: number, y: number) => void;
}

function VerseRow({
  verse,
  lifted,
  fontFamily,
  fontSize,
  lineHeight,
  onLongPressVerse,
  onVerseLayout,
}: VerseRowProps) {
  // The card starts fully shown/hidden to match the initial lift (no fade on
  // first mount), then animates whenever the lifted state changes.
  const cardOpacity = useRef(new Animated.Value(lifted ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(cardOpacity, {
      toValue: lifted ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [lifted, cardOpacity]);

  return (
    <Pressable
      testID={`verse-${verse.number}`}
      accessibilityState={{ selected: lifted }}
      onLongPress={() => onLongPressVerse(verse.number)}
      onLayout={(e: LayoutChangeEvent) => onVerseLayout(verse.number, e.nativeEvent.layout.y)}
      style={BOX_STYLE}
    >
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, CARD_STYLE, { opacity: cardOpacity }]} />
      <Text style={{ fontFamily, fontSize, lineHeight, color: colors.primary }}>
        <Text style={{ fontFamily: typography.families.sansMedium, fontSize: fontSize * 0.6, color: colors.soft }}>
          {verse.number}{' '}
        </Text>
        {verse.text}
      </Text>
    </Pressable>
  );
}

export default function VerseParagraphs({
  verses,
  liftedVerse,
  fontFace,
  fontScale,
  onLongPressVerse,
  onVerseLayout,
}: VerseParagraphsProps) {
  const fontSize = 20 * fontScale;
  const lineHeight = 32 * fontScale;
  const fontFamily = FONT_FAMILY[fontFace];

  return (
    <View>
      {verses.map((v) => (
        <VerseRow
          key={v.number}
          verse={v}
          lifted={v.number === liftedVerse}
          fontFamily={fontFamily}
          fontSize={fontSize}
          lineHeight={lineHeight}
          onLongPressVerse={onLongPressVerse}
          onVerseLayout={onVerseLayout}
        />
      ))}
    </View>
  );
}
