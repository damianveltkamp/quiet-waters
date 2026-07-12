import { Image, Text, VStack, ZStack, Rectangle } from '@expo/ui/swift-ui';
import {
  allowsTightening,
  containerBackground,
  font,
  foregroundColor,
  foregroundStyle,
  ignoreSafeArea,
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
  const bgTop = props.bgTop ?? '#5E8298';
  const bgBottom = props.bgBottom ?? '#3A5568';
  const text = props.textColor ?? '#FFFFFF';
  const muted = props.mutedColor ?? '#DCEAF0';
  const isSmall = environment.widgetFamily === 'systemSmall';
  const l = FAMILY_LAYOUT[isSmall ? 'small' : 'medium'];

  return (
    <ZStack alignment="center" modifiers={[containerBackground(bgBottom, 'widget')]}>
      <Rectangle
        modifiers={[
          foregroundStyle({
            type: 'linearGradient',
            colors: [bgTop, bgBottom],
            startPoint: { x: 0.5, y: 0 },
            endPoint: { x: 0.5, y: 1 },
          }),
          ignoreSafeArea(),
        ]}
      />
      <VStack alignment="center" spacing={l.spacing} modifiers={[padding({ all: l.padding })]}>
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
    </ZStack>
  );
};

export default createWidget('QuietWatersWidget', QuietWatersWidget);
