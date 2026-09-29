import React from 'react';
import { Masonry, type MasonryProps } from '@mantyke/masonry';
import { MantineDemo } from '@mantinex/demo';
import { renderPhotos } from './Masonry.demo.photos';

const code = `
import { Masonry } from '@mantyke/masonry';

function Demo() {
  return <Masonry{{props}}>{/* items */}</Masonry>;
}
`;

function Wrapper(props: Omit<MasonryProps, 'children'>) {
  return <Masonry {...props}>{renderPhotos()}</Masonry>;
}

export const configurator: MantineDemo = {
  type: 'configurator',
  component: Wrapper,
  code,
  controls: [
    {
      type: 'select',
      prop: 'variant',
      initialValue: 'masonry',
      libraryValue: 'masonry',
      data: [
        { value: 'masonry', label: 'masonry' },
        { value: 'columns', label: 'columns' },
        { value: 'rows', label: 'rows' },
      ],
    },
    { type: 'number', prop: 'columns', initialValue: 3, libraryValue: 3, min: 1, max: 6 },
    { type: 'number', prop: 'rows', initialValue: 2, libraryValue: 2, min: 1, max: 6 },
    { type: 'size', prop: 'gap', initialValue: 'md', libraryValue: 'md' },
  ],
};
