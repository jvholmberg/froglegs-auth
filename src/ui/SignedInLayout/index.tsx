"use client";

import { ReactNode } from "react";
import { Box, Burger, Container, Divider, Drawer, Group, ScrollArea, Title, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Image from "next/image";
import Link from "next/link";
import { SignOutButton } from "@/ui/SignOutButton";
import {
  ROUTE_HOME,
  ROUTE_SETTINGS,
  ROUTE_ACCOUNT,
  ROUTE_ADMIN,
  ROUTE_INVITATIONS,
} from "@/lib/client/constants";
import { ShowForUserRoles } from "../ShowForUserRoles";
import { IUser } from "@/lib/server/db/types";
import { HeaderLink } from "../HeaderLink";

import classes from "./SignedInLayout.module.css";

interface IProps {
  children: ReactNode | ReactNode[];
  user: IUser;
}
export default function SignedInLayout({ children, user }: IProps) {
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);

  return (
    <div className={classes.wrapper}>
      <Box>
        <header className={classes.header}>
          <Group justify="space-between" h="100%">
            <Group>
              <Burger opened={drawerOpened} onClick={toggleDrawer} hiddenFrom="sm" size="sm" />
              <Link href={ROUTE_HOME}>
                <Image
                  className={classes.headerLogo}
                  src="/logo_25.png"
                  alt="Kaxig - Creative web solutions"
                  width={83}
                  height={50} />
              </Link>
            </Group>
            <Group h="100%" gap={0} visibleFrom="sm">
              <HeaderLink exact={true} href={ROUTE_HOME}>Hem</HeaderLink>
              <ShowForUserRoles user={user} roles={["super_admin"]}>
                <HeaderLink href={ROUTE_ADMIN}>Admin</HeaderLink>
              </ShowForUserRoles>
              <HeaderLink href={ROUTE_ACCOUNT}>Mitt konto</HeaderLink>
              <HeaderLink href={ROUTE_INVITATIONS}>Inbjudningar</HeaderLink>
              <HeaderLink href={ROUTE_SETTINGS}>Inställningar</HeaderLink>
            </Group>
            <Group visibleFrom="sm">
              <SignOutButton />
            </Group>
          </Group>
        </header>
        <Drawer
          opened={drawerOpened}
          onClose={closeDrawer}
          onClick={closeDrawer}
          size="100%"
          padding="md"
          title="Kaxig"
          hiddenFrom="sm"
          zIndex={1000000}>
          <ScrollArea h="calc(100vh - 80px" mx="-md">
            <HeaderLink exact={true} href={ROUTE_HOME}>Hem</HeaderLink>
            <ShowForUserRoles user={user} roles={["super_admin"]}>
              <HeaderLink href={ROUTE_ADMIN}>Admin</HeaderLink>
            </ShowForUserRoles>
            <HeaderLink href={ROUTE_ACCOUNT}>Mitt konto</HeaderLink>
            <HeaderLink href={ROUTE_INVITATIONS}>Inbjudningar</HeaderLink>
            <HeaderLink href={ROUTE_SETTINGS}>Inställningar</HeaderLink>
            <Divider my="sm" />
            <Group justify="center" grow pb="xl" px="md">
              <SignOutButton />
            </Group>
          </ScrollArea>
        </Drawer>
      </Box>
      <main className={classes.main}>
        <Box p="md" className={classes.mainInner}>
          {children}
        </Box>
      </main>
      <div className={classes.footer}>
        <Container className={classes.footerInner}>
          <Box p="md">
            <Title order={5}>Kaxig AB</Title>
            <Text>Norra torggatan 9, 343 31 Älmhult</Text>
            <Text>Tfn. 0476-515 99</Text>
            <Text>Epost info@kaxig.com</Text>
            <Text>Org.nr 556600-2670</Text>
          </Box>
          <Box p="md">
            <Image
              className={classes.footerLogo}
              src="/sigill_25.png"
              alt="Kaxig - Creative web solutions"
              width={150}
              height={150} />
          </Box>
        </Container>
      </div>
    </div>
  );
}
