import { render, screen } from '@testing-library/react-native';
import { ThemedText, Eyebrow } from '@/components';

test('ThemedText renders its text', async () => {
  await render(<ThemedText variant="title">Hello</ThemedText>);
  expect(screen.getByText('Hello')).toBeOnTheScreen();
});
test('Eyebrow uppercases via style', async () => {
  await render(<Eyebrow>begin</Eyebrow>);
  expect(screen.getByText('begin')).toBeOnTheScreen();
});
