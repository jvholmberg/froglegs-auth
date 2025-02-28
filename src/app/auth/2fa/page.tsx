import Link from "next/link";

import { getCurrentSession } from "@/lib/server/session";
import { redirect } from "next/navigation";
import { globalGETRateLimit } from "@/lib/server/request";
import { TwoFactorVerificationForm } from "@/ui/TwoFactorVerificationForm";
import { ROUTE_2FA_RESET, ROUTE_2FA_SETUP, ROUTE_SETTINGS, ROUTE_SIGN_IN, ROUTE_VERIFY_EMAIL } from "@/lib/client/constants";
import { Title, Text, Center } from "@mantine/core";

import classes from "./page.module.css";
import { SignOutLink } from "@/ui/SignOutLink";

export default async function TwoFactorPage() {
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
	if (session.twoFactorVerified) {
		return redirect(ROUTE_SETTINGS);
	}
	return (
    <>
      <Title order={2} className={classes.title} ta="center" mt="md" mb={50} fw={100}>
        2-faktors autentisering
      </Title>

      <Text ta="center" mt="md">
        Ange koden från din autenticator app.
      </Text>
      <TwoFactorVerificationForm />
      <Center mt="md">
        <Text component={Link} td="underline" href={ROUTE_2FA_RESET}>
          Ange din återställningskod
        </Text>
      </Center>
      <Center mt="md">
        <SignOutLink>
          Tillbaka
        </SignOutLink>
      </Center>
    </>
	);
}
