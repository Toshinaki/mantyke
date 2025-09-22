import type { SpotlightImageFactory } from '@mantyke/spotlight-image';
import type { StylesApiData } from '../components/styles-api.types';

export const SpotlightImageStylesApi: StylesApiData<SpotlightImageFactory> = {
  selectors: {
    root: 'Root element',
  },

  vars: {
    root: {},
  },

  modifiers: [{ modifier: 'data-centered', selector: 'root', condition: '`centered` prop is set' }],
};
