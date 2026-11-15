import React from 'react';
import cx from 'clsx';
import { Anchor, Card, Image, Text } from '@mantine/core';
import type { SponsorMethod } from '../../sponsor';
import classes from './SponsorPage.module.css';

interface SponsorMethodCardProps {
  method: SponsorMethod;
}

/** 一种赞助方式：名称（有链接时可点）、二维码、一句话说明 */
export function SponsorMethodCard({ method }: SponsorMethodCardProps) {
  return (
    <Card withBorder className={classes.card}>
      {method.url ? (
        <Anchor
          href={method.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cx(classes.methodName, classes.methodLink)}
        >
          {method.name}
        </Anchor>
      ) : (
        <Text className={classes.methodName}>{method.name}</Text>
      )}
      <Image src={method.qr.src} alt={`${method.name} QR code`} className={classes.qr} />
      <Text className={classes.hint}>{method.hint}</Text>
    </Card>
  );
}
