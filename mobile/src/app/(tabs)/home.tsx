import { View, ScrollView, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Eyebrow, ThemedText, VerseCard, WallpaperPromoCard, ActionRow } from '@/components';
import { spacing } from '@/theme';
import { getVerseOfTheDay } from '@/content/verses';
import { formatHeaderDate, greeting } from '@/lib/datetime';

export default function Home() {
  const router = useRouter();
  const now = new Date();
  const verse = getVerseOfTheDay(now);

  const handleShare = () => {
    Share.share({ message: `“${verse.text}” — ${verse.reference}` });
  };

  return (
    <Screen variant="light">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: spacing.lg, gap: spacing.lg }}
      >
        <View style={{ gap: spacing.xs }}>
          <Eyebrow>{formatHeaderDate(now)}</Eyebrow>
          <ThemedText variant="title">{greeting(now)}</ThemedText>
        </View>

        <View style={{ gap: spacing.sm }}>
          <Eyebrow>Verse of the day</Eyebrow>
          <VerseCard verse={verse.text} reference={verse.reference} onShare={handleShare} />
        </View>

        <View style={{ gap: spacing.sm }}>
          <Eyebrow>Make it yours</Eyebrow>
          <WallpaperPromoCard onPress={() => router.push('/create')} />
          <ActionRow icon="widget" title="Verse widget" subtitle="Add a daily verse to your Home & Lock Screen" onPress={() => router.push('/widget-config')} />
          <ActionRow icon="cross" title="Prayer" subtitle="A moment to pause and pray" onPress={() => router.push('/prayer')} />
        </View>
      </ScrollView>
    </Screen>
  );
}
