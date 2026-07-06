import { View } from "react-native";
import { useRouter } from "expo-router";
import { Screen, ThemedText, Divider, CTAButton } from "@/components";
import { spacing, colors } from "@/theme";

export default function Reflection() {
  const router = useRouter();
  return (
    <Screen variant="light">
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          gap: spacing.md,
        }}
      >
        <ThemedText variant="title" align="center">
          Ever feel like your phone gets more attention than God?
        </ThemedText>
        <Divider />
        <ThemedText variant="body" color={colors.textMuted} align="center">
          You're not alone. Distractions are everywhere, quietly pulling you away
          from the peace you're looking for.
        </ThemedText>
      </View>
      <View style={{ paddingBottom: spacing.lg }}>
        <CTAButton
          label="Yes, I feel that"
          onPress={() => router.push("/onboarding/03-problem")}
        />
      </View>
    </Screen>
  );
}
