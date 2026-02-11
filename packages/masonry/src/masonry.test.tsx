import React from 'react';
import { render, screen, tests } from '@mantine-tests/core';
import { Masonry, MasonryProps, MasonryStylesNames } from './masonry';

const defaultProps: MasonryProps = {
  children: [<div key="1">Item 1</div>, <div key="2">Item 2</div>, <div key="3">Item 3</div>],
};

describe('@mantyke/masonry/Masonry', () => {
  tests.itSupportsSystemProps<MasonryProps, MasonryStylesNames>({
    component: Masonry,
    props: defaultProps,
    polymorphic: false,
    styleProps: true,
    extend: true,
    variant: true,
    size: false,
    classes: true,
    refType: HTMLDivElement,
    displayName: 'Masonry',
    stylesApiSelectors: ['root', 'column', 'item'],
  });

  it('renders children in columns variant', () => {
    render(
      <Masonry variant="columns">
        <div>Item A</div>
        <div>Item B</div>
      </Masonry>
    );
    expect(screen.getByText('Item A')).toBeInTheDocument();
    expect(screen.getByText('Item B')).toBeInTheDocument();
  });

  it('renders children in rows variant', () => {
    render(
      <Masonry variant="rows">
        <div>Row 1</div>
        <div>Row 2</div>
      </Masonry>
    );
    expect(screen.getByText('Row 1')).toBeInTheDocument();
    expect(screen.getByText('Row 2')).toBeInTheDocument();
  });

  it('renders children in masonry variant', () => {
    render(
      <Masonry variant="masonry" columns={2}>
        <div>Masonry 1</div>
        <div>Masonry 2</div>
        <div>Masonry 3</div>
      </Masonry>
    );
    expect(screen.getByText('Masonry 1')).toBeInTheDocument();
    expect(screen.getByText('Masonry 2')).toBeInTheDocument();
    expect(screen.getByText('Masonry 3')).toBeInTheDocument();
  });

  it('sets data-variant attribute on root', () => {
    const { container } = render(
      <Masonry variant="columns">
        <div>Test</div>
      </Masonry>
    );
    expect(container.querySelector('[data-variant="columns"]')).toBeInTheDocument();
  });

  it('defaults to masonry variant', () => {
    const { container } = render(
      <Masonry>
        <div>Test</div>
      </Masonry>
    );
    expect(container.querySelector('[data-variant="masonry"]')).toBeInTheDocument();
  });
});
