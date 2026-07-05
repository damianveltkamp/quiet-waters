import { StyleProp, ViewStyle, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { gradients, spacing } from '@/theme';

interface Props { variant: 'light' | 'dark'; children: React.ReactNode; contentStyle?: StyleProp<ViewStyle>; }
export function Screen({ variant, children, contentStyle }: Props) {
  return (
    <LinearGradient colors={gradients[variant]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[{ flex: 1, paddingHorizontal: spacing.lg }, contentStyle]}>{children}</View>
      </SafeAreaView>
    </LinearGradient>
  );
}
