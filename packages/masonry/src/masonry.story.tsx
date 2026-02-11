import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Masonry, MasonryProps } from './masonry';

const photos = [
  { src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', w: 800, h: 533 },
  { src: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800', w: 800, h: 533 },
  { src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800', w: 800, h: 533 },
  { src: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800', w: 800, h: 1200 },
  { src: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800', w: 800, h: 1067 },
  { src: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800', w: 800, h: 450 },
  { src: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800', w: 800, h: 533 },
  { src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800', w: 800, h: 533 },
  { src: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800', w: 800, h: 1200 },
  { src: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800', w: 800, h: 533 },
];

function Photo({ src, w, h }: { src: string; w: number; h: number }) {
  return <img src={src} alt="" width={w} height={h} style={{ display: 'block' }} />;
}

const meta: Meta<MasonryProps> = {
  title: 'Masonry',
  component: Masonry,
  argTypes: {
    variant: {
      control: 'select',
      options: ['masonry', 'columns', 'rows'],
      description: 'Layout variant',
      table: { defaultValue: { summary: 'masonry' } },
    },
    columns: {
      control: { type: 'range', min: 1, max: 8, step: 1 },
      description: 'Number of columns (masonry & columns variants)',
      table: { defaultValue: { summary: '3' } },
      if: { arg: 'variant', neq: 'rows' },
    },
    rows: {
      control: { type: 'range', min: 1, max: 8, step: 1 },
      description: 'Number of rows (rows variant only)',
      table: { defaultValue: { summary: '2' } },
      if: { arg: 'variant', eq: 'rows' },
    },
    gap: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl', 0],
      description: 'Gap between items',
      table: { defaultValue: { summary: 'md' } },
    },
  },
  args: {
    variant: 'masonry',
    columns: 3,
    rows: 2,
    gap: 'md',
  },
  decorators: [(Story) => <div style={{ padding: 40 }}><Story /></div>],
};

export default meta;
type Story = StoryObj<MasonryProps>;

export const Playground: Story = {
  render: (args) => (
    <Masonry {...args}>
      {photos.map((photo, i) => (
        <Photo key={i} {...photo} />
      ))}
    </Masonry>
  ),
};

export const ColumnsVariant: Story = {
  args: { variant: 'columns', columns: 3, gap: 'md' },
  render: (args) => (
    <Masonry {...args}>
      {photos.map((photo, i) => (
        <Photo key={i} {...photo} />
      ))}
    </Masonry>
  ),
};

export const RowsVariant: Story = {
  args: { variant: 'rows', rows: 2, gap: 'md' },
  render: (args) => (
    <Masonry {...args}>
      {photos.map((photo, i) => (
        <Photo key={i} {...photo} />
      ))}
    </Masonry>
  ),
};

export const MasonryVariant: Story = {
  args: { variant: 'masonry', columns: 3, gap: 'md' },
  render: (args) => (
    <Masonry {...args}>
      {photos.map((photo, i) => (
        <Photo key={i} {...photo} />
      ))}
    </Masonry>
  ),
};

export const ResponsiveColumns: Story = {
  args: {
    variant: 'masonry',
    columns: { base: 1, sm: 2, md: 3, lg: 4 } as any,
    gap: { base: 'sm', md: 'md', lg: 'lg' } as any,
  },
  argTypes: {
    columns: { control: false },
    gap: { control: false },
  },
  render: (args) => (
    <Masonry {...args}>
      {photos.map((photo, i) => (
        <Photo key={i} {...photo} />
      ))}
    </Masonry>
  ),
};
