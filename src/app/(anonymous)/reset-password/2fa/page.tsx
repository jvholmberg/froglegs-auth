import { redirect } from "next/navigation";
import Link from "next/link";
import { Title, Text, Center } from "@mantine/core";
import { ROUTE_FORGOT_PASSWORD, ROUTE_RESET_PASSWORD, ROUTE_RESET_PASSWORD_VERIFY_EMAIL, ROUTE_SIGN_IN } from "@/lib/client/constants";
import { validatePasswordResetSessionRequest } from "@/lib/server/password-reset";
import { globalGETRateLimit } from "@/lib/server/request";
import { PasswordResetRecoveryCodeForm } from "@/ui/PasswordResetRecoveryCodeForm";
import { PasswordResetTOTPForm } from "@/ui/PasswordResetTotpForm";
import { ErrorMessage } from "@/ui/ErrorMessage";
import { PageTransition } from "@/ui/PageTransition";

import classes from "./page.module.css";

export default async function ResetPasswordTwoFactorPage() {

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
	const { session, user } = await validatePasswordResetSessionRequest();
	if (session === null) {
		return redirect(ROUTE_FORGOT_PASSWORD);
	}
	if (!session.emailVerified) {
		return redirect(ROUTE_RESET_PASSWORD_VERIFY_EMAIL);
	}
	if (!user.registered2FA) {
		return redirect(ROUTE_RESET_PASSWORD);
	}
	if (session.twoFactorVerified) {
		return redirect(ROUTE_RESET_PASSWORD);
	}
	return (
		<PageTransition>
      <Title order={2} className={classes.title} ta="center" mt="md" fw={100}>
      2-faktors autentisering
      </Title>
      <Text ta="center" mt="sm" mb="lg" fz="xs">
        Ange koden från din authenticator app.
      </Text>
			<PasswordResetTOTPForm />
      <Text ta="center" mt="xl" mb="xl" fz="xs">
        Använd din återställningskod istället.
      </Text>
      <PasswordResetRecoveryCodeForm />
      <Center mt="md">
        <Text component={Link} td="underline" fw={700} href={ROUTE_SIGN_IN}>
          Tillbaka
        </Text>
      </Center>
		</PageTransition>
	);
}
