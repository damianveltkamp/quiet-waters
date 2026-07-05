import { ThemedText } from './ThemedText';
import { colors } from '@/theme';
export function Eyebrow({ children, color = colors.mid }: { children: React.ReactNode; color?: string }) {
  return <ThemedText variant="eyebrow" color={color}>{children}</ThemedText>;
}
