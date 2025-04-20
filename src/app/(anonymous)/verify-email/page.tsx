import Link from "next/link";
import { redirect } from "next/navigation";
import { Text, Title } from "@mantine/core";
import { getUserEmailVerificationRequestFromRequest } from "@/lib/server/email-verification";
import { globalGETRateLimit } from "@/lib/server/request";
import { getCurrentSession } from "@/lib/server/session";
import { EmailVerificationForm } from "@/ui/EmailVerificationForm";
import { ResendEmailVerificationCodeForm } from "@/ui/ResendEmailVerificationCodeForm";
import { ErrorMessage } from "@/ui/ErrorMessage";
import { PageTransition } from "@/ui/PageTransition";
import {
  ROUTE_HOME,
  ROUTE_SETTINGS_UPDATE_EMAIL,
  ROUTE_SIGN_IN,
} from "@/lib/client/constants";

import classes from "./page.module.css";

export default async function VerifyEmailPage() {

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
	const { user } = await getCurrentSession();
	if (user === null) {
		return redirect(ROUTE_SIGN_IN);
	}
  
	const verificationRequest = await getUserEmailVerificationRequestFromRequest();
	if (verificationRequest === null && user.emailVerified) {
		return redirect(ROUTE_HOME);
	}
	return (
    <PageTransition>
      <Title order={2} className={classes.title} ta="center" mt="md" fw={100}>
        Verifiera din E-post
      </Title>
      <Text ta="center" mt="sm" mb="lg" fz="xs">
        Vi har skickat en 8-siffrig kod till {verificationRequest?.email ?? user.email}.{' '}
        <Text component={Link} td="underline" fz="xs" fw={700} href={ROUTE_SETTINGS_UPDATE_EMAIL}>
          Byt e-post
        </Text>
      </Text>
      <EmailVerificationForm />
			<ResendEmailVerificationCodeForm />
    </PageTransition>
	);
}
