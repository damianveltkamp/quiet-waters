import { Share } from 'react-native';
import { APP_STORE_URL } from '@/lib/config';
import type { TranslationId } from '@/bible';

export function formatShareText(text: string, reference: string, translation: TranslationId): string {
  return `"${text}"\n— ${reference} (${translation})\n\nShared from Quiet Waters — ${APP_STORE_URL}`;
}

export async function shareVerse(text: string, reference: string, translation: TranslationId): Promise<void> {
  await Share.share({ message: formatShareText(text, reference, translation) });
}
