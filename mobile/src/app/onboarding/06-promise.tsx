import { View } from "react-native";
import { useRouter } from "expo-router";
import {
  Screen,
  Eyebrow,
  ThemedText,
  CTAButton,
  PlaceholderBox,
} from "@/components";
import { spacing, colors } from "@/theme";

export default function Promise() {
  const router = useRouter();
  return (
    <Screen variant="light">
      <View style={{ flex: 1, paddingTop: spacing.xl, gap: spacing.md }}>
        <ThemedText variant="title">
          Meet His Word on your phone every day.
        </ThemedText>
        <View style={{ alignItems: "center", marginTop: spacing.md, flex: 1 }}>
          <PlaceholderBox
            label="Image of an iphone with our background used on it."
            sublabel="screenshot to be placed here"
          />
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            marginTop: spacing.md,
            marginBottom: spacing.md,
          }}
        >
          <Eyebrow color={colors.textFaint}>Wallpapers</Eyebrow>
          <Eyebrow color={colors.textFaint}>Widgets</Eyebrow>
          <Eyebrow color={colors.textFaint}>Live Activities</Eyebrow>
        </View>
      </View>
      <View style={{ paddingBottom: spacing.lg }}>
        <CTAButton
          label="See how it works"
          onPress={() => router.push("/onboarding/07-vow")}
        />
      </View>
    </Screen>
  );
}
