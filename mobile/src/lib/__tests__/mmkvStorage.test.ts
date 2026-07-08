import { mmkvStorage } from '@/lib/mmkvStorage';

test('setItem then getItem round-trips a value', () => {
  mmkvStorage.setItem('k', 'v');
  expect(mmkvStorage.getItem('k')).toBe('v');
});

test('getItem returns null for a missing key', () => {
  expect(mmkvStorage.getItem('missing')).toBeNull();
});

test('removeItem deletes the value', () => {
  mmkvStorage.setItem('k2', 'v2');
  mmkvStorage.removeItem('k2');
  expect(mmkvStorage.getItem('k2')).toBeNull();
});
