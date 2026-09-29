import React from 'react';

/** 示例用照片，宽高已知，便于演示三种变体的比例计算 */
export const PHOTOS = [
  { id: '1506905925346-21bda4d32df4', width: 800, height: 533 },
  { id: '1447752875215-b2761acb3c5d', width: 800, height: 1200 },
  { id: '1470071459604-3b5ec3a7fe05', width: 800, height: 533 },
  { id: '1433086966358-54859d0ed716', width: 800, height: 1067 },
  { id: '1501785888041-af3ef285b470', width: 800, height: 450 },
  { id: '1500534314209-a25ddb2bd429', width: 800, height: 1200 },
  { id: '1472214103451-9374bd1c798e', width: 800, height: 533 },
  { id: '1469474968028-56623f02e42e', width: 800, height: 533 },
  { id: '1426604966848-d7adac402bff', width: 800, height: 533 },
];

export function photoSrc(id: string) {
  return `https://images.unsplash.com/photo-${id}?w=800`;
}

/** 返回图片元素数组，每张图片都要作为 Masonry 的直接子元素，不能包在一个组件里 */
export function renderPhotos() {
  return PHOTOS.map((photo) => (
    <img
      key={photo.id}
      src={photoSrc(photo.id)}
      alt=""
      width={photo.width}
      height={photo.height}
      style={{ display: 'block' }}
    />
  ));
}
