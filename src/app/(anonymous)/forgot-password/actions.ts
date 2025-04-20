/***** IMPORTANT! ***************************************************************/
"use server";
import "server-only";
/********************************************************************************/

import {
	createPasswordResetSession,
	invalidateUserPasswordResetSessions,
	sendPasswordResetEmail,
	setPasswordResetSessionTokenCookie
} from "@/lib/server/password-reset";
import { RefillingTokenBucket } from "@/lib/server/rate-limit";
import { globalPOSTRateLimit } from "@/lib/server/request";
import { generateSessionToken } from "@/lib/server/session";
import { getOneUser } from "@/lib/server/user";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROUTE_RESET_PASSWORD_VERIFY_EMAIL } from "@/lib/client/constants";
import { IActionResult } from "@/lib/client/types";
import { forgotPasswordFormDataSchema, IForgotPasswordFormData } from "./schema";
import { genericErrorResult, genericTooManyRequestsResult, genericValidationErrorResult } from "@/lib/server/utils";

const passwordResetEmailIPBucket = new RefillingTokenBucket<string>(3, 60);
const passwordResetEmailUserBucket = new RefillingTokenBucket<number>(3, 60);

export async function forgotPasswordAction(formData: IForgotPasswordFormData): Promise<IActionResult> {
  const belowRateLimit = await globalPOSTRateLimit();
	if (!belowRateLimit) {
		return genericTooManyRequestsResult();
	}

  // TODO: Assumes X-Forwarded-For is always included.
  const headerStore = await headers();
  const clientIP = headerStore.get("X-Forwarded-For");
	if (clientIP !== null && !passwordResetEmailIPBucket.check(clientIP, 1)) {
		return genericTooManyRequestsResult();
	}
    
  try {
    await forgotPasswordFormDataSchema.parseAsync(formData);
  } catch {
		return genericValidationErrorResult();
  }

	const user = await getOneUser({ email: formData.email });
	if (user === null) {
    return genericErrorResult("Kunde inte hitta kontot");
	}
	if (clientIP !== null && !passwordResetEmailIPBucket.consume(clientIP, 1)) {
		return genericTooManyRequestsResult();
	}
	if (!passwordResetEmailUserBucket.consume(user.id, 1)) {
		return genericTooManyRequestsResult();
	}
	await invalidateUserPasswordResetSessions(user.id);
	const sessionToken = generateSessionToken();
	const session = await createPasswordResetSession(sessionToken, user.id, user.email);

	await sendPasswordResetEmail(session.email, session.code);
	await setPasswordResetSessionTokenCookie(sessionToken, session.expiresAt);
	return redirect(ROUTE_RESET_PASSWORD_VERIFY_EMAIL);
}
