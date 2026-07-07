import { View } from 'react-native';
import { Screen, Eyebrow, ThemedText, PlaceholderBox } from '@/components';
import { spacing } from '@/theme';

export default function You() {
  return (
    <Screen variant="light">
      <View style={{ flex: 1, paddingTop: spacing.xl, gap: spacing.sm }}>
        <Eyebrow>You</Eyebrow>
        <ThemedText variant="title">Your space</ThemedText>
        <View style={{ flex: 1, marginVertical: spacing.lg }}>
          <PlaceholderBox label="Your Space" sublabel="profile & settings to be placed here" />
        </View>
      </View>
    </Screen>
  );
}
