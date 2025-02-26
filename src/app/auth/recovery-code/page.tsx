import Link from "next/link";

import { getCurrentSession } from "@/lib/server/session";
import { getUserRecoverCode } from "@/lib/server/user";
import { redirect } from "next/navigation";
import { globalGETRateLimit } from "@/lib/server/request";
import { ROUTE_2FA, ROUTE_2FA_SETUP, ROUTE_SETTINGS, ROUTE_SIGN_IN, ROUTE_VERIFY_EMAIL } from "@/lib/client/constants";
import { Title, Text, Button } from "@mantine/core";

import classes from "./page.module.css";

export default async function RecoveryCodePage() {
  const belowRateLimit = await globalGETRateLimit();
	if (!belowRateLimit) {
		return "Too many requests";
	}
	const { session, user } = await getCurrentSession();
	if (session === null) {
		return redirect(ROUTE_SIGN_IN);
	}
	if (!user.emailVerified) {
		return redirect(ROUTE_VERIFY_EMAIL);
	}
	if (!user.registered2FA) {
		return redirect(ROUTE_2FA_SETUP);
	}
	if (!session.twoFactorVerified) {
		return redirect(ROUTE_2FA);
	}
	const recoveryCode = await getUserRecoverCode(user.id);
	return (
		<>
      <Title order={2} className={classes.title} ta="center" mt="md" mb={50}>
        Återställningskod!
      </Title>
      <Text ta="center" mt="md">Din återställningskod är:</Text>
      <Text ta="center" fw={700}>{recoveryCode}</Text>
      <Text ta="center" mt="md">
        Om du förlorar access till din autenticator så kan du återställa ditt konto med denna koden
      </Text>
      <Button
        component={Link}
        href={ROUTE_SETTINGS}
        fullWidth
        mt="xl"
        size="md"
        color="dark">
        Nästa
      </Button>
		</>
	);
}
