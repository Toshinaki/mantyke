import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import cx from 'clsx';
import { AppShell, Container, Group, RemoveScroll, useMantineColorScheme } from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';
import { ColorSchemeControl, HeaderControls } from '@mantinex/mantine-header';
import { PACKAGES, REPOSITORY_URL } from '../../data';
import classes from './Shell.module.css';

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const { toggleColorScheme } = useMantineColorScheme();
  const router = useRouter();
  useHotkeys([['mod + J', toggleColorScheme]]);

  return (
    <AppShell header={{ height: 60 }}>
      <AppShell.Header className={cx(RemoveScroll.classNames.zeroRight, classes.header)}>
        <Container size="lg" px="md" className={classes.inner}>
          <Group gap="lg">
            <Link href="/" className={cx('mantine-focus-auto', classes.brand)}>
              Mantyke
            </Link>
            {PACKAGES.map((pkg) => (
              <Link
                key={pkg.slug}
                href={`/${pkg.slug}`}
                data-active={router.pathname === `/${pkg.slug}` || undefined}
                className={cx('mantine-focus-auto', classes.link)}
              >
                {pkg.slug}
              </Link>
            ))}
          </Group>

          <HeaderControls
            visibleFrom="sm"
            githubLink={REPOSITORY_URL}
            withDirectionToggle={false}
            withSearch={false}
            withSupport={false}
            withDiscord={false}
            // discordLink 是 HeaderControls 的必填项，隐藏 Discord 按钮后不会用到
            discordLink=""
          />

          <Group hiddenFrom="sm">
            <ColorSchemeControl />
          </Group>
        </Container>
      </AppShell.Header>
      <AppShell.Main>
        <div className={classes.main}>{children}</div>
      </AppShell.Main>
    </AppShell>
  );
}
