import { globalGETRateLimit } from "@/lib/server/request";
import { getCurrentSession } from "@/lib/server/session";
import { SignInForm } from "@/ui/SignInForm";
import { Title, Text, Center } from "@mantine/core";
import Link from "next/link";
import { redirect } from "next/navigation";

import classes from "./page.module.css";
import { ROUTE_2FA, ROUTE_2FA_SETUP, ROUTE_FORGOT_PASSWORD, ROUTE_SETTINGS, ROUTE_SIGN_UP, ROUTE_VERIFY_EMAIL } from "@/lib/client/constants";

export default async function SignInPage() {
  const belowRateLimit = await globalGETRateLimit();
	if (!belowRateLimit) {
		return "För många anrop";
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
      <Title order={2} className={classes.title} ta="center" mt="md" mb={50}>
        Logga in!
      </Title>

      <Text ta="center" mt="md">
        Har du inget konto?{' '}
        <Text component={Link} td="underline" fw={700} href={ROUTE_SIGN_UP}>
          Skapa ett
        </Text>
      </Text>
      <SignInForm />
      <Center mt="md">
        <Text component={Link} td="underline" fw={700} href={ROUTE_FORGOT_PASSWORD}>
          Glömt lösenord
        </Text>
      </Center>
    </>
	);
}
