
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/server/session";
import { Center, Title, Text } from "@mantine/core";
import { globalGETRateLimit } from "@/lib/server/request";
import { encodeBase64 } from "@oslojs/encoding";
import { createTOTPKeyURI } from "@oslojs/otp";
import { renderSVG } from "uqr";
import { TwoFactorSetupForm } from "@/ui/TwoFactorSetupForm";
import { ROUTE_2FA, ROUTE_SETTINGS, ROUTE_SIGN_IN, ROUTE_VERIFY_EMAIL, TOTP_DISPLAY_NAME } from "@/lib/client/constants";

import classes from "./page.module.css";
import Link from "next/link";

export default async function TwoFactorSetupPage() {
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
	if (user.registered2FA && !session.twoFactorVerified) {
		return redirect(ROUTE_2FA);
	}

	const totpKey = new Uint8Array(20);
	crypto.getRandomValues(totpKey);
	const encodedTOTPKey = encodeBase64(totpKey);
	const keyURI = createTOTPKeyURI(TOTP_DISPLAY_NAME, user.email, totpKey, 30, 6);
	const qrcode = renderSVG(keyURI);
	return (
		<>
      <Title order={2} className={classes.title} ta="center" mt="md" mb={50}>
        Sätt upp 2-faktors autentisering
      </Title>

      <Text ta="center" mb="md">
        Skanna QR-koden med din telefon. Ange sedan koden som visas i app på telefonen nedan för att koppla mot konto
      </Text>
      <Center mb="md">
        <div
          style={{
            width: "200px",
            height: "200px"
          }}
          dangerouslySetInnerHTML={{
            __html: qrcode
          }}>  
        </div>
      </Center>
			<TwoFactorSetupForm encodedTOTPKey={encodedTOTPKey} />
      <Center pt="md">
        <Link href={ROUTE_SETTINGS}>Sätt upp senare</Link>
      </Center>
		</>
	);
}
