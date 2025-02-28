"use client";

import { Box, Burger, Container, Divider, Drawer, Group, ScrollArea, Title, Text } from '@mantine/core';
import { useColorScheme, useDisclosure } from '@mantine/hooks';
import classes from './SignedInLayout.module.css';
import Image from 'next/image';
import Link from 'next/link';
import { SignOutButton } from '@/ui/SignOutButton';
import { ROUTE_SETTINGS, ROUTE_SETTINGS_ACCOUNT, ROUTE_SETTINGS_INVITATIONS } from '@/lib/client/constants';
import { usePathname } from 'next/navigation';

export default function SignedInLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const colorScheme = useColorScheme();
  const pathname = usePathname();

  return (
    <div className={classes.wrapper}>
      <Box>
        <header className={classes.header}>
          <Group justify="space-between" h="100%">
            <Link href={ROUTE_SETTINGS}>
              <Image
                src={colorScheme === 'dark' ? "/logo_neg.png" : "/logo.jpg"}
                alt="Kaxig - Creative web solutions"
                height={41}
                width={133} />
            </Link>
            <Group h="100%" gap={0} visibleFrom="sm">
              <Link
                href={ROUTE_SETTINGS_ACCOUNT}
                className={pathname.startsWith(ROUTE_SETTINGS_ACCOUNT)
                  ? [classes.link, classes.linkActive].join(" ")
                  : classes.link
                }>
                Mitt konto
              </Link>
              <Link
                href={ROUTE_SETTINGS_INVITATIONS}
                className={pathname.startsWith(ROUTE_SETTINGS_INVITATIONS)
                  ? [classes.link, classes.linkActive].join(" ")
                  : classes.link
                }>
                Förfrågningar
              </Link>
            </Group>
            <Group visibleFrom="sm">
              <SignOutButton />
            </Group>
            <Burger opened={drawerOpened} onClick={toggleDrawer} hiddenFrom="sm" />
          </Group>
        </header>
        <Drawer
          opened={drawerOpened}
          onClose={closeDrawer}
          onClick={closeDrawer}
          size="100%"
          padding="md"
          title="Navigation"
          hiddenFrom="sm"
          zIndex={1000000}>
          <ScrollArea h="calc(100vh - 80px" mx="-md">
            <Divider my="sm" />
            <Link href={ROUTE_SETTINGS_ACCOUNT} className={classes.link}>
              Mitt konto
            </Link>
            <Link href={ROUTE_SETTINGS_INVITATIONS} className={classes.link}>
              Förfrågningar
            </Link>
            <Divider my="sm" />
            <Group justify="center" grow pb="xl" px="md">
              <SignOutButton />
            </Group>
          </ScrollArea>
        </Drawer>
      </Box>
      <main className={classes.main}>
        <Box p="md">
          {children}
        </Box>
      </main>
      <div className={classes.footer}>
        <Container className={classes.inner}>
          <Box className={classes.links} p="md">
            <Title order={5}>Kaxig AB</Title>
            <Text>Drivågatan 11, 343 34 Älmhult</Text>
            <Text>Tfn. 0476-515 99</Text>
            <Text>Epost info@kaxig.com</Text>
            <Text>Org.nr 556600-2670</Text>
          </Box>
          <Box p="md">
            <Image
              src="/logo_neg.png"
              alt="Kaxig - Creative web solutions"
              height={75}
              width={250} />
          </Box>
        </Container>
      </div>
    </div>
  );
}
