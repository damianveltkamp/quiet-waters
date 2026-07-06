import { View, Image } from "react-native";
import { ThemedText } from "./ThemedText";
import { colors, spacing } from "@/theme";
import { NotificationPreview } from "./NotificationPreview";

interface Props {
  verse: string;
  reference: string;
  showTodayWidget?: boolean;
  showBranding?: boolean;
}

export function LockScreenPreview({
  verse,
  reference,
  showTodayWidget,
  showBranding,
}: Props) {
  return (
    <View
      style={{
        backgroundColor: colors.primary,
        borderRadius: 28,
        padding: spacing.lg,
        alignItems: "center",
        gap: spacing.sm,
      }}
    >
      <ThemedText variant="caption" color={colors.pale} align="center">
        Saturday, July 5
      </ThemedText>
      <ThemedText
        variant="display"
        color={colors.white}
        style={{ fontSize: 56, lineHeight: 60 }}
      >
        9:41
      </ThemedText>
      <Image
        source={require("../../assets/images/symbol-white.png")}
        style={{
          width: 20,
          height: 20,
          resizeMode: "contain",
          marginVertical: spacing.sm,
        }}
      />
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "center",
        }}
      >
        <ThemedText variant="quote" color={colors.pale}>
          “
        </ThemedText>
        <ThemedText variant="quote" color={colors.white} align="center">
          {verse}
        </ThemedText>
        <ThemedText variant="quote" color={colors.pale}>
          ”
        </ThemedText>
      </View>
      <ThemedText variant="eyebrow" color={colors.soft}>
        {reference}
      </ThemedText>
      {showTodayWidget && (
        <NotificationPreview
          title="Your verse for today"
          body="Be still, and know... "
        />
      )}
      {showBranding && (
        <ThemedText
          variant="eyebrow"
          color={colors.soft}
          style={{ marginTop: spacing.md }}
        >
          Quiet Waters
        </ThemedText>
      )}
    </View>
  );
}
