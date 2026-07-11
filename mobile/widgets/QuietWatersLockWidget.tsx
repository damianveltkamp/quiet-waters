import { Text, VStack } from '@expo/ui/swift-ui';
import { font, lineLimit } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

type Props = { verseText?: string; reference?: string };

const QuietWatersLockWidget = (props: Props, _environment: WidgetEnvironment) => {
  'widget';
  // Lock screen renders in vibrant/monochrome; no background or color is applied.
  return (
    <VStack alignment="leading" spacing={2}>
      <Text modifiers={[font({ size: 12 }), lineLimit(2)]}>
        {props.verseText ?? 'He leads me beside quiet waters.'}
      </Text>
      <Text modifiers={[font({ weight: 'semibold', size: 9 })]}>
        {(props.reference ?? 'Psalm 23:2').toUpperCase()}
      </Text>
    </VStack>
  );
};

export default createWidget('QuietWatersLockWidget', QuietWatersLockWidget);
