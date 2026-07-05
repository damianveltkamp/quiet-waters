export type HoursBucket = '1-3' | '3-4' | '4-5' | '5-6' | '6-7' | '7+';
export const HOURS_BUCKETS: HoursBucket[] = ['1-3', '3-4', '4-5', '5-6', '6-7', '7+'];

const MIDPOINTS: Record<HoursBucket, number> = {
  '1-3': 2, '3-4': 3.5, '4-5': 4.5, '5-6': 5.5, '6-7': 6.5, '7+': 7.5,
};

export function bucketMidpoint(bucket: HoursBucket): number { return MIDPOINTS[bucket]; }
export function hoursPerYear(bucket: HoursBucket): number { return Math.floor(bucketMidpoint(bucket) * 365); }
export function fullDays(bucket: HoursBucket): number { return Math.round(hoursPerYear(bucket) / 24); }
export function vowHours(bucket: HoursBucket): number { return Math.round(hoursPerYear(bucket) / 10); }
export function formatNumber(n: number): string { return n.toLocaleString('en-US'); }
