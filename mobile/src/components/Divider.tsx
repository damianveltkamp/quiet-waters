import { View } from 'react-native';
import { colors } from '@/theme';
export function Divider() {
  return <View style={{ width: 40, height: 1, backgroundColor: colors.soft, marginVertical: 16 }} />;
}
