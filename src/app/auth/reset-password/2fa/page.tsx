import { ROUTE_FORGOT_PASSWORD, ROUTE_RESET_PASSWORD, ROUTE_RESET_PASSWORD_VERIFY_EMAIL } from "@/lib/client/constants";
import { validatePasswordResetSessionRequest } from "@/lib/server/password-reset";
import { globalGETRateLimit } from "@/lib/server/request";
import { PasswordResetRecoveryCodeForm } from "@/ui/PasswordResetRecoveryCodeForm";
import { PasswordResetTOTPForm } from "@/ui/PasswordResetTotpForm";
import { Title, Text, Box } from "@mantine/core";
import { redirect } from "next/navigation";

import classes from "./page.module.css";

export default async function ResetPasswordTwoFactorPage() {
	const belowRateLimit = await globalGETRateLimit();
  if (!belowRateLimit) {
		return "Too many requests";
	}
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
		<>
      <Title order={2} className={classes.title} ta="center" mt="md" mb={50} fw={100}>
        2-faktors autentisering!
      </Title>
      <Text ta="center" mt="md">
        Ange koden från din authenticator app.
      </Text>
			<PasswordResetTOTPForm />
			<Box mt={50}>
        <Title order={2} className={classes.title} ta="center" mt="md" mb={50} fw={100}>
          Använd din återställningskod istället!
        </Title>
				<PasswordResetRecoveryCodeForm />
			</Box>
		</>
	);
}
