import React from 'react';
import { DocsTabs } from '../components/DocsTabs';
import { PageHeader } from '../components/PageHeader';
import { Shell } from '../components/Shell';
import { SPOTLIGHT_IMAGE_DATA } from '../data';
import docgen from '../docgen.json';
import Docs from '../spotlight-image.mdx';
import { STYLES_API_DATA } from '../styles-api';

export default function SpotlightImagePage() {
  return (
    <Shell>
      <PageHeader data={SPOTLIGHT_IMAGE_DATA} />
      <DocsTabs
        docgen={docgen}
        componentsProps={['SpotlightImage']}
        componentsStyles={['SpotlightImage']}
        stylesApiData={STYLES_API_DATA}
      >
        <Docs />
      </DocsTabs>
    </Shell>
  );
}
