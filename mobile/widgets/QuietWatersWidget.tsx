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

import { FAMILY_LAYOUT } from '../src/features/widget/widgetLayout';

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
  // WidgetKit (iOS 17+) requires the background to come through
  // `.containerBackground(for: .widget)`, and expo-widgets' containerBackground
  // modifier only accepts a solid Color — a gradient container background is not
  // expressible here, and painting one as a full-bleed `ignoresSafeArea` layer
  // trips WidgetKit's "adopt containerBackground API" error. So: solid bgTop.
  const bg = props.bgTop ?? '#5E8298';
  const text = props.textColor ?? '#FFFFFF';
  const muted = props.mutedColor ?? '#DCEAF0';
  const isSmall = environment.widgetFamily === 'systemSmall';
  const l = FAMILY_LAYOUT[isSmall ? 'small' : 'medium'];

  return (
    <VStack
      alignment="center"
      spacing={l.spacing}
      modifiers={[padding({ all: l.padding }), containerBackground(bg, 'widget')]}
    >
      <Image systemName="cross" size={l.crossSize} color={muted} />
      <Text
        modifiers={[
          font({ design: 'serif', size: l.verseFontSize }),
          foregroundColor(text),
          multilineTextAlignment('center'),
          lineLimit(l.verseLineLimit),
          // Fallback only: wraps at full size, shrinks solely when a long verse
          // overflows the fixed widget height. No Spacers here — Spacer +
          // minimumScaleFactor fight, collapsing short verses to tiny text.
          minimumScaleFactor(0.5),
          allowsTightening(true),
        ]}
      >
        {props.verseText ?? 'He leads me beside quiet waters.'}
      </Text>
      <Text modifiers={[font({ weight: 'semibold', size: l.refFontSize }), foregroundColor(muted)]}>
        {(props.reference ?? 'Psalm 23:2').toUpperCase()}
      </Text>
    </VStack>
  );
};

export default createWidget('QuietWatersWidget', QuietWatersWidget);
