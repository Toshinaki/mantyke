import React from 'react';
import { act, fireEvent, within } from '@testing-library/react';
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

  it('names the dialog after the image alt', async () => {
    render(<SpotlightImage src="test.jpg" alt="test image" />);

    await act(async () => {
      screen.getByAltText('test image').click();
    });

    expect(screen.getByRole('dialog')).toHaveAccessibleName('test image');
  });

  it('shows a loading indicator until the image has loaded', async () => {
    render(<SpotlightImage src="test.jpg" alt="test image" />);

    await act(async () => {
      screen.getByAltText('test image').click();
    });
    expect(screen.getByRole('status', { name: 'Loading image' })).toBeInTheDocument();

    const viewerImage = within(screen.getByRole('dialog')).getByRole('img');
    fireEvent.load(viewerImage);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('stops the loading indicator when the image fails to load', async () => {
    render(<SpotlightImage src="missing.jpg" alt="test image" />);

    await act(async () => {
      screen.getByAltText('test image').click();
    });

    fireEvent.error(within(screen.getByRole('dialog')).getByRole('img'));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows fallbackSrc in the viewer when the image fails to load', async () => {
    render(<SpotlightImage src="missing.jpg" alt="test image" fallbackSrc="fallback.jpg" />);

    await act(async () => {
      screen.getByAltText('test image').click();
    });

    const dialog = screen.getByRole('dialog');
    fireEvent.error(within(dialog).getByRole('img'));
    expect(within(dialog).getByRole('img')).toHaveAttribute('src', 'fallback.jpg');
    // 备用图片还在加载，加载指示保留到它加载完成
    expect(screen.getByRole('status')).toBeInTheDocument();

    fireEvent.load(within(dialog).getByRole('img'));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('replaces only the labels that are passed', async () => {
    render(<SpotlightImage src="test.jpg" alt="test image" labels={{ close: '关闭' }} />);

    await act(async () => {
      screen.getByAltText('test image').click();
    });

    expect(screen.getByRole('button', { name: '关闭' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument();
  });
});
