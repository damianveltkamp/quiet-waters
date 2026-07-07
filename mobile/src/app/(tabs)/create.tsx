import { View } from 'react-native';
import { Screen, Eyebrow, ThemedText, PlaceholderBox } from '@/components';
import { spacing } from '@/theme';

export default function Create() {
  return (
    <Screen variant="light">
      <View style={{ flex: 1, paddingTop: spacing.xl, gap: spacing.sm }}>
        <Eyebrow>Create</Eyebrow>
        <ThemedText variant="title">Create a wallpaper</ThemedText>
        <View style={{ flex: 1, marginVertical: spacing.lg }}>
          <PlaceholderBox label="Wallpaper Creator" sublabel="feature UI to be placed here" />
        </View>
      </View>
    </Screen>
  );
}
