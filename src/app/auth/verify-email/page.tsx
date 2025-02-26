import { ROUTE_SETTINGS, ROUTE_SIGN_IN } from "@/lib/client/constants";
import { getUserEmailVerificationRequestFromRequest } from "@/lib/server/email-verification";
import { globalGETRateLimit } from "@/lib/server/request";
import { getCurrentSession } from "@/lib/server/session";
import { EmailVerificationForm } from "@/ui/EmailVerificationForm";
import { ResendEmailVerificationCodeForm } from "@/ui/ResendEmailVerificationCodeForm";
import { Text, Title } from "@mantine/core";
import Link from "next/link";
import { redirect } from "next/navigation";

import classes from "./page.module.css";

export default async function VerifyEmailPage() {
  const belowRateLimit = await globalGETRateLimit();
	if (!belowRateLimit) {
		return "Too many requests";
	}
	const { user } = await getCurrentSession();
	if (user === null) {
		return redirect(ROUTE_SIGN_IN);
	}

	// TODO: Ideally we'd sent a new verification email automatically if the previous one is expired,
	// but we can't set cookies inside server components.
	const verificationRequest = await getUserEmailVerificationRequestFromRequest();
	if (verificationRequest === null && user.emailVerified) {
		return redirect(ROUTE_SETTINGS);
	}
	return (
    <>
      <Title order={2} className={classes.title} ta="center" mt="md" mb={50}>
        Verifiera din E-post!
      </Title>

      <Text ta="center" mt="md">
        Vi har skickat en 8-siffrig kod till {verificationRequest?.email ?? user.email}.{' '}
        <Text component={Link} td="underline" fw={700} href={ROUTE_SETTINGS}>
          Byt e-post
        </Text>
      </Text>
      <EmailVerificationForm />
			<ResendEmailVerificationCodeForm />
    </>
	);
}
