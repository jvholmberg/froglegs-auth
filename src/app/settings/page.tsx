
import Link from "next/link";
import { Button, Title } from "@mantine/core";
import { globalGETRateLimit } from "@/lib/server/request";
import { getCurrentSession } from "@/lib/server/session";
import { PageTransition } from "@/ui/PageTransition";
import { Remove2FAButton } from "@/ui/Remove2FAButton";
import {
  ROUTE_2FA_SETUP,
  ROUTE_HOME,
  ROUTE_SETTINGS_UPDATE_EMAIL,
  ROUTE_SETTINGS_UPDATE_PASSWORD,
} from "@/lib/client/constants";

import classes from "./page.module.css";

export default async function SettingsPage() {
  const belowRateLimit = await globalGETRateLimit();
  if (!belowRateLimit) {
    return "För många anrop";
  }
  const { user, session } = await getCurrentSession();
  return (
    <PageTransition>
      <Title order={2} className={classes.title} ta="center" mt="md" fw={100}>
        Mitt konto
      </Title>
      <Button
        mt="xl"
        w="100%"
        component={Link}
        href={ROUTE_SETTINGS_UPDATE_EMAIL}
        fw={500}
        color="dark"
        variant="filled">
        Byt e-post
      </Button>
      <Button
        mt="md"
        w="100%"
        component={Link}
        href={ROUTE_SETTINGS_UPDATE_PASSWORD}
        fw={500}
        color="dark"
        variant="filled">
        Byt lösenord
      </Button>
      {!user?.registered2FA && (
        <Button
          mt="md"
          w="100%"
          component={Link}
          href={ROUTE_2FA_SETUP}
          fw={500}
          color="dark"
          variant="filled">
          Sätt upp 2-faktors autentisering
        </Button>
      )}
      <Remove2FAButton user={user} session={session} />
      <Button
        mt="md"
        w="100%"
        component={Link}
        href={ROUTE_HOME}
        fw={500}
        color="dark"
        variant="outline">
        Tillbaka
      </Button>
    </PageTransition>
  );
}
