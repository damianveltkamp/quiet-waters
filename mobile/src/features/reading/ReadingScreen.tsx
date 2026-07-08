import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useFocusEffect, useRouter } from 'expo-router';
import { ThemedText } from '@/components';
import { colors, spacing } from '@/theme';
import { getBooks, getChapter } from '@/bible';
import { useReadingStore } from '@/features/reading/readingStore';
import { nextChapter, prevChapter } from '@/features/reading/chapterNavigation';
import { computeMenuTop } from '@/features/reading/menuPosition';
import VerseParagraphs, { topVisibleVerse, type VerseItem } from '@/features/reading/VerseParagraphs';
import BookPickerOverlay from '@/features/reading/BookPickerOverlay';
import ChapterPickerOverlay from '@/features/reading/ChapterPickerOverlay';
import TranslationSheet from '@/features/reading/TranslationSheet';
import TypePanel from '@/features/reading/TypePanel';
import VerseActionMenu from '@/features/reading/VerseActionMenu';

type Overlay = 'book' | 'chapter' | 'translation' | 'type' | 'actions' | null;

function Pill({ label, onPress, testID }: { label: string; onPress: () => void; testID?: string }) {
  return (
    <Pressable testID={testID} onPress={onPress} style={{ backgroundColor: colors.white, borderRadius: 999, paddingVertical: spacing.sm, paddingHorizontal: spacing.md }}>
      <ThemedText variant="button" color={colors.primary}>{label}</ThemedText>
    </Pressable>
  );
}

