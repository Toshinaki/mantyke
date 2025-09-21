import React from 'react';
import { SpotlightImage } from '@mantyke/spotlight-image';
import { MantineDemo } from '@mantinex/demo';

const code = `
import { SpotlightImage } from '@mantyke/spotlight-image';

function Demo() {
  return (
    <SpotlightImage
      src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800"
      alt="Mountain landscape"
      width={300}
      height={200}
      radius="md"
    />
  );
}
`;

function Demo() {
  return (
    <SpotlightImage
      src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800"
      alt="Mountain landscape"
      width={300}
      height={200}
      radius="md"
    />
  );
}

export const usage: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
  centered: true,
};
