import { render } from '@testing-library/react';

import MantykeSpotlightImage from './spotlight-image';

describe('MantykeSpotlightImage', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<MantykeSpotlightImage />);
    expect(baseElement).toBeTruthy();
  });
});
