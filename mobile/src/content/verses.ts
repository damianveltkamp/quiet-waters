export interface Verse {
  text: string;
  reference: string;
}

export const verses: Verse[] = [
  {
    text: 'This is the day the Lord has made; let us rejoice and be glad in it.',
    reference: 'Psalm 118:24',
  },
];

// Deterministic verse per calendar day. Scales to a larger `verses` list later.
export function getVerseOfTheDay(date: Date): Verse {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86_400_000);
  return verses[dayOfYear % verses.length];
}
