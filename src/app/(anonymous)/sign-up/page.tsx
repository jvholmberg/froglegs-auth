import Link from "next/link";
import { redirect } from "next/navigation";
import { Title, Text } from "@mantine/core";
import { getCurrentSession } from "@/lib/server/session";
import { SignUpForm } from "@/ui/SignUpForm";
import { globalGETRateLimit } from "@/lib/server/request";
import { ErrorMessage } from "@/ui/ErrorMessage";
import { PageTransition } from "@/ui/PageTransition";
import {
  ROUTE_2FA,
  ROUTE_2FA_SETUP,
  ROUTE_HOME,
  ROUTE_SIGN_IN,
  ROUTE_VERIFY_EMAIL,
} from "@/lib/client/constants";

import classes from "./page.module.css";

export default async function SignUpPage() {

  // Rate-limit client. Check that below threshold
  const belowRateLimit = await globalGETRateLimit();
	if (!belowRateLimit) {
    return (
      <ErrorMessage
        title="Ta det lugnt!"
        message="Vi har uppmärksammat misstänkt beteende från dig. Du har skickat väldigt många frågor mot servern!" />
    );
  }

  // Prevent access for ineligible user
  // Redirect to appropriate page instead
	const { session, user } = await getCurrentSession();
	if (session !== null) {
		if (!user.emailVerified) {
			return redirect(ROUTE_VERIFY_EMAIL);
		}
		if (!user.registered2FA) {
			return redirect(ROUTE_2FA_SETUP);
		}
		if (!session.twoFactorVerified) {
			return redirect(ROUTE_2FA);
		}
		return redirect(ROUTE_HOME);
	}
	return (
    <PageTransition>
      <Title order={2} className={classes.title} ta="center" mt="md" fw={100}>
        Skapa konto
      </Title>
      <Text ta="center" mt="sm" mb="lg" fz="xs">
        Har du redan ett konto?{' '}
        <Text component={Link} td="underline" fz="xs" fw={700} href={ROUTE_SIGN_IN}>
          Logga in
        </Text>
      </Text>
      <SignUpForm />
    </PageTransition>
	);
}
