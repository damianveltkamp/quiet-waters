import { StyleProp, ViewStyle, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { gradients, spacing } from '@/theme';

interface Props {
  variant: 'light' | 'dark';
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  /**
   * Safe-area edges to inset. Defaults to all four. Tab screens should pass
   * ['top', 'left', 'right'] — the bottom tab bar already occupies the bottom
   * inset, so insetting it again leaves an empty band above the tab bar.
   */
  edges?: readonly Edge[];
}

export function Screen({
  variant,
  children,
  contentStyle,
  edges = ['top', 'right', 'bottom', 'left'],
}: Props) {
  return (
    <LinearGradient colors={gradients[variant]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={edges}>
        <View style={[{ flex: 1, paddingHorizontal: spacing.lg }, contentStyle]}>{children}</View>
      </SafeAreaView>
    </LinearGradient>
  );
}
