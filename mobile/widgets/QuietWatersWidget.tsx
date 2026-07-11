import { Image, Text, VStack } from '@expo/ui/swift-ui';
import {
  allowsTightening,
  containerBackground,
  font,
  foregroundColor,
  lineLimit,
  minimumScaleFactor,
  multilineTextAlignment,
  padding,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

type Props = {
  verseText?: string;
  reference?: string;
  bgTop?: string;
  bgBottom?: string;
  textColor?: string;
  mutedColor?: string;
};

const QuietWatersWidget = (props: Props, environment: WidgetEnvironment) => {
  'widget';
  const bg = props.bgTop ?? '#5E8298';
  const text = props.textColor ?? '#FFFFFF';
  const muted = props.mutedColor ?? '#DCEAF0';
  const isSmall = environment.widgetFamily === 'systemSmall';
  const verseSize = isSmall ? 14 : 18;
  const verseLimit = isSmall ? 7 : 10;

  return (
    <VStack
      alignment="center"
      spacing={isSmall ? 8 : 12}
      modifiers={[padding({ all: isSmall ? 12 : 16 }), containerBackground(bg, 'widget')]}
    >
      <Image systemName="cross" size={isSmall ? 12 : 16} color={muted} />
      <Text
        modifiers={[
          font({ design: 'serif', size: verseSize }),
          foregroundColor(text),
          multilineTextAlignment('center'),
          lineLimit(verseLimit),
          // Fallback only: wraps at full size, shrinks solely when a long verse
          // overflows the fixed widget height. No Spacers here — Spacer +
          // minimumScaleFactor fight, collapsing short verses to tiny text.
          minimumScaleFactor(0.5),
          allowsTightening(true),
        ]}
      >
        {props.verseText ?? 'He leads me beside quiet waters.'}
      </Text>
      <Text modifiers={[font({ weight: 'semibold', size: isSmall ? 9 : 11 }), foregroundColor(muted)]}>
        {(props.reference ?? 'Psalm 23:2').toUpperCase()}
      </Text>
    </VStack>
  );
};

export default createWidget('QuietWatersWidget', QuietWatersWidget);
