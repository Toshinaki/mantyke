import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { fixtureSrc, SPOTLIGHT_FIXTURES } from '../../../.storybook/fixtures';
import { SpotlightImage, type SpotlightImageProps } from './spotlight-image';

type FixtureName = keyof typeof SPOTLIGHT_FIXTURES;

interface PlaygroundArgs extends Omit<SpotlightImageProps, 'src' | 'alt' | 'modalProps'> {
  /** 打开的测试图片，覆盖常见尺寸与极端比例 */
  image: FixtureName;
  /** 对应 `modalProps.closeOnClickOutside` */
  closeOnClickOutside: boolean;
  thumbnailWidth: number;
  thumbnailHeight: number;
}

function Playground({
  image,
  closeOnClickOutside,
  thumbnailWidth,
  thumbnailHeight,
  ...props
}: PlaygroundArgs) {
  const fixture = SPOTLIGHT_FIXTURES[image];
  return (
    <div style={{ padding: 40 }}>
      <SpotlightImage
        {...props}
        src={fixtureSrc(fixture)}
        alt={fixture.name}
        w={thumbnailWidth}
        h={thumbnailHeight}
        modalProps={{ closeOnClickOutside }}
      />
    </div>
  );
}

const meta: Meta<PlaygroundArgs> = {
  title: 'SpotlightImage',
  component: Playground,
  argTypes: {
    image: {
      control: 'select',
      options: Object.keys(SPOTLIGHT_FIXTURES),
      description: 'Test image (size and aspect ratio)',
    },
    fit: {
      control: 'select',
      options: ['contain', 'cover', 'fill', 'scale-down', 'none'],
      table: { defaultValue: { summary: 'cover' } },
    },
    zoomSpeed: {
      control: { type: 'range', min: 1.05, max: 3, step: 0.05 },
      table: { defaultValue: { summary: '1.2' } },
    },
    maxZoom: {
      control: { type: 'range', min: 1, max: 20, step: 0.5 },
      table: { defaultValue: { summary: '5' } },
    },
    minZoom: {
      control: { type: 'range', min: 0.05, max: 1, step: 0.05 },
      table: { defaultValue: { summary: '0.25' } },
    },
    keepImageInView: {
      control: 'boolean',
      table: { defaultValue: { summary: 'false' } },
    },
    closeOnClickOutside: {
      control: 'boolean',
      description:
        '`modalProps.closeOnClickOutside`: close when the area around the image is clicked',
      table: { defaultValue: { summary: 'false' } },
    },
    radius: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    thumbnailWidth: { control: { type: 'range', min: 80, max: 600, step: 10 } },
    thumbnailHeight: { control: { type: 'range', min: 60, max: 400, step: 10 } },
  },
  args: {
    image: 'landscape',
    fit: 'cover',
    zoomSpeed: 1.2,
    maxZoom: 5,
    minZoom: 0.25,
    keepImageInView: false,
    closeOnClickOutside: false,
    radius: 'md',
    thumbnailWidth: 300,
    thumbnailHeight: 200,
  },
};

export default meta;
type Story = StoryObj<PlaygroundArgs>;

export const Usage: Story = {};

export const CustomZoom: Story = {
  args: { zoomSpeed: 1.5, maxZoom: 8, minZoom: 0.5 },
};

export const NewOptions: Story = {
  name: 'Close on click outside & keep in view',
  args: { closeOnClickOutside: true, keepImageInView: true },
};
