import { Share } from 'react-native';
import { formatShareText, shareVerse } from '@/features/reading/shareVerse';

test('formatShareText includes verse, reference, translation and Quiet Waters attribution', () => {
  const out = formatShareText('Come unto me, all ye that labour.', 'Matthew 11:28', 'KJV');
  expect(out).toContain('"Come unto me, all ye that labour."');
  expect(out).toContain('— Matthew 11:28 (KJV)');
  expect(out).toContain('Shared from Quiet Waters');
  expect(out).toContain('https://apps.apple.com/app/quiet-waters');
});

test('shareVerse calls the OS share sheet with the formatted message', async () => {
  const spy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never);
  await shareVerse('For God so loved the world', 'John 3:16', 'BSB');
  expect(spy).toHaveBeenCalledWith({ message: formatShareText('For God so loved the world', 'John 3:16', 'BSB') });
  spy.mockRestore();
});
