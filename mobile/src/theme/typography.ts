export const typography = {
  families: {
    serif: "CormorantGaramond_500Medium",
    serifSemibold: "CormorantGaramond_600SemiBold",
    serifItalic: "CormorantGaramond_500Medium_Italic",
    sans: "HankenGrotesk_400Regular",
    sansMedium: "HankenGrotesk_500Medium",
    sansSemibold: "HankenGrotesk_600SemiBold",
  },
  variants: {
    display: {
      fontFamily: "CormorantGaramond_600SemiBold",
      fontSize: 64,
      lineHeight: 68,
    },
    title: {
      fontFamily: "CormorantGaramond_600SemiBold",
      fontSize: 36,
      lineHeight: 38,
    },
    quote: {
      fontFamily: "CormorantGaramond_500Medium_Italic",
      fontSize: 22,
      lineHeight: 30,
    },
    eyebrow: {
      fontFamily: "HankenGrotesk_600SemiBold",
      fontSize: 12,
      letterSpacing: 2,
      textTransform: "uppercase" as const,
    },
    body: {
      fontFamily: "HankenGrotesk_400Regular",
      fontSize: 16,
      lineHeight: 24,
    },
    caption: {
      fontFamily: "HankenGrotesk_400Regular",
      fontSize: 14,
      lineHeight: 18,
    },
    button: { fontFamily: "HankenGrotesk_600SemiBold", fontSize: 16 },
  },
} as const;
