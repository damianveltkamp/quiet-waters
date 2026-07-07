# Bible Data + `getVerse` API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a local, offline Bible data layer (KJV + BSB) plus a typed loader API (`getVerse`, `getChapter`, `getBooks`, `listTranslations`, `resolveReference`, `getVerseByRef`) with no UI.

**Architecture:** A dev-only Node script downloads two public-domain translations from AO Lab, normalizes them to lean verse-text-only per-book JSON committed to the repo, and generates a static `require`-thunk map for lazy per-book loading. A small pure-TypeScript module reads that data. Everything lives under a new `mobile/src/bible/` directory; nothing else in the app is touched.

**Tech Stack:** TypeScript (strict), Expo SDK 57, Metro bundler (native JSON `require`), Jest via `jest-expo`, Node 18+ (generator only).

## Global Constraints

- **Expo SDK 57** — read the versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any Expo-specific code (`mobile/AGENTS.md`).
- **No new runtime dependencies** — this feature is pure TS + bundled JSON; do not add `expo-file-system`, `expo-asset`, or a SQLite lib.
- **TypeScript strict mode**; import via the `@/*` path alias (`@/bible` → `mobile/src/bible`).
- **Tests** run with `npm test` (from `mobile/`), preset `jest-expo`; test files use Jest globals (`test`, `expect`) and live in `__tests__/` beside the code.
- **Translations:** exactly two, both public domain — `BSB` (upstream id `BSB`) and `KJV` (upstream id `eng_kjv`). Each has all 66 Protestant-canon books.
- **Data shape:** normalized per-book JSON `{ code, name, chapters: string[][] }`, verse text only (no headings/footnotes). Verse `n` is at chapter array index `n-1`; chapter `c` at `chapters[c-1]`.
- **Out of scope:** any UI, navigation, download-on-demand, edits to `src/content/verses.ts` or the Today screen.
- Commit after every task. Work stays on branch `worktree-bible-data-api`.

---

### Task 0: Worktree setup & clean baseline

**Files:** none created — environment prep.

- [ ] **Step 1: Install dependencies in the worktree**

Run (from repo root of the worktree):
```bash
cd mobile && npm install
```
Expected: completes without errors; `node_modules/` populated.

- [ ] **Step 2: Confirm `resolveJsonModule` is enabled**

