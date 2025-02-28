import { getCurrentSession } from "@/lib/server/session";
import { redirect } from "next/navigation";
import { globalGETRateLimit } from "@/lib/server/request";
import { TwoFactorResetForm } from "@/ui/TwoFactorResetForm";
import { ROUTE_2FA_SETUP, ROUTE_SETTINGS, ROUTE_SIGN_IN, ROUTE_VERIFY_EMAIL } from "@/lib/client/constants";
import { Title } from "@mantine/core";

import classes from "./page.module.css";

export default async function TwoFactorResetPage() {
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
      Återställningskod
    </Title>
			<TwoFactorResetForm />
		</>
	);
}
