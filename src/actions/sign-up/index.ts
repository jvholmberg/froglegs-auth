/***** IMPORTANT! ***************************************************************/
"use server";
import "server-only";
/********************************************************************************/

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkEmailAvailability } from "@/lib/server/email";
import {
	createEmailVerificationRequest,
	sendVerificationEmail,
	setEmailVerificationRequestCookie
} from "@/lib/server/email-verification";
import { verifyPasswordStrength } from "@/lib/server/password";
import { RefillingTokenBucket } from "@/lib/server/rate-limit";
import { createSession, generateSessionToken, setSessionTokenCookie } from "@/lib/server/session";
import { createUser } from "@/lib/server/user";
import { globalPOSTRateLimit } from "@/lib/server/request";

import { ISignUpFormData, signUpFormDataSchema } from "./schema";
import { ROUTE_2FA_SETUP } from "@/lib/client/constants";
import { IActionResult } from "../types";
import { ISessionFlags } from "@/lib/server/db/types";

const ipBucket = new RefillingTokenBucket<string>(3, 10);

export async function signUpAction(formData: ISignUpFormData): Promise<IActionResult> {
  const belowRateLimit = await globalPOSTRateLimit();
	if (!belowRateLimit) {
		return {
			message: "För många anrop",
		};
	}

	// TODO: Assumes X-Forwarded-For is always included.
  const headerStore = await headers();
	const clientIP = headerStore.get("X-Forwarded-For");
	if (clientIP !== null && !ipBucket.check(clientIP, 1)) {
		return {
			message: "För många anrop",
		};
	}

  try {
    await signUpFormDataSchema.parseAsync(formData);
  } catch {
    return {
			message: "Ogiltig data. Kontrollera att uppgifter är korrekta",
		};
  }

	const emailAvailable = checkEmailAvailability(formData.email);
	if (!emailAvailable) {
		return {
			message: "Email is already used"
		};
	}
	const strongPassword = await verifyPasswordStrength(formData.password);
	if (!strongPassword) {
		return {
			message: "Weak password"
		};
	}
	if (clientIP !== null && !ipBucket.consume(clientIP, 1)) {
		return {
			message: "För många anrop"
		};
	}
	const user = await createUser(formData.email, formData.password);
  if (user) {
    const emailVerificationRequest = await createEmailVerificationRequest(user.id, user.email);
    sendVerificationEmail(emailVerificationRequest.email, emailVerificationRequest.code);
    setEmailVerificationRequestCookie(emailVerificationRequest);
    const sessionFlags: ISessionFlags = {
      twoFactorVerified: false
    };
    const sessionToken = generateSessionToken();
    const session = await createSession(sessionToken, user.id, sessionFlags);
    setSessionTokenCookie(sessionToken, session.expiresAt);
  }

	return redirect(ROUTE_2FA_SETUP);
}
