/***** IMPORTANT! ***************************************************************/
"use server";
import "server-only";
/********************************************************************************/

import { verifyPasswordHash } from "@/lib/server/password";
import { RefillingTokenBucket, Throttler } from "@/lib/server/rate-limit";
import { createSession, generateSessionToken, setSessionTokenCookie } from "@/lib/server/session";
import { getOneUser, getUserPasswordHash } from "@/lib/server/user";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { globalPOSTRateLimit } from "@/lib/server/request";
import { ROUTE_2FA, ROUTE_2FA_SETUP, ROUTE_HOME, ROUTE_VERIFY_EMAIL, TWO_FACTOR_MANDATORY } from "@/lib/client/constants";
import { IActionResult } from "@/lib/client/types";
import { ISessionFlags } from "@/lib/server/db/types";
import { ISignInFormData, signInFormDataSchema } from "./schema";
import {
  genericErrorResult,
  genericNoAccountErrorResult,
  genericTooManyRequestsResult,
  genericValidationErrorResult,
} from "@/lib/server/utils";

const throttler = new Throttler<number>([1, 2, 4, 8, 16, 30, 60, 180, 300]);
const ipBucket = new RefillingTokenBucket<string>(20, 1);

export async function signInAction(formData: ISignInFormData): Promise<IActionResult> {
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
    await signInFormDataSchema.parseAsync(formData);
  } catch {
    return genericValidationErrorResult();
  }

  // Check if user exists
	const user = await getOneUser({ email: formData.email });
	if (user === null) {
		return genericNoAccountErrorResult();
	}

  // Throttle user
	if (clientIP !== null && !ipBucket.consume(clientIP, 1)) {
    return genericTooManyRequestsResult();
	}
	if (!throttler.consume(user.id)) {
    return genericTooManyRequestsResult();
	}

  // Compare passwords
	const passwordHash = await getUserPasswordHash(user.id);
	const validPassword = await verifyPasswordHash(passwordHash, formData.password);
	if (!validPassword) {
    return genericErrorResult("Ogiltigt lösenord");
	}
	throttler.reset(user.id);
	const sessionFlags: ISessionFlags = {
		twoFactorVerified: false
	};

  // Create session
	const sessionToken = generateSessionToken();
	const session = await createSession(sessionToken, user.id, sessionFlags);
	await setSessionTokenCookie(sessionToken, session.expiresAt);

	if (!user.emailVerified) {
		return redirect(ROUTE_VERIFY_EMAIL);
	}

  // Redirect to 2FA setup if set to mandatory 
  if (TWO_FACTOR_MANDATORY) {
    if (!user.registered2FA) {
      return redirect(ROUTE_2FA_SETUP);
    }
    return redirect(ROUTE_2FA);
  }

  // Else redirect to home
  return redirect(ROUTE_HOME);
}
