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
