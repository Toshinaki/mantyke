import React from 'react';
import { Anchor, Container, Group, SimpleGrid, Text, Title } from '@mantine/core';
import { SPONSOR_METHODS, SPONSOR_METHODS_TITLE, SPONSOR_PUBLISHER } from '../../sponsor';
import { SponsorMethodCard } from './SponsorMethodCard';
import classes from './SponsorPage.module.css';

export function SponsorPage() {
  return (
    <Container size="lg" className={classes.root}>
      <Title className={classes.title}>{SPONSOR_METHODS_TITLE}</Title>
      <Text className={classes.description}>
        Mantyke is free and maintained in my spare time. If it helps you, your support keeps it up
        to date.
      </Text>

      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="lg">
        {SPONSOR_METHODS.map((method) => (
          <SponsorMethodCard key={method.id} method={method} />
        ))}
      </SimpleGrid>

      <Title order={2} className={classes.sectionTitle}>
        Author
      </Title>
      <Text className={classes.intro}>{SPONSOR_PUBLISHER.intro}</Text>
      <Group gap="lg">
        <Anchor href={SPONSOR_PUBLISHER.authorSiteUrl} target="_blank" rel="noopener noreferrer">
          {SPONSOR_PUBLISHER.authorSiteLabel}
        </Anchor>
        <Anchor href={SPONSOR_PUBLISHER.githubUrl} target="_blank" rel="noopener noreferrer">
          {SPONSOR_PUBLISHER.githubLabel}
        </Anchor>
      </Group>
    </Container>
  );
}
