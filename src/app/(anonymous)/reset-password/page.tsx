
import { Title, Text } from "@mantine/core";
import { redirect } from "next/navigation";
import { validatePasswordResetSessionRequest } from "@/lib/server/password-reset";
import { globalGETRateLimit } from "@/lib/server/request";
import { PasswordResetForm } from "@/ui/ResetPasswordForm";
import { ROUTE_FORGOT_PASSWORD, ROUTE_RESET_PASSWORD_2FA, ROUTE_RESET_PASSWORD_VERIFY_EMAIL } from "@/lib/client/constants";
import { ErrorMessage } from "@/ui/ErrorMessage";
import { PageTransition } from "@/ui/PageTransition";

import classes from "./page.module.css";

export default async function ResetPasswordPage() {

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
	if (user.registered2FA && !session.twoFactorVerified) {
		return redirect(ROUTE_RESET_PASSWORD_2FA);
	}
	return (
    <PageTransition>
      <Title order={2} className={classes.title} ta="center" mt="md" fw={100}>
        Nytt lösenord
      </Title>
      <Text ta="center" mt="sm" mb="lg" fz="xs">
        Välj ett nytt lösenord för ditt konto
      </Text>
			<PasswordResetForm />
    </PageTransition>
	);
}
