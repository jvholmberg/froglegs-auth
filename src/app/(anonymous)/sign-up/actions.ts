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
import { ISessionFlags } from "@/lib/server/db/types";
import { IActionResult } from "@/lib/client/types";
import { genericErrorResult, genericTooManyRequestsResult, genericValidationErrorResult } from "@/lib/server/utils";

const ipBucket = new RefillingTokenBucket<string>(3, 10);

export async function signUpAction(formData: ISignUpFormData): Promise<IActionResult> {
  // Rate-limit client. Check that below threshold
  const belowRateLimit = await globalPOSTRateLimit();
	if (!belowRateLimit) {
		return genericTooManyRequestsResult();
	}

  const headerStore = await headers();
	const clientIP = headerStore.get("X-Forwarded-For");
	if (clientIP !== null && !ipBucket.check(clientIP, 1)) {
		return genericTooManyRequestsResult();
	}

  // Validate data
  try {
    await signUpFormDataSchema.parseAsync(formData);
  } catch {
    return genericValidationErrorResult();
  }

  // Make sure email is available
	const emailAvailable = checkEmailAvailability(formData.email);
	if (!emailAvailable) {
    return genericErrorResult("E-posten är redan upptagen");
	}

  // Make sure password is secure
	const strongPassword = await verifyPasswordStrength(formData.password);
	if (!strongPassword) {
    return genericErrorResult("För svagt lösenord");
	}

  // Add entry for client
	if (clientIP !== null && !ipBucket.consume(clientIP, 1)) {
		return genericTooManyRequestsResult();
	}
	const user = await createUser(formData.email, formData.password);
  if (!user) {
    return genericErrorResult("Något gick fel när användare skulle skapas!");
  }

  // Send email verification to client
  // Generate sessions and redirect to next step
  const emailVerificationRequest = await createEmailVerificationRequest(user.id, user.email);
  sendVerificationEmail(emailVerificationRequest.email, emailVerificationRequest.code);
  await setEmailVerificationRequestCookie(emailVerificationRequest);
  const sessionFlags: ISessionFlags = {
    twoFactorVerified: false
  };
  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, user.id, sessionFlags);
  await setSessionTokenCookie(sessionToken, session.expiresAt);
	return redirect(ROUTE_2FA_SETUP);
}
