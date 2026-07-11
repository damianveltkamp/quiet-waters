import { Text, VStack } from '@expo/ui/swift-ui';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

type Props = { verseText?: string };

const QuietWatersWidget = (props: Props, _environment: WidgetEnvironment) => {
  'widget';
  return (
    <VStack>
      <Text>{props.verseText ?? 'Quiet Waters'}</Text>
    </VStack>
  );
};

export default createWidget('QuietWatersWidget', QuietWatersWidget);
