import React from 'react';
import Link from 'next/link';
import { Card, Container, SimpleGrid, Text, Title } from '@mantine/core';
import { PACKAGES } from '../../data';
import classes from './PackageList.module.css';

export function PackageList() {
  return (
    <Container size="lg" className={classes.root}>
      <Title className={classes.title}>Mantyke</Title>
      <Text className={classes.description}>Mantine extension components</Text>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
        {PACKAGES.map((pkg) => (
          <Card
            key={pkg.slug}
            component={Link}
            href={`/${pkg.slug}`}
            withBorder
            className={classes.card}
          >
            <Text className={classes.packageName}>{pkg.packageName}</Text>
            <Text className={classes.packageDescription}>{pkg.packageDescription}</Text>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
}
