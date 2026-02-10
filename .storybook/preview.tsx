import type { Preview } from '@storybook/react';

import '@mantine/core/styles.css';

import { MantineProvider } from '@mantine/core';

const preview: Preview = {
  decorators: [(renderStory) => <MantineProvider>{renderStory()}</MantineProvider>],
};

export default preview;
