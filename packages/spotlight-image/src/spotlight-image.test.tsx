import React from 'react';
import { act } from '@testing-library/react';
import { render, screen, tests } from '@mantine-tests/core';
import { SpotlightImage, SpotlightImageProps, SpotlightImageStylesNames } from './spotlight-image';

const defaultProps: SpotlightImageProps = {
  src: 'test.jpg',
  alt: 'test image',
};

describe('@mantyke/spotlight-image/SpotlightImage', () => {
  tests.itSupportsSystemProps<SpotlightImageProps, SpotlightImageStylesNames>({
    component: SpotlightImage,
    props: defaultProps,
    polymorphic: false,
    styleProps: true,
    extend: true,
    variant: false,
    size: false,
    classes: true,
    refType: HTMLImageElement,
    displayName: 'SpotlightImage',
    stylesApiSelectors: ['root'],
  });

  it('renders image with correct src and alt', () => {
    render(<SpotlightImage src="test.jpg" alt="test image" />);
    expect(screen.getByAltText('test image')).toBeInTheDocument();
    expect(screen.getByAltText('test image')).toHaveAttribute('src', 'test.jpg');
  });

  it('opens modal on click', async () => {
    render(<SpotlightImage src="test.jpg" alt="test image" />);

    await act(async () => {
      screen.getByAltText('test image').click();
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
