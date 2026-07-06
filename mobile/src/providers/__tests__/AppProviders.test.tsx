import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { AppProviders } from '@/providers/AppProviders';

test('renders children inside the providers', async () => {
  await render(
    <AppProviders>
      <Text>hello</Text>
    </AppProviders>,
  );
  expect(screen.getByText('hello')).toBeTruthy();
});
