# Bible Reading — Design

**Date:** 2026-07-08
**Status:** Approved (pending spec review)

## Goal

A calm, book-like Bible reading experience as a new tab in the mobile app.
Continuous serif paragraphs, quiet chrome, and an auto-saved reading position so
the user never has to remember where they left off. Reading also feeds the
existing wallpaper feature and a plain-text share flow that doubles as a growth
loop.

Designs live in `design/bible-reading/`: `reading.png`, `book-picker.png`,
`chapter-picker.png`, `translation-switcher.png`, `type-panel.png`,
`verse-action-menu.png`.

## Key decisions

- **Translations:** Ship **BSB + KJV only** (both already bundled, public
  domain). No NIV/ESV/NLT/MSG — those are copyrighted and out of scope. The
  translation switcher lists exactly the two available; no greyed "coming soon"
  rows.
- **Navigation:** Add **"Read" as a 4th tab** (Today | Create | You | Read). No
  changes to the existing three tabs.
- **Verse actions trigger:** **Long-press** a verse opens the action menu. A
  plain tap does not open it.
- **Reading position:** Auto-saved, **verse-anchored** (never a pixel scroll
  offset), so it survives font-size and translation changes. Saved position is
  the top-most visible verse, debounced.
- **Lifted card:** On entering a chapter, scroll to the saved verse and lift it
  into the white card. As the user scrolls, the card settles back into normal
  paragraph flow ("floats, then fades").
- **Type panel:** Size slider + **two typefaces only — Serif / Sans**
  ("Classic" dropped). Serif = Cormorant Garamond (bundled), Sans = Hanken
  Grotesk (bundled).
- **Persistence:** Zustand `persist` backed by **MMKV**. Chosen for synchronous
  hydration (no position flash on launch). Requires adding `react-native-mmkv`
  + `expo-dev-client` and moving the project to a custom dev build (leaves Expo
  Go).
- **Share:** Plain-text OS share sheet, including an attribution line naming
  **Quiet Waters** + an App Store URL (growth loop). URL is a config constant
  with a placeholder until the app is published.
- **Overlays:** Book picker, chapter picker, translation sheet, and type panel
  are **in-screen animated overlays** (top pills remain visible underneath), not
  separate modal routes.

## Module structure

New feature module `src/features/reading/`, mirroring `features/wallpaper/`:

- `readingStore.ts` — persisted Zustand store (MMKV) for position + preferences.
- `ReadingScreen.tsx` — scrollable chapter view + top chrome + floating nav arrows.
- `VerseParagraphs.tsx` — renders a chapter as flowing paragraphs with
  superscript verse numbers; handles "lift on entry" and long-press.
- `BookPickerOverlay.tsx` — OT/NT toggle + book grid.
- `ChapterPickerOverlay.tsx` — numbered chapter grid.
- `TranslationSheet.tsx` — bottom sheet listing KJV + BSB.
- `TypePanel.tsx` — size slider + Serif/Sans toggle.
- `VerseActionMenu.tsx` — Share / Create wallpaper sheet.
- `shareVerse.ts` — builds share text and invokes the OS share sheet.
- `chapterNavigation.ts` — continuous prev/next chapter across book boundaries.

New tab route: `src/app/(tabs)/read.tsx` — thin wrapper rendering `ReadingScreen`.

All bible content comes through the **existing** `@/bible` API (`getBooks`,
`getChapter`, `getVerse`). No changes to that layer.

## State model

`readingStore` (MMKV-persisted):

```ts
{
  position:    { bookCode: string; chapter: number; verse: number },
  translation: 'KJV' | 'BSB',
  fontScale:   number,          // multiplier, default 1.0, range ~0.85–1.5
  fontFace:    'serif' | 'sans', // default 'serif'
}
```

- **First-ever launch default:** John 1:1 (`{ bookCode: 'JHN', chapter: 1, verse: 1 }`).
- Position auto-saves (debounced ~400ms) to the top-most visible verse while
  scrolling.

## Reading screen & interactions

- Chapter renders as continuous paragraphs with quiet superscript verse numbers
  (per `reading.png`), in the selected face at `fontScale`.
- **On entry:** scroll to `position.verse`, lift it into the white card; card
  settles into normal flow as the user scrolls.
- **Long-press a verse:** lift it into the card and open `VerseActionMenu` above
  the actions (per `verse-action-menu.png`).
- **Top chrome** (fades slightly while scrolling): `[Book ▾] [Chapter]` pills
  left, `[KJV] [Aa]` right. Each pill toggles its overlay.
- **Floating prev/next arrows** (bottom-right): move between chapters, flowing
  continuously across book boundaries (Matthew 28 → Mark 1). Prev disabled at
  Genesis 1; next disabled at Revelation 22.

## Overlays (in-screen, animated)

- **Book picker:** OT/NT segmented toggle + book grid from `getBooks()` filtered
  by `testament`. Selecting a book opens the chapter picker.
- **Chapter picker:** numbered grid `1..chapterCount`, current chapter highlighted.
- **Translation sheet (bottom sheet):** KJV + BSB, checkmark on active.
- **Type panel (popover under Aa):** size slider (~0.85×–1.5×) + Serif/Sans toggle.

## Verse actions

- **Share verse:** OS share sheet with text:

  > "Come unto me, all ye that labour and are heavy laden, and I will give you
  > rest." — Matthew 11:28 (KJV)
  >
  > Shared from Quiet Waters — {APP_STORE_URL}

  `APP_STORE_URL` is a config constant with a placeholder until published.

- **Create wallpaper:** call `useWallpaperDraft.setVerse(text, reference)` +
  `setTranslation(current)`, then navigate to the Create tab. The user lands on
  the wallpaper canvas with the verse pre-loaded, ready to pick a background and
  save.

## Persistence / build

`readingStore` uses Zustand `persist` with an MMKV-backed storage adapter.
Adds `react-native-mmkv` + `expo-dev-client`; project moves to a custom dev
build (no longer runs in Expo Go). Synchronous MMKV reads mean the persisted
position is available on first render — no flash of "top of chapter" before the
jump.

## Testing

- `readingStore`: position save/restore, defaults, boundary clamping.
- `chapterNavigation`: continuous next/prev across book boundaries; disabled at
  the ends of the canon.
- `shareVerse`: text formatting (verse, reference, translation, attribution).
- Wallpaper handoff: draft populated with verse + translation and correct
  navigation target.
- Component tests: verse rendering + long-press menu, following existing
  `__tests__` conventions.

## Out of scope (v1)

- Copyrighted translations (NIV/ESV/NLT/MSG).
- Verse highlighting, bookmarks, notes.
- Search within reading.
- Cross-device sync.
- Audio.
- The right-column "NOTES" annotations in `reading.png` are designer notes, not
  UI to build.
