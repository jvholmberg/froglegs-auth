/***** IMPORTANT! ***************************************************************/
"use server";
import "server-only";
/********************************************************************************/

import { IActionResult } from "@/lib/client/types";
import { globalPOSTRateLimit } from "@/lib/server/request";
import {
  createSession,
  generateSessionToken,
  getCurrentSession,
  invalidateUserSessions,
  setSessionTokenCookie,
} from "@/lib/server/session";
import {
  genericErrorResult,
  genericForbiddenErrorResult,
  genericNotLoggedInErrorResult,
  genericSuccesResult,
  genericTooManyRequestsResult,
  genericValidationErrorResult,
} from "@/lib/server/utils";

import { IUpdatePasswordFormData, updatePasswordFormDataSchema } from "./schema";
import { verifyPasswordStrength, verifyPasswordHash } from "@/lib/server/password";
import { getUserPasswordHash, updateUserPassword } from "@/lib/server/user";
import { ExpiringTokenBucket } from "@/lib/server/rate-limit";
import { ISessionFlags } from "@/lib/server/db/types";
import { sendVerificationEmailBucket } from "@/lib/server/email-verification";

const passwordUpdateBucket = new ExpiringTokenBucket<string>(5, 60 * 30);

export async function updatePasswordAction(formData: IUpdatePasswordFormData): Promise<IActionResult> {
  const belowRateLimit = await globalPOSTRateLimit();
  if (!belowRateLimit) {
    return genericTooManyRequestsResult();
  }

	const { session, user } = await getCurrentSession();
	if (session === null) {
    return genericNotLoggedInErrorResult();
  }

  if (user.registered2FA && !session.twoFactorVerified) {
    return genericForbiddenErrorResult();
  }

  if (!sendVerificationEmailBucket.check(user.id, 1)) {
    return genericTooManyRequestsResult();
  }

  try {
    await updatePasswordFormDataSchema.parseAsync(formData);
  } catch {
    return genericValidationErrorResult();
  }

	const strongPassword = await verifyPasswordStrength(formData.passwordNew);
	if (!strongPassword) {
    return genericErrorResult("Inte tillräckligt säkert lösenord");
	}

	if (!passwordUpdateBucket.consume(session.id, 1)) {
    return genericTooManyRequestsResult();
	}
	const passwordHash = await getUserPasswordHash(user.id);
	const validPassword = await verifyPasswordHash(passwordHash, formData.password);
	if (!validPassword) {
    return genericErrorResult("Felaktigt lösenord");
	}
	passwordUpdateBucket.reset(session.id);
	await invalidateUserSessions(user.id);
	await updateUserPassword(user.id, formData.passwordNew);

	const sessionToken = generateSessionToken();
	const sessionFlags: ISessionFlags = {
		twoFactorVerified: session.twoFactorVerified,
	};
	const newSession = await createSession(sessionToken, user.id, sessionFlags);
	await setSessionTokenCookie(sessionToken, newSession.expiresAt);
  return genericSuccesResult(null, "Lösenordet uppdaterades");
}
