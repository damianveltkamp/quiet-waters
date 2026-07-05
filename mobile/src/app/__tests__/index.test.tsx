import { render } from '@testing-library/react-native';

import Index from '@/app/index';

describe('Index', () => {
  it('renders the Quiet Waters heading', async () => {
    const { getByText } = await render(<Index />);
    expect(getByText('Quiet Waters')).toBeTruthy();
  });
});
