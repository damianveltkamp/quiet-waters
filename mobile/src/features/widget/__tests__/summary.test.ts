import { refreshSummary } from '../summary';

test('daily summary reads friendly time', () => {
  expect(refreshSummary({ backgroundId: 'x', refresh: { mode: 'daily', time: '07:00' } }))
    .toBe('Every day · 7:00 AM');
});

test('daily summary handles afternoon', () => {
  expect(refreshSummary({ backgroundId: 'x', refresh: { mode: 'daily', time: '18:30' } }))
    .toBe('Every day · 6:30 PM');
});

test('hourly summary', () => {
  expect(refreshSummary({ backgroundId: 'x', refresh: { mode: 'hourly', time: '07:00' } }))
    .toBe('Every hour');
});
