import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { getBooks } from '@/bible';
import { ThemedText } from '@/components';
import { colors, spacing } from '@/theme';

interface Props {
  onSelectBook: (bookCode: string) => void;
}

export default function BookPickerOverlay({ onSelectBook }: Props) {
  const [testament, setTestament] = useState<'OT' | 'NT'>('NT');
  const books = getBooks().filter((b) => b.testament === testament);

  return (
    <View style={{ backgroundColor: colors.white, borderRadius: 20, padding: spacing.md, gap: spacing.md }}>
      <View style={{ flexDirection: 'row', backgroundColor: colors.paleAlt, borderRadius: 999, padding: 4 }}>
        {(['OT', 'NT'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTestament(t)}
            style={{ flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: 999, backgroundColor: testament === t ? colors.white : 'transparent' }}
          >
            <ThemedText variant="caption" color={testament === t ? colors.primary : colors.textFaint}>
              {t === 'OT' ? 'Old Testament' : 'New Testament'}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {books.map((b) => (
          <Pressable
            key={b.code}
            onPress={() => onSelectBook(b.code)}
            style={{ minWidth: '30%', flexGrow: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: colors.paleAlt }}
          >
            <ThemedText variant="body" color={colors.primary}>{b.name}</ThemedText>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
