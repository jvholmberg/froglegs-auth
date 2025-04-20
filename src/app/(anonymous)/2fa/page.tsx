import Link from "next/link";
import { redirect } from "next/navigation";
import { Title, Text, Center } from "@mantine/core";
import { getCurrentSession } from "@/lib/server/session";
import { globalGETRateLimit } from "@/lib/server/request";
import { TwoFactorVerificationForm } from "@/ui/TwoFactorVerificationForm";
import {
  ROUTE_2FA_RESET,
  ROUTE_2FA_SETUP,
  ROUTE_HOME,
  ROUTE_SIGN_IN,
  ROUTE_VERIFY_EMAIL,
} from "@/lib/client/constants";
import { SignOutLink } from "@/ui/SignOutLink";
import { ErrorMessage } from "@/ui/ErrorMessage";
import { PageTransition } from "@/ui/PageTransition";

import classes from "./page.module.css";

export default async function TwoFactorPage() {
  const belowRateLimit = await globalGETRateLimit();
	if (!belowRateLimit) {
		return (
      <ErrorMessage
        title="Ta det lugnt!"
        message="Vi har uppmärksammat misstänkt beteende från dig. Du har skickat väldigt många frågor mot servern!" />
    );
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
		return redirect(ROUTE_HOME);
	}
	return (
    <PageTransition>
      <Title order={2} className={classes.title} ta="center" mt="md" fw={100}>
        2-faktors autentisering
      </Title>
      <Text ta="center" mt="sm" mb="lg" fz="xs">
        Ange koden från din autenticator app.
      </Text>
      <TwoFactorVerificationForm />
      <Center mt="md">
        <Text component={Link} td="underline" fw={700} href={ROUTE_2FA_RESET}>
          Ange din återställningskod
        </Text>
      </Center>
      <Center mt="md">
        <SignOutLink>
          Tillbaka
        </SignOutLink>
      </Center>
    </PageTransition>
	);
}
