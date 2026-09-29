import type { MasonryFactory } from '@mantyke/masonry';
import type { StylesApiData } from '../components/styles-api.types';

export const MasonryStylesApi: StylesApiData<MasonryFactory> = {
  selectors: {
    root: 'Root element',
    column: 'Column (masonry and columns variants) or row (rows variant) element',
    item: 'Wrapper of each child',
  },

  vars: {
    root: {
      '--masonry-columns': 'Number of columns',
      '--masonry-gap': 'Gap between items',
    },
  },

  modifiers: [
    { modifier: 'data-variant', selector: 'root', value: 'masonry | columns | rows' },
    { modifier: 'data-variant', selector: 'item', value: 'columns | rows' },
  ],
};
