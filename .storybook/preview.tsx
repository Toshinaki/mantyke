import type { Preview } from '@storybook/react';

import '@mantine/core/styles.css';

import React from 'react';
import { MantineProvider } from '@mantine/core';

export const decorators = [
  (renderStory: any) => <MantineProvider>{renderStory()}</MantineProvider>,
];

const preview: Preview = {};

export default preview;
