import { render } from '@testing-library/react-native';

import Home from '@/app/home';

describe('Home', () => {
  it('renders the Quiet Waters heading', async () => {
    const { getByText } = await render(<Home />);
    expect(getByText('Quiet Waters')).toBeTruthy();
  });
});
