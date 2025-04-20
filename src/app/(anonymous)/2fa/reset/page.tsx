import { redirect } from "next/navigation";
import { Title, Text } from "@mantine/core";
import { getCurrentSession } from "@/lib/server/session";
import { globalGETRateLimit } from "@/lib/server/request";
import {
  ROUTE_2FA_SETUP,
  ROUTE_HOME,
  ROUTE_SIGN_IN,
  ROUTE_VERIFY_EMAIL,
} from "@/lib/client/constants";
import { ErrorMessage } from "@/ui/ErrorMessage";
import { TwoFactorResetForm } from "@/ui/TwoFactorResetForm";
import { PageTransition } from "@/ui/PageTransition";

import classes from "./page.module.css";

export default async function TwoFactorResetPage() {
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
        Återställ ditt konto
      </Title>
      <Text ta="center" mt="sm" mb="lg" fz="xs">
        Ange koden som du fick i samband med att du skapade ditt konto.
      </Text>
			<TwoFactorResetForm />
		</PageTransition>
	);
}
