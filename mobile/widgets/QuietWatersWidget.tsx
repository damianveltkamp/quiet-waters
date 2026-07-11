import { Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
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
      spacing={isSmall ? 6 : 10}
      modifiers={[padding({ all: isSmall ? 12 : 16 }), containerBackground(bg, 'widget')]}
    >
      <Image systemName="cross" size={isSmall ? 12 : 16} color={muted} />
      <Spacer />
      <Text
        modifiers={[
          font({ design: 'serif', size: verseSize }),
          foregroundColor(text),
          multilineTextAlignment('center'),
          lineLimit(verseLimit),
          // Shrink the verse to fit rather than clipping it with an ellipsis —
          // random verses vary a lot in length.
          minimumScaleFactor(0.5),
          allowsTightening(true),
        ]}
      >
        {props.verseText ?? 'He leads me beside quiet waters.'}
      </Text>
      <Spacer />
      <Text modifiers={[font({ weight: 'semibold', size: isSmall ? 9 : 11 }), foregroundColor(muted)]}>
        {(props.reference ?? 'Psalm 23:2').toUpperCase()}
      </Text>
    </VStack>
  );
};

export default createWidget('QuietWatersWidget', QuietWatersWidget);
