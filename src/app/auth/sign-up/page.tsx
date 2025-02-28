import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/server/session";
import { SignUpForm } from "@/ui/SignUpForm";
import { Title, Text } from "@mantine/core";
import { globalGETRateLimit } from "@/lib/server/request";

import classes from "./page.module.css";
import { ROUTE_2FA, ROUTE_2FA_SETUP, ROUTE_SETTINGS, ROUTE_SIGN_IN, ROUTE_VERIFY_EMAIL } from "@/lib/client/constants";

export default async function SignUpPage() {
  const belowRateLimit = await globalGETRateLimit();
	if (!belowRateLimit) {
		return "Too many requests";
	}
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
		return redirect(ROUTE_SETTINGS);
	}
	return (
    <>
      <Title order={2} className={classes.title} ta="center" mt="md" mb={50} fw={100}>
        Skapa konto!
      </Title>

      <Text ta="center" mt="md">
        Har du redan ett konto?{' '}
        <Text component={Link} td="underline" fw={700} href={ROUTE_SIGN_IN}>
          Logga in
        </Text>
      </Text>
      <SignUpForm />
    </>
	);
}
