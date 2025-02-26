
import { validatePasswordResetSessionRequest } from "@/lib/server/password-reset";
import { globalGETRateLimit } from "@/lib/server/request";
import { PasswordResetForm } from "@/ui/ResetPasswordForm";
import { redirect } from "next/navigation";

import classes from "./page.module.css";
import { Title } from "@mantine/core";
import { ROUTE_FORGOT_PASSWORD, ROUTE_RESET_PASSWORD_2FA, ROUTE_RESET_PASSWORD_VERIFY_EMAIL } from "@/lib/client/constants";

export default async function ResetPasswordPage() {
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
	if (user.registered2FA && !session.twoFactorVerified) {
		return redirect(ROUTE_RESET_PASSWORD_2FA);
	}
	return (
    <>
      <Title order={2} className={classes.title} ta="center" mt="md" mb={50}>
        Välj nytt lösenord
      </Title>
			<PasswordResetForm />
    </>
	);
}