export default function ReadingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { position, translation, fontScale, fontFace,
    openChapter, setVerse, setTranslation, setFontScale, setFontFace } = useReadingStore();

  const books = getBooks();
  const book = useMemo(() => books.find((b) => b.code === position.bookCode) ?? books[0], [books, position.bookCode]);

  const verses: VerseItem[] = useMemo(() =>
    getChapter(translation, position.bookCode, position.chapter)
      .map((text, i) => ({ number: i + 1, text }))
      .filter((v) => v.text !== ''),
    [translation, position.bookCode, position.chapter]);

  const [overlay, setOverlay] = useState<Overlay>(null);
  const [lifted, setLifted] = useState<number | null>(position.verse);
  const [actionVerse, setActionVerse] = useState<number | null>(null);
  const [actionY, setActionY] = useState(0); // screen Y of the long-press
  const [menuHeight, setMenuHeight] = useState(0); // measured once the menu lays out
  const [containerHeight, setContainerHeight] = useState(0); // full reading-screen height

  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef(new Map<number, number>());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear the stale verse->y offsets map whenever the rendered chapter/translation
  // changes, before the new verses re-lay-out. This is the convergence point for
  // chapter/book/translation/hydration changes. It deliberately does NOT re-lift:
  // the lifted "where you left off" card is only shown on entry (see useFocusEffect).
  useEffect(() => {
    offsets.current.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position.bookCode, position.chapter, translation]);

  // Lift the saved verse (and scroll to it) only when the user lands on the Read
  // screen — on first mount and each time the tab regains focus — so it helps them
  // find their place without re-appearing every time they turn to a new chapter.
  useFocusEffect(
    useCallback(() => {
      const verse = useReadingStore.getState().position.verse;
      setLifted(verse);
      const y = offsets.current.get(verse);
      if (y != null) scrollRef.current?.scrollTo({ y: Math.max(0, y - 24), animated: false });
    }, []),
  );

  // Clear any pending debounced save on unmount.
  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  function onVerseLayout(n: number, y: number) {
    offsets.current.set(n, y);
    if (n === position.verse && lifted === position.verse) {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 24), animated: false });
    }
  }

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const y = e.nativeEvent.contentOffset.y;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const sorted = [...offsets.current.entries()].map(([number, oy]) => ({ number, y: oy })).sort((a, b) => a.y - b.y);
      setVerse(topVisibleVerse(sorted, y));
    }, 400);
  }

  function go(ref: { bookCode: string; chapter: number } | null) {
    if (!ref) return;
    offsets.current.clear();
    setLifted(null); // turning to a new chapter is not "landing on the screen" — no lift
    openChapter(ref.bookCode, ref.chapter);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  const actionVerseItem = verses.find((v) => v.number === actionVerse);
  const menuTop = computeMenuTop({
    pressY: actionY,
    menuHeight,
    containerHeight,
    insetTop: insets.top,
    insetBottom: insets.bottom,
    margin: spacing.md,
  });

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.surface }}
      onLayout={(e: LayoutChangeEvent) => setContainerHeight(e.nativeEvent.layout.height)}
    >
    <SafeAreaView style={{ flex: 1 }}>
      {/* Top chrome */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md }}>
        <Pill label={book.name} onPress={() => setOverlay('book')} />
        <Pill testID="chrome-chapter" label={String(position.chapter)} onPress={() => setOverlay('chapter')} />
        <View style={{ flex: 1 }} />
        <Pill label={translation} onPress={() => setOverlay('translation')} />
        <Pill label="Aa" onPress={() => setOverlay('type')} />
      </View>

      <ScrollView
        ref={scrollRef}
        testID="reading-scroll"
        onScroll={onScroll}
        onScrollBeginDrag={() => setLifted(null)}
        scrollEventThrottle={16}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
      >
        <ThemedText variant="eyebrow" color={colors.soft} style={{ marginBottom: spacing.md }}>
          {translation === 'KJV' ? 'King James Version' : 'Berean Standard Bible'}
        </ThemedText>
        <VerseParagraphs
          verses={verses}
          liftedVerse={lifted}
          fontFace={fontFace}
          fontScale={fontScale}
          onLongPressVerse={(n, pageY) => { setLifted(n); setActionVerse(n); setActionY(pageY); setMenuHeight(0); setOverlay('actions'); }}
          onVerseLayout={onVerseLayout}
        />
      </ScrollView>

      {/* Floating chapter arrows */}
      <View style={{ position: 'absolute', right: spacing.lg, bottom: spacing.xl, flexDirection: 'row', gap: spacing.sm }}>
        <Pressable
          testID="reading-prev"
          onPress={() => go(prevChapter({ bookCode: position.bookCode, chapter: position.chapter }))}
          style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' }}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="m15 18-6-6 6-6" stroke={colors.primary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>
        </Pressable>
        <Pressable
          testID="reading-next"
          onPress={() => go(nextChapter({ bookCode: position.bookCode, chapter: position.chapter }))}
          style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="m9 18 6-6-6-6" stroke={colors.white} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>
        </Pressable>
      </View>

      {/* Overlays (chrome-anchored). The action menu is rendered outside the
          SafeAreaView below so it can anchor to the raw screen press position. */}
      {overlay !== null && overlay !== 'actions' && (
        <Pressable onPress={() => setOverlay(null)} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(28,51,68,0.15)' }} />
      )}
      {overlay === 'book' && (
        <View style={{ position: 'absolute', left: spacing.md, right: spacing.md, top: 72 }}>
          <BookPickerOverlay onSelectBook={(code) => { offsets.current.clear(); setLifted(null); openChapter(code, 1); setOverlay('chapter'); }} />
        </View>
      )}
      {overlay === 'chapter' && (
        <View style={{ position: 'absolute', left: spacing.md, right: spacing.md, top: 72 }}>
          <ChapterPickerOverlay
            bookName={book.name}
            chapterCount={book.chapterCount}
            currentChapter={position.chapter}
            onSelectChapter={(c) => { go({ bookCode: book.code, chapter: c }); setOverlay(null); }}
          />
        </View>
      )}
      {overlay === 'type' && (
        <View style={{ position: 'absolute', left: spacing.md, right: spacing.md, top: 72 }}>
          <TypePanel fontFace={fontFace} fontScale={fontScale} onSelectFace={setFontFace} onScaleChange={setFontScale} />
        </View>
      )}
      {overlay === 'translation' && (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
          <TranslationSheet current={translation} onSelect={(id) => { setTranslation(id); setOverlay(null); }} />
        </View>
      )}
    </SafeAreaView>

    {/* Verse action menu — anchored to the press point (full-screen coordinate
        space), flipping/clamping to stay on-screen. Hidden until measured so it
        never flashes at the wrong position. */}
    {overlay === 'actions' && actionVerseItem && (
      <>
        <Pressable onPress={() => setOverlay(null)} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(28,51,68,0.15)' }} />
        <View
          onLayout={(e: LayoutChangeEvent) => setMenuHeight(e.nativeEvent.layout.height)}
          style={{ position: 'absolute', left: spacing.md, right: spacing.md, top: menuTop, opacity: menuHeight > 0 ? 1 : 0 }}
        >
          <VerseActionMenu
            verseText={actionVerseItem.text}
            reference={`${book.name} ${position.chapter}:${actionVerseItem.number}`}
            translation={translation}
            onCreateWallpaper={() => { setOverlay(null); router.push('/(tabs)/create'); }}
            onClose={() => setOverlay(null)}
          />
        </View>
      </>
    )}
    </View>
  );
}
