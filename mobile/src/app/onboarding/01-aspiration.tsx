import { View, Image } from "react-native";
import { useRouter } from "expo-router";
import { Screen, Eyebrow, ThemedText, Divider, CTAButton } from "@/components";
import { spacing, colors } from "@/theme";
import { useVariant } from "@/hooks/useVariant";

export default function Aspiration() {
  const router = useRouter();
  const headlineVariant = useVariant("aspiration-headline");
  const headline =
    headlineVariant === "v2"
      ? "Draw nearer to God\neach day."
      : "You want to feel\ncloser to God.";
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
        <Image
          source={require("../../../assets/images/symbol-slate.png")}
          style={{ width: 44, height: 44, resizeMode: "contain" }}
        />
        <Eyebrow>A Place To Begin</Eyebrow>
        <ThemedText variant="title" align="center">
          {headline}
        </ThemedText>
        <Divider />
        <ThemedText variant="body" color={colors.textMuted} align="center">
          You're not walking this path alone. Join Christians all over the world
          drawing closer to God.
        </ThemedText>
      </View>
      <View style={{ paddingBottom: spacing.lg }}>
        <CTAButton
          label="Begin your journey"
          onPress={() => router.push("/onboarding/02-reflection")}
        />
      </View>
    </Screen>
  );
}
