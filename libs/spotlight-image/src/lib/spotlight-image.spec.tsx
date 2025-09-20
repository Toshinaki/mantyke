import { render } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { SpotlightImage } from './spotlight-image';

describe('SpotlightImage', () => {
  it('should render successfully', () => {
    const { baseElement } = render(
      <MantineProvider>
        <SpotlightImage src="test.jpg" alt="test" />
      </MantineProvider>
    );
    expect(baseElement).toBeTruthy();
  });
});
