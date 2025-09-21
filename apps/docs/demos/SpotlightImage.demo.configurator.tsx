import React from 'react';
import { SpotlightImage } from '@mantyke/spotlight-image';
import { MantineDemo } from '@mantinex/demo';

const code = `
import { SpotlightImage } from '@mantyke/spotlight-image';

function Demo() {
  return <SpotlightImage{{props}} />;
}
`;

function Wrapper(props: any) {
  return (
    <SpotlightImage
      src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800"
      alt="Mountain landscape"
      {...props}
    />
  );
}

export const configurator: MantineDemo = {
  type: 'configurator',
  component: Wrapper,
  code,
  centered: true,
  controls: [
    {
      type: 'select',
      prop: 'fit',
      initialValue: 'cover',
      libraryValue: 'cover',
      data: [
        { value: 'contain', label: 'contain' },
        { value: 'cover', label: 'cover' },
        { value: 'fill', label: 'fill' },
        { value: 'scale-down', label: 'scale-down' },
        { value: 'none', label: 'none' },
      ],
    },
    { type: 'number', prop: 'width', initialValue: 300, libraryValue: null, min: 200, max: 600 },
    { type: 'number', prop: 'height', initialValue: 200, libraryValue: null, min: 150, max: 400 },
    { type: 'size', prop: 'radius', initialValue: 'md', libraryValue: null },
    {
      type: 'number',
      prop: 'zoomSpeed',
      initialValue: 1.2,
      libraryValue: 1.2,
      min: 1.1,
      max: 2,
      step: 0.1,
    },
    { type: 'number', prop: 'maxZoom', initialValue: 5, libraryValue: 5, min: 2, max: 10 },
  ],
};
