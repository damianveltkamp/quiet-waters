import { View } from 'react-native';
import { Screen, ThemedText } from '@/components';

export default function Home() {
  return (
    <Screen variant="light">
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ThemedText variant="title">Quiet Waters</ThemedText>
        <ThemedText variant="body">Home — coming soon</ThemedText>
      </View>
    </Screen>
  );
}
