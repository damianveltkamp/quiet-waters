import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components';
import { colors, spacing } from '@/theme';
import {
  getBooks, getChapter, getVerse, getVerseByRef, listTranslations,
  type BookMeta, type TranslationId, type Verse,
} from '@/bible';
import { useWallpaperDraft } from '@/features/wallpaper/wallpaperDraft';
import { pickRandomVerse } from '@/features/wallpaper/randomVerse';

type Step = 'book' | 'chapter' | 'verse';

export default function VersePicker() {
  const router = useRouter();
  const { translation, setTranslation, setVerse } = useWallpaperDraft();
  const [testament, setTestament] = useState<'OT' | 'NT'>('NT');
  const [step, setStep] = useState<Step>('book');
  const [book, setBook] = useState<BookMeta | null>(null);
  const [chapter, setChapter] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [notFound, setNotFound] = useState(false);

  function commit(v: Verse) {
    setVerse(v.text, v.reference);
    router.back();
  }

  function onSearch() {
    const v = getVerseByRef(translation, query.trim());
    if (!v) { setNotFound(true); return; }
    commit(v);
  }

  const books = getBooks().filter((b) => b.testament === testament);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.md }}>
      {/* Search + Surprise + translation */}
      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
        <Pressable
          onPress={() => commit(pickRandomVerse(translation))}
          style={{ backgroundColor: colors.primary, borderRadius: 999, paddingVertical: spacing.sm, paddingHorizontal: spacing.md }}
        >
          <ThemedText variant="caption" color={colors.white}>✦ Surprise me</ThemedText>
        </Pressable>
        <Pressable
          onPress={() => setTranslation(nextTranslation(translation))}
          style={{ marginLeft: 'auto', backgroundColor: colors.white, borderRadius: 999, paddingVertical: spacing.sm, paddingHorizontal: spacing.md }}
        >
          <ThemedText variant="caption" color={colors.primary}>{translation} ⌄</ThemedText>
        </Pressable>
      </View>

      <TextInput
        placeholder="Search a verse"
        placeholderTextColor={colors.textFaint}
        value={query}
        onChangeText={(t) => { setQuery(t); setNotFound(false); }}
        onSubmitEditing={onSearch}
        returnKeyType="search"
        style={{ backgroundColor: colors.white, borderRadius: 999, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, color: colors.primary }}
      />
      {notFound && <ThemedText variant="caption" color={colors.textMuted}>Verse not found</ThemedText>}

      {/* OT/NT toggle */}
      <View style={{ flexDirection: 'row', backgroundColor: colors.paleAlt, borderRadius: 999, padding: 4 }}>
        {(['OT', 'NT'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => { setTestament(t); setStep('book'); setBook(null); }}
            style={{ flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: 999, backgroundColor: testament === t ? colors.white : 'transparent' }}
          >
            <ThemedText variant="caption" color={testament === t ? colors.primary : colors.textFaint}>
              {t === 'OT' ? 'Old Testament' : 'New Testament'}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {step !== 'book' && (
        <Pressable
          accessibilityLabel="Back"
          onPress={() => {
            if (step === 'verse') setStep('chapter');
            else if (step === 'chapter') setStep('book');
          }}
          style={{ alignSelf: 'flex-start', paddingVertical: spacing.sm, paddingHorizontal: spacing.md }}
        >
          <ThemedText variant="caption" color={colors.primary}>‹ Back</ThemedText>
        </Pressable>
      )}

      <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {step === 'book' && books.map((b) => (
          <Cell key={b.code} label={b.name} onPress={() => { setBook(b); setStep('chapter'); }} />
        ))}

        {step === 'chapter' && book && Array.from({ length: book.chapterCount }, (_, i) => i + 1).map((c) => (
          <Cell key={c} label={String(c)} onPress={() => { setChapter(c); setStep('verse'); }} />
        ))}

        {step === 'verse' && book && chapter && verseNumbers(translation, book.code, chapter).map((v) => (
          <Cell
            key={v}
            label={String(v)}
            onPress={() => {
              const verse = getVerse(translation, book.code, chapter, v);
              if (verse) commit(verse);
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function Cell({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ minWidth: '30%', flexGrow: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: colors.paleAlt }}
    >
      <ThemedText variant="body" color={colors.primary}>{label}</ThemedText>
    </Pressable>
  );
}

function verseNumbers(translation: TranslationId, code: string, chapter: number): number[] {
  return getChapter(translation, code, chapter)
    .map((text, i) => ({ text, n: i + 1 }))
    .filter((x) => x.text !== '')
    .map((x) => x.n);
}

function nextTranslation(current: TranslationId): TranslationId {
  const ids = listTranslations().map((t) => t.id);
  return ids[(ids.indexOf(current) + 1) % ids.length];
}
