import { Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
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
      {verses.map((v) => {
        const lifted = v.number === liftedVerse;
        return (
          <Pressable
            key={v.number}
            testID={`verse-${v.number}`}
            onLongPress={() => onLongPressVerse(v.number)}
            onLayout={(e: LayoutChangeEvent) => onVerseLayout(v.number, e.nativeEvent.layout.y)}
            style={
              lifted
                ? {
                    backgroundColor: colors.white,
                    borderRadius: 16,
                    padding: spacing.md,
                    marginVertical: spacing.sm,
                    shadowColor: colors.primary,
                    shadowOpacity: 0.12,
                    shadowRadius: 16,
                    shadowOffset: { width: 0, height: 6 },
                  }
                : { marginBottom: spacing.xs }
            }
          >
            <Text style={{ fontFamily, fontSize, lineHeight, color: colors.primary }}>
              <Text style={{ fontFamily: typography.families.sansMedium, fontSize: fontSize * 0.6, color: colors.soft }}>
                {v.number}{' '}
              </Text>
              {v.text}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
