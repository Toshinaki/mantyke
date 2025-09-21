import React from 'react';
import { SpotlightImage } from './spotlight-image';

export default { title: 'SpotlightImage' };

export function Usage() {
  return (
    <div style={{ padding: 40 }}>
      <SpotlightImage
        src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800"
        alt="Mountain landscape"
        width={300}
        height={200}
        radius="md"
      />
    </div>
  );
}

export function CustomZoom() {
  return (
    <div style={{ padding: 40 }}>
      <SpotlightImage
        src="https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800"
        alt="Ocean waves"
        width={400}
        height={250}
        zoomSpeed={1.5}
        maxZoom={8}
        minZoom={0.5}
      />
    </div>
  );
}
