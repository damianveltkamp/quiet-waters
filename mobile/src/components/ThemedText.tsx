import { Text, TextProps, StyleProp, TextStyle } from 'react-native';
import { typography, colors } from '@/theme';

type Variant = keyof typeof typography.variants;
interface Props extends TextProps {
  variant: Variant;
  color?: string;
  align?: 'left' | 'center' | 'right';
  style?: StyleProp<TextStyle>;
}
export function ThemedText({ variant, color = colors.primary, align = 'left', style, ...rest }: Props) {
  return <Text style={[typography.variants[variant], { color, textAlign: align }, style]} {...rest} />;
}
