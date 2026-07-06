import { StyleProp, TextStyle } from "react-native";
import { ThemedText } from "./ThemedText";
import { colors } from "@/theme";
export function Eyebrow({
  children,
  color = colors.mid,
  style,
}: {
  children: React.ReactNode;
  color?: string;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <ThemedText variant="eyebrow" color={color} style={style}>
      {children}
    </ThemedText>
  );
}
