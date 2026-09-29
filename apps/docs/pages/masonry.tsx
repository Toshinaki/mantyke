import React from 'react';
import { DocsTabs } from '../components/DocsTabs';
import { PageHeader } from '../components/PageHeader';
import { Shell } from '../components/Shell';
import { MASONRY_DATA } from '../data';
import docgen from '../docgen.json';
import Docs from '../masonry.mdx';
import { STYLES_API_DATA } from '../styles-api';

export default function MasonryPage() {
  return (
    <Shell>
      <PageHeader data={MASONRY_DATA} />
      <DocsTabs
        docgen={docgen}
        componentsProps={['Masonry']}
        componentsStyles={['Masonry']}
        stylesApiData={STYLES_API_DATA}
      >
        <Docs />
      </DocsTabs>
    </Shell>
  );
}
