import { buildTimeline, DAILY_BUFFER, HOURLY_BUFFER } from '../timeline';
import type { WidgetConfig } from '../config';

const verse = { text: 'Peace I leave with you.', reference: 'John 14:27' };
const deps = { pickVerse: () => verse };

const daily: WidgetConfig = { backgroundId: 'still-water', refresh: { mode: 'daily', time: '07:00' } };
const hourly: WidgetConfig = { backgroundId: 'still-water', refresh: { mode: 'hourly', time: '07:00' } };

test('daily produces DAILY_BUFFER entries', () => {
  const now = new Date('2026-07-11T09:00:00');
  expect(buildTimeline(daily, now, deps)).toHaveLength(DAILY_BUFFER);
});

test('daily first entry is now, second is next 07:00', () => {
  const now = new Date('2026-07-11T09:00:00'); // already past 07:00 today
  const entries = buildTimeline(daily, now, deps);
  expect(entries[0].date.getTime()).toBe(now.getTime());
  const second = entries[1].date;
  expect(second.getHours()).toBe(7);
  expect(second.getMinutes()).toBe(0);
  expect(second.getDate()).toBe(12); // tomorrow
});

test('daily uses today 07:00 when now is before the time', () => {
  const now = new Date('2026-07-11T06:00:00');
  const entries = buildTimeline(daily, now, deps);
  expect(entries[1].date.getDate()).toBe(11); // today at 07:00
});

test('hourly produces HOURLY_BUFFER entries, second on the next hour', () => {
  const now = new Date('2026-07-11T09:30:00');
  const entries = buildTimeline(hourly, now, deps);
  expect(entries).toHaveLength(HOURLY_BUFFER);
  expect(entries[1].date.getHours()).toBe(10);
  expect(entries[1].date.getMinutes()).toBe(0);
});

test('props carry verse text, reference, and background colors', () => {
  const now = new Date('2026-07-11T09:00:00');
  const p = buildTimeline(daily, now, deps)[0].props;
  expect(p.verseText).toBe(verse.text);
  expect(p.reference).toBe(verse.reference);
  // still-water colors from backgrounds.ts
  expect(p.bgTop).toBe('#5E8298');
  expect(p.bgBottom).toBe('#3A5568');
  expect(p.textColor).toBe('#FFFFFF');
});
