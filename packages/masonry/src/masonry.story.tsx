import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { fixtureSrc, MASONRY_FIXTURES, type ImageFixture } from '../../../.storybook/fixtures';
import { Masonry, MasonryProps } from './masonry';

interface PlaygroundArgs extends Omit<MasonryProps, 'children'> {
  /** 显示的图片数量，图片的宽高比各不相同 */
  itemCount: number;
}

interface PhotoProps {
  fixture: ImageFixture;
}

function Photo({ fixture }: PhotoProps) {
  return (
    <img
      src={fixtureSrc(fixture)}
      alt={fixture.name}
      width={fixture.width}
      height={fixture.height}
      style={{ display: 'block' }}
    />
  );
}

function Playground({ itemCount, ...props }: PlaygroundArgs) {
  return (
    <Masonry {...props}>
      {MASONRY_FIXTURES.slice(0, itemCount).map((fixture) => (
        <Photo key={fixture.name} fixture={fixture} />
      ))}
    </Masonry>
  );
}

const meta: Meta<PlaygroundArgs> = {
  title: 'Masonry',
  component: Playground,
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
    itemCount: {
      control: { type: 'range', min: 1, max: MASONRY_FIXTURES.length, step: 1 },
      description: 'Number of images',
    },
  },
  args: {
    variant: 'masonry',
    columns: 3,
    rows: 2,
    gap: 'md',
    itemCount: MASONRY_FIXTURES.length,
  },
  decorators: [
    (Story) => (
      <div style={{ padding: 40 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<PlaygroundArgs>;

export const MasonryVariant: Story = {
  args: { variant: 'masonry' },
};

export const ColumnsVariant: Story = {
  args: { variant: 'columns' },
};

export const RowsVariant: Story = {
  args: { variant: 'rows' },
};

export const ResponsiveColumns: Story = {
  args: {
    variant: 'masonry',
    columns: { base: 1, sm: 2, md: 3, lg: 4 },
    gap: { base: 'sm', md: 'md', lg: 'lg' },
  },
  argTypes: {
    columns: { control: false },
    gap: { control: false },
  },
};