Run:
```bash
cd mobile && node -e "console.log(require('expo/tsconfig.base.json').compilerOptions.resolveJsonModule)"
```
Expected: `true`. (Inherited via `tsconfig.json`'s `extends: "expo/tsconfig.base"`, so importing/`require`-ing `.json` type-checks.) If it prints `undefined`/`false`, add `"resolveJsonModule": true` to `mobile/tsconfig.json` `compilerOptions` before proceeding.

- [ ] **Step 3: Run the baseline test suite**

Run:
```bash
cd mobile && npm test
```
Expected: existing suite passes (0 failures). If anything fails, stop and report before implementing.

---

### Task 1: Types + canonical book table

**Files:**
- Create: `mobile/src/bible/types.ts`
- Create: `mobile/src/bible/books.ts`
- Test: `mobile/src/bible/__tests__/books.test.ts`

**Interfaces:**
- Produces:
  - `type TranslationId = 'BSB' | 'KJV'`
  - `interface Book { code: string; name: string; chapters: string[][] }`
  - `interface BookMeta { code: string; name: string; testament: 'OT' | 'NT'; order: number; chapterCount: number }`
  - `interface TranslationMeta { id: TranslationId; name: string; license: string; licenseUrl: string }`
  - `interface Verse { text: string; reference: string }`
  - `interface Reference { bookCode: string; chapter: number; verse: number }`
  - `const BOOKS: BookMeta[]` (66 entries, canonical order)
  - `function matchBook(token: string): BookMeta | undefined` — resolves a free-text book token (full name or common abbreviation, case-insensitive, singular/plural tolerant) to its `BookMeta`.

- [ ] **Step 1: Write the failing test**

Create `mobile/src/bible/__tests__/books.test.ts`:
```ts
import { BOOKS, matchBook } from '@/bible/books';

test('BOOKS has all 66 canonical books in order', () => {
  expect(BOOKS).toHaveLength(66);
  expect(BOOKS[0]).toMatchObject({ code: 'GEN', name: 'Genesis', order: 1, chapterCount: 50 });
  expect(BOOKS[65]).toMatchObject({ code: 'REV', name: 'Revelation', order: 66, chapterCount: 22 });
  expect(BOOKS.map((b) => b.order)).toEqual(Array.from({ length: 66 }, (_, i) => i + 1));
});

test('BOOKS splits 39 OT / 27 NT and has unique codes', () => {
  expect(BOOKS.filter((b) => b.testament === 'OT')).toHaveLength(39);
  expect(BOOKS.filter((b) => b.testament === 'NT')).toHaveLength(27);
  expect(new Set(BOOKS.map((b) => b.code)).size).toBe(66);
});

test('matchBook resolves full names, case-insensitively', () => {
  expect(matchBook('Genesis')?.code).toBe('GEN');
  expect(matchBook('genesis')?.code).toBe('GEN');
  expect(matchBook('Song of Solomon')?.code).toBe('SNG');
});

test('matchBook resolves numbered books with/without spaces', () => {
  expect(matchBook('1 John')?.code).toBe('1JN');
  expect(matchBook('1john')?.code).toBe('1JN');
  expect(matchBook('1 Jn')?.code).toBe('1JN');
});

test('matchBook tolerates Psalm/Psalms and common abbreviations', () => {
  expect(matchBook('Psalm')?.code).toBe('PSA');
  expect(matchBook('Psalms')?.code).toBe('PSA');
  expect(matchBook('Gen')?.code).toBe('GEN');
});

test('matchBook returns undefined for junk', () => {
  expect(matchBook('Nope')).toBeUndefined();
  expect(matchBook('')).toBeUndefined();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mobile && npm test -- books.test`
Expected: FAIL — cannot find module `@/bible/books`.

- [ ] **Step 3: Create `types.ts`**

Create `mobile/src/bible/types.ts`:
```ts
export type TranslationId = 'BSB' | 'KJV';

/** A fully-loaded book: chapters[c-1][v-1] = verse text. */
export interface Book {
  code: string;
  name: string;
  chapters: string[][];
}

export interface BookMeta {
  code: string;
  name: string;
  testament: 'OT' | 'NT';
  order: number;
  chapterCount: number;
}

export interface TranslationMeta {
  id: TranslationId;
  name: string;
  license: string;
  licenseUrl: string;
}

export interface Verse {
  text: string;
  reference: string;
}

export interface Reference {
  bookCode: string;
  chapter: number;
  verse: number;
}
```

- [ ] **Step 4: Create `books.ts` with the canonical table + `matchBook`**

Create `mobile/src/bible/books.ts`:
```ts
import type { BookMeta } from './types';

export const BOOKS: BookMeta[] = [
  { code: 'GEN', name: 'Genesis', testament: 'OT', order: 1, chapterCount: 50 },
  { code: 'EXO', name: 'Exodus', testament: 'OT', order: 2, chapterCount: 40 },
  { code: 'LEV', name: 'Leviticus', testament: 'OT', order: 3, chapterCount: 27 },
  { code: 'NUM', name: 'Numbers', testament: 'OT', order: 4, chapterCount: 36 },
  { code: 'DEU', name: 'Deuteronomy', testament: 'OT', order: 5, chapterCount: 34 },
  { code: 'JOS', name: 'Joshua', testament: 'OT', order: 6, chapterCount: 24 },
  { code: 'JDG', name: 'Judges', testament: 'OT', order: 7, chapterCount: 21 },
  { code: 'RUT', name: 'Ruth', testament: 'OT', order: 8, chapterCount: 4 },
  { code: '1SA', name: '1 Samuel', testament: 'OT', order: 9, chapterCount: 31 },
  { code: '2SA', name: '2 Samuel', testament: 'OT', order: 10, chapterCount: 24 },
  { code: '1KI', name: '1 Kings', testament: 'OT', order: 11, chapterCount: 22 },
  { code: '2KI', name: '2 Kings', testament: 'OT', order: 12, chapterCount: 25 },
  { code: '1CH', name: '1 Chronicles', testament: 'OT', order: 13, chapterCount: 29 },
  { code: '2CH', name: '2 Chronicles', testament: 'OT', order: 14, chapterCount: 36 },
  { code: 'EZR', name: 'Ezra', testament: 'OT', order: 15, chapterCount: 10 },
  { code: 'NEH', name: 'Nehemiah', testament: 'OT', order: 16, chapterCount: 13 },
  { code: 'EST', name: 'Esther', testament: 'OT', order: 17, chapterCount: 10 },
  { code: 'JOB', name: 'Job', testament: 'OT', order: 18, chapterCount: 42 },
  { code: 'PSA', name: 'Psalms', testament: 'OT', order: 19, chapterCount: 150 },
  { code: 'PRO', name: 'Proverbs', testament: 'OT', order: 20, chapterCount: 31 },
  { code: 'ECC', name: 'Ecclesiastes', testament: 'OT', order: 21, chapterCount: 12 },
  { code: 'SNG', name: 'Song of Solomon', testament: 'OT', order: 22, chapterCount: 8 },
  { code: 'ISA', name: 'Isaiah', testament: 'OT', order: 23, chapterCount: 66 },
  { code: 'JER', name: 'Jeremiah', testament: 'OT', order: 24, chapterCount: 52 },
  { code: 'LAM', name: 'Lamentations', testament: 'OT', order: 25, chapterCount: 5 },
  { code: 'EZK', name: 'Ezekiel', testament: 'OT', order: 26, chapterCount: 48 },
  { code: 'DAN', name: 'Daniel', testament: 'OT', order: 27, chapterCount: 12 },
  { code: 'HOS', name: 'Hosea', testament: 'OT', order: 28, chapterCount: 14 },
  { code: 'JOL', name: 'Joel', testament: 'OT', order: 29, chapterCount: 3 },
  { code: 'AMO', name: 'Amos', testament: 'OT', order: 30, chapterCount: 9 },
  { code: 'OBA', name: 'Obadiah', testament: 'OT', order: 31, chapterCount: 1 },
  { code: 'JON', name: 'Jonah', testament: 'OT', order: 32, chapterCount: 4 },
  { code: 'MIC', name: 'Micah', testament: 'OT', order: 33, chapterCount: 7 },
  { code: 'NAM', name: 'Nahum', testament: 'OT', order: 34, chapterCount: 3 },
  { code: 'HAB', name: 'Habakkuk', testament: 'OT', order: 35, chapterCount: 3 },
  { code: 'ZEP', name: 'Zephaniah', testament: 'OT', order: 36, chapterCount: 3 },
  { code: 'HAG', name: 'Haggai', testament: 'OT', order: 37, chapterCount: 2 },
  { code: 'ZEC', name: 'Zechariah', testament: 'OT', order: 38, chapterCount: 14 },
  { code: 'MAL', name: 'Malachi', testament: 'OT', order: 39, chapterCount: 4 },
  { code: 'MAT', name: 'Matthew', testament: 'NT', order: 40, chapterCount: 28 },
  { code: 'MRK', name: 'Mark', testament: 'NT', order: 41, chapterCount: 16 },
  { code: 'LUK', name: 'Luke', testament: 'NT', order: 42, chapterCount: 24 },
  { code: 'JHN', name: 'John', testament: 'NT', order: 43, chapterCount: 21 },
  { code: 'ACT', name: 'Acts', testament: 'NT', order: 44, chapterCount: 28 },
  { code: 'ROM', name: 'Romans', testament: 'NT', order: 45, chapterCount: 16 },
  { code: '1CO', name: '1 Corinthians', testament: 'NT', order: 46, chapterCount: 16 },
  { code: '2CO', name: '2 Corinthians', testament: 'NT', order: 47, chapterCount: 13 },
  { code: 'GAL', name: 'Galatians', testament: 'NT', order: 48, chapterCount: 6 },
  { code: 'EPH', name: 'Ephesians', testament: 'NT', order: 49, chapterCount: 6 },
  { code: 'PHP', name: 'Philippians', testament: 'NT', order: 50, chapterCount: 4 },
  { code: 'COL', name: 'Colossians', testament: 'NT', order: 51, chapterCount: 4 },
  { code: '1TH', name: '1 Thessalonians', testament: 'NT', order: 52, chapterCount: 5 },
  { code: '2TH', name: '2 Thessalonians', testament: 'NT', order: 53, chapterCount: 3 },
  { code: '1TI', name: '1 Timothy', testament: 'NT', order: 54, chapterCount: 6 },
  { code: '2TI', name: '2 Timothy', testament: 'NT', order: 55, chapterCount: 4 },
  { code: 'TIT', name: 'Titus', testament: 'NT', order: 56, chapterCount: 3 },
  { code: 'PHM', name: 'Philemon', testament: 'NT', order: 57, chapterCount: 1 },
  { code: 'HEB', name: 'Hebrews', testament: 'NT', order: 58, chapterCount: 13 },
  { code: 'JAS', name: 'James', testament: 'NT', order: 59, chapterCount: 5 },
  { code: '1PE', name: '1 Peter', testament: 'NT', order: 60, chapterCount: 5 },
  { code: '2PE', name: '2 Peter', testament: 'NT', order: 61, chapterCount: 3 },
  { code: '1JN', name: '1 John', testament: 'NT', order: 62, chapterCount: 5 },
  { code: '2JN', name: '2 John', testament: 'NT', order: 63, chapterCount: 1 },
  { code: '3JN', name: '3 John', testament: 'NT', order: 64, chapterCount: 1 },
  { code: 'JUD', name: 'Jude', testament: 'NT', order: 65, chapterCount: 1 },
  { code: 'REV', name: 'Revelation', testament: 'NT', order: 66, chapterCount: 22 },
];

/** Extra recognized aliases (lowercase, no spaces/punctuation) → book code. */
const ALIASES: Record<string, string> = {
  gen: 'GEN', exo: 'EXO', exod: 'EXO', lev: 'LEV', num: 'NUM', deu: 'DEU', deut: 'DEU',
  jos: 'JOS', josh: 'JOS', jdg: 'JDG', judg: 'JDG', rut: 'RUT', ruth: 'RUT',
  '1sa': '1SA', '1sam': '1SA', '2sa': '2SA', '2sam': '2SA',
  '1ki': '1KI', '1kgs': '1KI', '2ki': '2KI', '2kgs': '2KI',
  '1ch': '1CH', '1chr': '1CH', '2ch': '2CH', '2chr': '2CH',
  ezr: 'EZR', neh: 'NEH', est: 'EST', esth: 'EST', job: 'JOB',
  psa: 'PSA', psalm: 'PSA', psalms: 'PSA', ps: 'PSA', pro: 'PRO', prov: 'PRO',
  ecc: 'ECC', eccl: 'ECC', sng: 'SNG', song: 'SNG', songofsolomon: 'SNG', songofsongs: 'SNG',
  isa: 'ISA', jer: 'JER', lam: 'LAM', ezk: 'EZK', ezek: 'EZK', dan: 'DAN',
  hos: 'HOS', jol: 'JOL', joel: 'JOL', amo: 'AMO', amos: 'AMO', oba: 'OBA', obad: 'OBA',
  jon: 'JON', jonah: 'JON', mic: 'MIC', nam: 'NAM', nah: 'NAM', hab: 'HAB',
  zep: 'ZEP', zeph: 'ZEP', hag: 'HAG', zec: 'ZEC', zech: 'ZEC', mal: 'MAL',
  mat: 'MAT', matt: 'MAT', mrk: 'MRK', mark: 'MRK', luk: 'LUK', luke: 'LUK',
  jhn: 'JHN', john: 'JHN', act: 'ACT', acts: 'ACT', rom: 'ROM',
  '1co': '1CO', '1cor': '1CO', '2co': '2CO', '2cor': '2CO', gal: 'GAL',
  eph: 'EPH', php: 'PHP', phil: 'PHP', col: 'COL',
  '1th': '1TH', '1thess': '1TH', '2th': '2TH', '2thess': '2TH',
  '1ti': '1TI', '1tim': '1TI', '2ti': '2TI', '2tim': '2TI',
  tit: 'TIT', titus: 'TIT', phm: 'PHM', phlm: 'PHM', philemon: 'PHM',
  heb: 'HEB', jas: 'JAS', james: 'JAS',
  '1pe': '1PE', '1pet': '1PE', '2pe': '2PE', '2pet': '2PE',
  '1jn': '1JN', '1john': '1JN', '2jn': '2JN', '2john': '2JN', '3jn': '3JN', '3john': '3JN',
  jud: 'JUD', jude: 'JUD', rev: 'REV',
};

const BY_CODE = new Map(BOOKS.map((b) => [b.code, b]));

/** Normalize a token: lowercase, strip everything but a-z and 0-9. */
function norm(token: string): string {
  return token.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const BY_NORM_NAME = new Map(BOOKS.map((b) => [norm(b.name), b]));

export function matchBook(token: string): BookMeta | undefined {
  const key = norm(token);
  if (!key) return undefined;
  const byName = BY_NORM_NAME.get(key);
  if (byName) return byName;
  const aliasCode = ALIASES[key];
  if (aliasCode) return BY_CODE.get(aliasCode);
  return BY_CODE.get(token.toUpperCase());
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd mobile && npm test -- books.test`
Expected: PASS (all 6 tests).

- [ ] **Step 6: Type-check**

Run: `cd mobile && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add mobile/src/bible/types.ts mobile/src/bible/books.ts mobile/src/bible/__tests__/books.test.ts
git commit -m "feat(bible): add types and canonical book table with matchBook"
```

---

### Task 2: Data generator script + committed per-book JSON

**Files:**
- Create: `mobile/scripts/build-bible-data.mjs`
- Create (generated): `mobile/src/bible/data/BSB/*.json`, `mobile/src/bible/data/KJV/*.json` (66 each)
- Create (generated): `mobile/src/bible/data/index.ts`

**Interfaces:**
- Consumes: `TranslationId`, `Book` from `../types` (referenced by the generated `data/index.ts`).
- Produces: `const BIBLE_DATA: Record<TranslationId, Record<string, () => Book>>` exported from `@/bible/data` — a lazy map from book code to a thunk that `require()`s and returns that book's normalized JSON.

- [ ] **Step 1: Write the generator script**

Create `mobile/scripts/build-bible-data.mjs`:
```js
// Dev-only. Downloads KJV + BSB from AO Lab, normalizes to lean per-book JSON,
// and generates src/bible/data/index.ts (a lazy require map).
// Run: node scripts/build-bible-data.mjs   (from the mobile/ directory, Node 18+)
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(HERE, '..', 'src', 'bible', 'data');
const BASE = 'https://bible.helloao.org/api';

// exposed id -> upstream AO Lab id
const TRANSLATIONS = [
  { id: 'BSB', upstream: 'BSB' },
  { id: 'KJV', upstream: 'eng_kjv' },
];

// The 66 Protestant-canon codes we ship (must match src/bible/books.ts).
const CODES = [
  'GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA','1KI','2KI','1CH','2CH','EZR',
  'NEH','EST','JOB','PSA','PRO','ECC','SNG','ISA','JER','LAM','EZK','DAN','HOS','JOL','AMO',
  'OBA','JON','MIC','NAM','HAB','ZEP','HAG','ZEC','MAL','MAT','MRK','LUK','JHN','ACT','ROM',
  '1CO','2CO','GAL','EPH','PHP','COL','1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS','1PE',
  '2PE','1JN','2JN','3JN','JUD','REV',
];

function normalizeChapter(chapterObj) {
  // chapterObj.content is a flat array of { type, number?, content? } items.
  // Accumulate verse text by verse number, joining string parts only.
  const byNumber = new Map();
  for (const item of chapterObj.content ?? []) {
    if (item?.type !== 'verse' || typeof item.number !== 'number') continue;
    const parts = (item.content ?? []).filter((p) => typeof p === 'string');
    const text = parts.join('').replace(/\s+/g, ' ').trim();
    const prev = byNumber.get(item.number);
    byNumber.set(item.number, prev ? `${prev} ${text}`.trim() : text);
  }
  const max = byNumber.size ? Math.max(...byNumber.keys()) : 0;
  const verses = [];
  for (let n = 1; n <= max; n++) verses.push(byNumber.get(n) ?? '');
  return verses;
}

async function build() {
  await rm(DATA_DIR, { recursive: true, force: true });
  for (const { id, upstream } of TRANSLATIONS) {
    console.log(`Fetching ${id} (${upstream})...`);
    const res = await fetch(`${BASE}/${upstream}/complete.json`);
    if (!res.ok) throw new Error(`${id}: HTTP ${res.status}`);
    const data = await res.json();
    const outDir = join(DATA_DIR, id);
    await mkdir(outDir, { recursive: true });

    const byCode = new Map(data.books.map((b) => [b.id, b]));
    for (const code of CODES) {
      const book = byCode.get(code);
      if (!book) throw new Error(`${id}: missing book ${code}`);
      const chapters = book.chapters.map((c) => normalizeChapter(c.chapter));
      const out = { code, name: book.commonName ?? book.name, chapters };
      await writeFile(join(outDir, `${code}.json`), JSON.stringify(out));
    }
    console.log(`  wrote ${CODES.length} books for ${id}`);
  }

  // Generate the lazy require map.
  const lines = [];
  lines.push('// AUTO-GENERATED by scripts/build-bible-data.mjs — do not edit by hand.');
  lines.push("import type { Book, TranslationId } from '../types';");
  lines.push('');
  lines.push('export const BIBLE_DATA: Record<TranslationId, Record<string, () => Book>> = {');
  for (const { id } of TRANSLATIONS) {
    lines.push(`  ${id}: {`);
    for (const code of CODES) {
      lines.push(`    '${code}': () => require('./${id}/${code}.json') as Book,`);
    }
    lines.push('  },');
  }
  lines.push('};');
  lines.push('');
  await writeFile(join(DATA_DIR, 'index.ts'), lines.join('\n'));
  console.log('wrote src/bible/data/index.ts');
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Run the generator**

Run:
```bash
cd mobile && node scripts/build-bible-data.mjs
```
Expected: prints "wrote 66 books for BSB", "wrote 66 books for KJV", "wrote src/bible/data/index.ts".

- [ ] **Step 3: Verify output (file counts + spot-checks incl. a poetry passage)**

Run:
```bash
cd mobile
echo "BSB files: $(ls src/bible/data/BSB/*.json | wc -l)  KJV files: $(ls src/bible/data/KJV/*.json | wc -l)"
node -e "
const jhn = require('./src/bible/data/BSB/JHN.json');
const psa = require('./src/bible/data/KJV/PSA.json');
console.log('BSB John 3:16:', jhn.chapters[2][15]);
console.log('KJV Psalm 118:24:', psa.chapters[117][23]);
console.log('KJV Psalm 23:1 (poetry spot-check):', psa.chapters[22][0]);
"
```
Expected: file counts are `66` and `66`; John 3:16 begins "For God so loved the world"; Psalm 118:24 reads "This is the day..."; Psalm 23:1 reads cleanly (no stray whitespace or dropped words) — "The LORD is my shepherd; I shall not want."

- [ ] **Step 4: Commit script + generated data**

```bash
git add mobile/scripts/build-bible-data.mjs mobile/src/bible/data
git commit -m "feat(bible): add data generator and committed KJV+BSB per-book JSON"
```

---

### Task 3: Translation metadata

**Files:**
- Create: `mobile/src/bible/translations.ts`
- Test: `mobile/src/bible/__tests__/translations.test.ts`

**Interfaces:**
- Consumes: `TranslationMeta`, `TranslationId` from `./types`.
- Produces: `const TRANSLATIONS: TranslationMeta[]` (exactly `BSB` then `KJV`).

- [ ] **Step 1: Write the failing test**

Create `mobile/src/bible/__tests__/translations.test.ts`:
```ts
import { TRANSLATIONS } from '@/bible/translations';

test('exposes exactly BSB and KJV with license info', () => {
  expect(TRANSLATIONS.map((t) => t.id)).toEqual(['BSB', 'KJV']);
  for (const t of TRANSLATIONS) {
    expect(t.name.length).toBeGreaterThan(0);
    expect(t.license).toBe('Public Domain');
    expect(t.licenseUrl).toMatch(/^https?:\/\//);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mobile && npm test -- translations.test`
Expected: FAIL — cannot find module `@/bible/translations`.

- [ ] **Step 3: Create `translations.ts`**

Create `mobile/src/bible/translations.ts`:
```ts
import type { TranslationMeta } from './types';

export const TRANSLATIONS: TranslationMeta[] = [
  {
    id: 'BSB',
    name: 'Berean Standard Bible',
    license: 'Public Domain',
    licenseUrl: 'https://berean.bible/',
  },
  {
    id: 'KJV',
    name: 'King James Version',
    license: 'Public Domain',
    licenseUrl: 'https://ebible.org/Scriptures/details.php?id=eng-kjv2006',
  },
];
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd mobile && npm test -- translations.test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/bible/translations.ts mobile/src/bible/__tests__/translations.test.ts
git commit -m "feat(bible): add translation metadata (BSB, KJV)"
```

---

### Task 4: Loader core — `listTranslations`, `getBooks`, `getChapter`, `getVerse`

**Files:**
- Create: `mobile/src/bible/index.ts`
- Test: `mobile/src/bible/__tests__/loader.test.ts`

**Interfaces:**
- Consumes: `BOOKS` from `./books`; `TRANSLATIONS` from `./translations`; `BIBLE_DATA` from `./data`; types from `./types`.
- Produces (all exported from `@/bible`):
  - `listTranslations(): TranslationMeta[]`
  - `getBooks(): BookMeta[]`
  - `getChapter(translation: TranslationId, bookCode: string, chapter: number): string[]`
  - `getVerse(translation: TranslationId, bookCode: string, chapter: number, verse: number): Verse | undefined`

- [ ] **Step 1: Write the failing test**

Create `mobile/src/bible/__tests__/loader.test.ts`:
```ts
import { getBooks, getChapter, getVerse, listTranslations } from '@/bible';

test('listTranslations returns BSB and KJV', () => {
  expect(listTranslations().map((t) => t.id)).toEqual(['BSB', 'KJV']);
});

test('getBooks returns the 66-book metadata', () => {
  expect(getBooks()).toHaveLength(66);
  expect(getBooks()[0].code).toBe('GEN');
});

test('getVerse returns known verses in both translations', () => {
  expect(getVerse('BSB', 'JHN', 3, 16)?.text).toContain('For God so loved the world');
  expect(getVerse('KJV', 'JHN', 3, 16)?.text).toContain('For God so loved the world');
  expect(getVerse('BSB', 'PSA', 118, 24)?.text).toContain('This is the day');
});

test('getVerse builds a human reference from the book name', () => {
  expect(getVerse('KJV', 'JHN', 3, 16)?.reference).toBe('John 3:16');
});

test('getChapter length matches the known verse count', () => {
  // Psalm 119 has 176 verses.
  expect(getChapter('BSB', 'PSA', 119)).toHaveLength(176);
});

test('out-of-range lookups return undefined / empty array', () => {
  expect(getVerse('BSB', 'JHN', 99, 1)).toBeUndefined();
  expect(getVerse('BSB', 'JHN', 3, 999)).toBeUndefined();
  expect(getVerse('BSB', 'ZZZ', 1, 1)).toBeUndefined();
  expect(getChapter('BSB', 'JHN', 99)).toEqual([]);
  expect(getChapter('BSB', 'ZZZ', 1)).toEqual([]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mobile && npm test -- loader.test`
Expected: FAIL — cannot find module `@/bible`.

- [ ] **Step 3: Create `index.ts` (core loader)**

Create `mobile/src/bible/index.ts`:
```ts
import { BOOKS } from './books';
import { BIBLE_DATA } from './data';
import { TRANSLATIONS } from './translations';
import type { BookMeta, TranslationId, TranslationMeta, Verse } from './types';

export type { BookMeta, Reference, TranslationId, TranslationMeta, Verse } from './types';

const BOOK_BY_CODE = new Map(BOOKS.map((b) => [b.code, b]));

export function listTranslations(): TranslationMeta[] {
  return TRANSLATIONS;
}

export function getBooks(): BookMeta[] {
  return BOOKS;
}

export function getChapter(
  translation: TranslationId,
  bookCode: string,
  chapter: number,
): string[] {
  const loader = BIBLE_DATA[translation]?.[bookCode];
  if (!loader) return [];
  const book = loader();
  return book.chapters[chapter - 1] ?? [];
}

export function getVerse(
  translation: TranslationId,
  bookCode: string,
  chapter: number,
  verse: number,
): Verse | undefined {
  const meta = BOOK_BY_CODE.get(bookCode);
  if (!meta) return undefined;
  const text = getChapter(translation, bookCode, chapter)[verse - 1];
  if (text === undefined || text === '') return undefined;
  return { text, reference: `${meta.name} ${chapter}:${verse}` };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd mobile && npm test -- loader.test`
Expected: PASS (all tests).

- [ ] **Step 5: Type-check**

Run: `cd mobile && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add mobile/src/bible/index.ts mobile/src/bible/__tests__/loader.test.ts
git commit -m "feat(bible): add loader core (getVerse, getChapter, getBooks, listTranslations)"
```

---

### Task 5: Reference parsing — `resolveReference`, `getVerseByRef`

**Files:**
- Modify: `mobile/src/bible/index.ts`
- Test: `mobile/src/bible/__tests__/reference.test.ts`

**Interfaces:**
- Consumes: `matchBook` from `./books`; `getVerse` and types from this module.
- Produces (exported from `@/bible`):
  - `resolveReference(ref: string): Reference | undefined`
  - `getVerseByRef(translation: TranslationId, ref: string): Verse | undefined`

- [ ] **Step 1: Write the failing test**

Create `mobile/src/bible/__tests__/reference.test.ts`:
```ts
import { getVerseByRef, resolveReference } from '@/bible';

test('resolveReference parses common formats', () => {
  expect(resolveReference('Psalm 118:24')).toEqual({ bookCode: 'PSA', chapter: 118, verse: 24 });
  expect(resolveReference('1 John 3:16')).toEqual({ bookCode: '1JN', chapter: 3, verse: 16 });
  expect(resolveReference('Gen 1:1')).toEqual({ bookCode: 'GEN', chapter: 1, verse: 1 });
  expect(resolveReference('Song of Solomon 2:1')).toEqual({ bookCode: 'SNG', chapter: 2, verse: 1 });
});

test('resolveReference returns undefined for junk / unknown books / bad shape', () => {
  expect(resolveReference('not a reference')).toBeUndefined();
  expect(resolveReference('Nope 1:1')).toBeUndefined();
  expect(resolveReference('John 3')).toBeUndefined();
  expect(resolveReference('')).toBeUndefined();
});

test('getVerseByRef resolves and loads the verse', () => {
  const v = getVerseByRef('KJV', 'Psalm 118:24');
  expect(v?.text).toContain('This is the day');
  expect(v?.reference).toBe('Psalms 118:24');
});

test('getVerseByRef returns undefined for an unresolvable ref', () => {
  expect(getVerseByRef('BSB', 'Nope 1:1')).toBeUndefined();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mobile && npm test -- reference.test`
Expected: FAIL — `resolveReference` / `getVerseByRef` are not exported.

- [ ] **Step 3: Add reference functions to `index.ts`**

Add to the imports at the top of `mobile/src/bible/index.ts`:
```ts
import { BOOKS, matchBook } from './books';
```
(replace the existing `import { BOOKS } from './books';` line)

Append to `mobile/src/bible/index.ts`:
```ts
import type { Reference } from './types';

/** Parse a reference like "Psalm 118:24", "1 John 3:16", "Gen 1:1". */
export function resolveReference(ref: string): Reference | undefined {
  // Split into "<book part> <chapter>:<verse>" — book part may contain spaces/digits.
  const match = ref.trim().match(/^(.+?)\s+(\d+):(\d+)$/);
  if (!match) return undefined;
  const [, bookToken, chapterStr, verseStr] = match;
  const meta = matchBook(bookToken);
  if (!meta) return undefined;
  return { bookCode: meta.code, chapter: Number(chapterStr), verse: Number(verseStr) };
}

export function getVerseByRef(translation: TranslationId, ref: string): Verse | undefined {
  const resolved = resolveReference(ref);
  if (!resolved) return undefined;
  return getVerse(translation, resolved.bookCode, resolved.chapter, resolved.verse);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd mobile && npm test -- reference.test`
Expected: PASS.

- [ ] **Step 5: Run the full suite + type-check**

Run:
```bash
cd mobile && npm test && npx tsc --noEmit
```
Expected: entire suite passes, no type errors.

- [ ] **Step 6: Commit**

```bash
git add mobile/src/bible/index.ts mobile/src/bible/__tests__/reference.test.ts
git commit -m "feat(bible): add resolveReference and getVerseByRef"
```

---

## Notes for the implementer

- **`require` in `data/index.ts`:** Metro (React Native/Expo) resolves `require('./BSB/GEN.json')` with static string literals and bundles JSON natively; the thunk keeps each book lazy (parsed on first access, then cached by the module system). This is the intended mechanism — do not switch to dynamic `require` with template strings (Metro can't statically analyze those).
- **Reference display name:** `getVerse`/`getVerseByRef` format the reference from the canonical book name, so Psalms renders as "Psalms 118:24" (plural). This is expected; the input token to `resolveReference` may be singular ("Psalm") and still resolves correctly via `matchBook`.
- **Regenerating data:** re-run `node scripts/build-bible-data.mjs` from `mobile/`. It wipes and rewrites `src/bible/data/` (including `index.ts`), so any manual edits there are lost by design.
```
