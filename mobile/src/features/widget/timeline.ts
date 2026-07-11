import { pickRandomVerse } from '@/features/wallpaper/randomVerse';
import { BACKGROUNDS, DEFAULT_BACKGROUND, type WallpaperBackground } from '@/features/wallpaper/backgrounds';
import type { Verse } from '@/bible';
import type { WidgetConfig } from './config';

export const DAILY_BUFFER = 30;
export const HOURLY_BUFFER = 168;

export interface WidgetEntryProps {
  verseText: string;
  reference: string;
  bgTop: string;
  bgBottom: string;
  textColor: string;
  mutedColor: string;
}

export interface TimelineEntry {
  date: Date;
  props: WidgetEntryProps;
}

export interface TimelineDeps {
  pickVerse?: (slotDate: Date) => Verse;
  getBackground?: (id: string) => WallpaperBackground;
}

function backgroundById(id: string): WallpaperBackground {
  return BACKGROUNDS.find((b) => b.id === id) ?? DEFAULT_BACKGROUND;
}

function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The canonical scheduled slot (daily time or top-of-hour) that `now` currently falls within. */
function currentSlotDate(config: WidgetConfig, now: Date): Date {
  if (config.refresh.mode === 'hourly') {
    const d = new Date(now);
    d.setMinutes(0, 0, 0);
    return d;
  }
  const [h, m] = config.refresh.time.split(':').map(Number);
  const d = new Date(now);
  d.setHours(h, m, 0, 0);
  if (d.getTime() > now.getTime()) d.setDate(d.getDate() - 1); // today's slot hasn't started → current slot is the previous day
  return d;
}

/** The scheduled boundary Dates (daily time or top-of-hour) after the immediate entry. */
function boundaryDates(config: WidgetConfig, now: Date): Date[] {
  if (config.refresh.mode === 'hourly') {
    const first = new Date(now);
    first.setMinutes(0, 0, 0);
    first.setHours(first.getHours() + 1); // next top-of-hour strictly after now
    const dates: Date[] = [];
    for (let i = 0; i < HOURLY_BUFFER - 1; i++) {
      const d = new Date(first);
      d.setHours(first.getHours() + i);
      dates.push(d);
    }
    return dates;
  }
  // daily
  const [h, m] = config.refresh.time.split(':').map(Number);
  const first = new Date(now);
  first.setHours(h, m, 0, 0);
  if (first.getTime() <= now.getTime()) first.setDate(first.getDate() + 1);
  const dates: Date[] = [];
  for (let i = 0; i < DAILY_BUFFER - 1; i++) {
    const d = new Date(first);
    d.setDate(first.getDate() + i);
    dates.push(d);
  }
  return dates;
}

export function buildTimeline(config: WidgetConfig, now: Date, deps: TimelineDeps = {}): TimelineEntry[] {
  const pickVerse = deps.pickVerse ?? ((slotDate: Date) => pickRandomVerse('KJV', seededRandom(slotDate.getTime())));
  const getBackground = deps.getBackground ?? backgroundById;
  const bg = getBackground(config.backgroundId);

  const toEntry = (displayDate: Date, slotDate: Date): TimelineEntry => {
    const v = pickVerse(slotDate);
    return {
      date: displayDate,
      props: {
        verseText: v.text,
        reference: v.reference,
        bgTop: bg.colors[0],
        bgBottom: bg.colors[1],
        textColor: bg.textColor,
        mutedColor: bg.mutedColor,
      },
    };
  };

  return [
    toEntry(new Date(now), currentSlotDate(config, now)),
    ...boundaryDates(config, now).map((d) => toEntry(d, d)),
  ];
}
