import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, ThemedText, PlaceholderBox } from '@/components';
import { spacing, colors } from '@/theme';

export default function Prayer() {
  const router = useRouter();
  return (
    <Screen variant="light">
      <View style={{ flex: 1, paddingTop: spacing.md, gap: spacing.sm }}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ThemedText variant="button" color={colors.primary}>Close</ThemedText>
        </Pressable>
        <View style={{ flex: 1, marginVertical: spacing.lg }}>
          <PlaceholderBox label="Prayer" sublabel="a moment to pause and pray" />
        </View>
      </View>
    </Screen>
  );
}
