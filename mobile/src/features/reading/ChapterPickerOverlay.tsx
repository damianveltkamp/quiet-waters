import { Pressable, ScrollView, View } from 'react-native';
import { ThemedText } from '@/components';
import { colors, spacing } from '@/theme';

interface Props {
  bookCode: string;
  bookName: string;
  chapterCount: number;
  currentChapter: number;
  onSelectChapter: (chapter: number) => void;
}

export default function ChapterPickerOverlay({
  bookName,
  chapterCount,
  currentChapter,
  onSelectChapter,
}: Props) {
  const chapters = Array.from({ length: chapterCount }, (_, i) => i + 1);
  return (
    <View style={{ backgroundColor: colors.white, borderRadius: 20, padding: spacing.md, gap: spacing.md }}>
      <ThemedText variant="eyebrow" color={colors.soft} align="center">{`${bookName} · Chapter`}</ThemedText>
      <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' }}>
        {chapters.map((c) => {
          const active = c === currentChapter;
          return (
            <Pressable
              key={c}
              onPress={() => onSelectChapter(c)}
              style={{ width: 56, alignItems: 'center', paddingVertical: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: active ? colors.accent : colors.paleAlt, backgroundColor: active ? colors.pale : colors.white }}
            >
              <ThemedText variant="body" color={colors.primary}>{String(c)}</ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
