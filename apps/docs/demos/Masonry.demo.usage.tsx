import React from 'react';
import { Masonry } from '@mantyke/masonry';
import { MantineDemo } from '@mantinex/demo';
import { renderPhotos } from './Masonry.demo.photos';

const code = `
import { Masonry } from '@mantyke/masonry';

function Demo() {
  return (
    <Masonry columns={3} gap="md">
      {photos.map((photo) => (
        <img key={photo.id} src={photo.src} width={photo.width} height={photo.height} alt="" />
      ))}
    </Masonry>
  );
}
`;

function Demo() {
  return (
    <Masonry columns={3} gap="md">
      {renderPhotos()}
    </Masonry>
  );
}

export const usage: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
};
