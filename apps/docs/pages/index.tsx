import React from 'react';
import { PackageList } from '../components/PackageList';
import { Shell } from '../components/Shell';

export default function HomePage() {
  return (
    <Shell>
      <PackageList />
    </Shell>
  );
}
