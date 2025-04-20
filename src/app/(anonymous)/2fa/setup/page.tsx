
import { redirect } from "next/navigation";
import Link from "next/link";
import { renderSVG } from "uqr";
import { Center, Title, Text } from "@mantine/core";
import { encodeBase64 } from "@oslojs/encoding";
import { createTOTPKeyURI } from "@oslojs/otp";
import { getCurrentSession } from "@/lib/server/session";
import { globalGETRateLimit } from "@/lib/server/request";
import { TwoFactorSetupForm } from "@/ui/TwoFactorSetupForm";
import { ErrorMessage } from "@/ui/ErrorMessage";
import { PageTransition } from "@/ui/PageTransition";
import {
  ROUTE_2FA,
  ROUTE_SIGN_IN,
  ROUTE_VERIFY_EMAIL,
  APP_DISPLAY_NAME,
  TWO_FACTOR_MANDATORY,
  ROUTE_HOME,
} from "@/lib/client/constants";

import classes from "./page.module.css";

export default async function TwoFactorSetupPage() {
  const belowRateLimit = await globalGETRateLimit();
	if (!belowRateLimit) {
    return (
      <ErrorMessage
        title="Ta det lugnt!"
        message="Vi har uppmärksammat misstänkt beteende från dig. Du har skickat väldigt många frågor mot servern!" />
    );
  }
	const { session, user } = await getCurrentSession();
	if (session === null) {
		return redirect(ROUTE_SIGN_IN);
	}
	if (!user.emailVerified) {
		return redirect(ROUTE_VERIFY_EMAIL);
	}
	if (user.registered2FA && !session.twoFactorVerified) {
		return redirect(ROUTE_2FA);
	}

	const totpKey = new Uint8Array(20);
	crypto.getRandomValues(totpKey);
	const encodedTOTPKey = encodeBase64(totpKey);
	const keyURI = createTOTPKeyURI(APP_DISPLAY_NAME, user.email, totpKey, 30, 6);
	const qrcode = renderSVG(keyURI);
	return (
		<PageTransition>
      <Title order={2} className={classes.title} ta="center" mt="md" fw={100}>
        Sätt upp 2-faktors autentisering
      </Title>
      <Text ta="center" mt="sm" fz="xs">
        Skanna QR-koden med din telefon.
        Ange sedan koden som visas i app på telefonen nedan för att koppla mot konto.
      </Text>
      <Center mt="lg" mb="lg">
        <div
          style={{
            width: "150px",
            height: "150px"
          }}
          dangerouslySetInnerHTML={{
            __html: qrcode
          }}>  
        </div>
      </Center>
			<TwoFactorSetupForm encodedTOTPKey={encodedTOTPKey} />
      {!TWO_FACTOR_MANDATORY && (
        <Center pt="md">
          <Text component={Link} td="underline" href={ROUTE_HOME} fw={700}>
            Sätt upp senare
          </Text>
        </Center>
      )}
		</PageTransition>
	);
}
