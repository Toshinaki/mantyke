import { SpotlightImage } from './spotlight-image';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof SpotlightImage> = {
  component: SpotlightImage,
  title: 'SpotlightImage',
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300',
    alt: 'Test image',
    width: 200,
    height: 150,
    fit: "cover"
  },
};
