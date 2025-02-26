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
import { getUserFromEmail } from "@/lib/server/user";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { forgotPasswordFormDataSchema, IForgotPasswordFormData } from "./schema";
import { ROUTE_RESET_PASSWORD_VERIFY_EMAIL } from "@/lib/client/constants";
import { IActionResult } from "../types";

const passwordResetEmailIPBucket = new RefillingTokenBucket<string>(3, 60);
const passwordResetEmailUserBucket = new RefillingTokenBucket<number>(3, 60);

export async function forgotPasswordAction(formData: IForgotPasswordFormData): Promise<IActionResult> {
  const belowRateLimit = await globalPOSTRateLimit();
	if (!belowRateLimit) {
		return {
			message: "Too many requests"
		};
	}

  // TODO: Assumes X-Forwarded-For is always included.
  const headerStore = await headers();
  const clientIP = headerStore.get("X-Forwarded-For");
	if (clientIP !== null && !passwordResetEmailIPBucket.check(clientIP, 1)) {
		return {
			message: "Too many requests"
		};
	}
    
  try {
    await forgotPasswordFormDataSchema.parseAsync(formData);
  } catch {
    return {
      message: "Ogiltig data. Kontrollera att uppgifter är korrekta",
    };
  }

	const user = await getUserFromEmail(formData.email);
	if (user === null) {
		return {
			message: "Account does not exist"
		};
	}
	if (clientIP !== null && !passwordResetEmailIPBucket.consume(clientIP, 1)) {
		return {
			message: "Too many requests"
		};
	}
	if (!passwordResetEmailUserBucket.consume(user.id, 1)) {
		return {
			message: "Too many requests"
		};
	}
	await invalidateUserPasswordResetSessions(user.id);
	const sessionToken = generateSessionToken();
	const session = await createPasswordResetSession(sessionToken, user.id, user.email);

	await sendPasswordResetEmail(session.email, session.code);
	await setPasswordResetSessionTokenCookie(sessionToken, session.expiresAt);
	return redirect(ROUTE_RESET_PASSWORD_VERIFY_EMAIL);
}
