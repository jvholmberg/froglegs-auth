import { redirect } from "next/navigation";
import { Title, Text } from "@mantine/core";
import { validatePasswordResetSessionRequest } from "@/lib/server/password-reset";
import { globalGETRateLimit } from "@/lib/server/request";
import { PasswordResetEmailVerificationForm } from "@/ui/PasswordResetEmailVerificationForm";
import { ErrorMessage } from "@/ui/ErrorMessage";
import { PageTransition } from "@/ui/PageTransition";
import { ROUTE_FORGOT_PASSWORD, ROUTE_RESET_PASSWORD, ROUTE_RESET_PASSWORD_2FA } from "@/lib/client/constants";

import classes from "./page.module.css";

export default async function ResetPasswordVerifyEmailPage() {
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
	const { session } = await validatePasswordResetSessionRequest();
	if (session === null) {
		return redirect(ROUTE_FORGOT_PASSWORD);
	}
	if (session.emailVerified) {
		if (!session.twoFactorVerified) {
			return redirect(ROUTE_RESET_PASSWORD_2FA);
		}
		return redirect(ROUTE_RESET_PASSWORD);
	}
	return (
		<PageTransition>
      <Title order={2} className={classes.title} ta="center" mt="md" fw={100}>
      Verifiera din E-post
      </Title>
      <Text ta="center" mt="sm" mb="lg" fz="xs">
        Vi har skickat en 8-siffrig kod till <b>{session.email}</b>.
      </Text>
			<PasswordResetEmailVerificationForm />
		</PageTransition>
	);
}
