import { redirect } from "next/navigation";
import { validatePasswordResetSessionRequest } from "@/lib/server/password-reset";
import { globalGETRateLimit } from "@/lib/server/request";
import { PasswordResetEmailVerificationForm } from "@/ui/PasswordResetEmailVerificationForm";

import classes from "./page.module.css";
import { ROUTE_FORGOT_PASSWORD, ROUTE_RESET_PASSWORD, ROUTE_RESET_PASSWORD_2FA } from "@/lib/client/constants";
import { Title, Text } from "@mantine/core";

export default async function ResetPasswordVerifyEmailPage() {
  const belowRateLimit = await globalGETRateLimit();
	if (!belowRateLimit) {
		return "Too many requests";
	}
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
		<>
      <Title order={2} className={classes.title} ta="center" mt="md" mb={50}>
        Verifiera din E-post!
      </Title>
      <Text ta="center" mt="md">
        Vi har skickat en 8-siffrig kod till <b>{session.email}</b>.
      </Text>
			<PasswordResetEmailVerificationForm />
		</>
	);
}
