/***** IMPORTANT! ***************************************************************/
"use server";
import "server-only";
/********************************************************************************/

import {
	createEmailVerificationRequest,
	deleteEmailVerificationRequestCookie,
	deleteUserEmailVerificationRequest,
	getUserEmailVerificationRequestFromRequest,
	sendVerificationEmail,
	sendVerificationEmailBucket,
	setEmailVerificationRequestCookie
} from "@/lib/server/email-verification";
import { invalidateUserPasswordResetSessions } from "@/lib/server/password-reset";
import { ExpiringTokenBucket } from "@/lib/server/rate-limit";
import { globalPOSTRateLimit } from "@/lib/server/request";
import { getCurrentSession } from "@/lib/server/session";
import { updateUserEmailAndSetEmailAsVerified } from "@/lib/server/user";
import { redirect } from "next/navigation";
import { IVerifyEmailFormData, verifyEmailFormDataSchema } from "./schema";
import { ROUTE_2FA_SETUP, ROUTE_SETTINGS } from "@/lib/client/constants";
import { IActionResult } from "../types";

const bucket = new ExpiringTokenBucket<number>(5, 60 * 30);

export async function verifyEmailAction(formData: IVerifyEmailFormData): Promise<IActionResult> {
  const belowRateLimit = await globalPOSTRateLimit();
  if (!belowRateLimit) {
    return {
      message: "För många anrop",
    };
  }

	const { session, user } = await getCurrentSession();
	if (session === null) {
		return {
			message: "Not authenticated"
		};
	}

	if (user.registered2FA && !session.twoFactorVerified) {
		return {
			message: "Forbidden"
		};
	}

	if (!bucket.check(user.id, 1)) {
		return {
			message: "Too many requests"
		};
	}

	let verificationRequest = await getUserEmailVerificationRequestFromRequest();
	if (verificationRequest === null) {
		return {
			message: "Not authenticated"
		};
	}

  try {
    await verifyEmailFormDataSchema.parseAsync(formData);
  } catch {
    return {
      message: "Ogiltig data. Kontrollera att uppgifter är korrekta",
    };
  }

	if (!bucket.consume(user.id, 1)) {
		return {
			message: "Too many requests"
		};
	}
	if (Date.now() >= verificationRequest.expiresAt.getTime()) {
		verificationRequest = await createEmailVerificationRequest(verificationRequest.userId, verificationRequest.email);
		sendVerificationEmail(verificationRequest.email, verificationRequest.code);
		return {
			message: "The verification code was expired. We sent another code to your inbox."
		};
	}
	if (verificationRequest.code !== formData.code) {
		return {
			message: "Incorrect code."
		};
	}
	await deleteUserEmailVerificationRequest(user.id);
	await invalidateUserPasswordResetSessions(user.id);
	await updateUserEmailAndSetEmailAsVerified(user.id, verificationRequest.email);
	await deleteEmailVerificationRequestCookie();
	if (!user.registered2FA) {
		return redirect(ROUTE_2FA_SETUP);
	}
	return redirect(ROUTE_SETTINGS);
}

export async function resendEmailVerificationCodeAction(): Promise<IActionResult> {
	const { session, user } = await getCurrentSession();
	if (session === null) {
		return {
			message: "Not authenticated"
		};
	}
	if (user.registered2FA && !session.twoFactorVerified) {
		return {
			message: "Forbidden"
		};
	}
	if (!sendVerificationEmailBucket.check(user.id, 1)) {
		return {
			message: "Too many requests"
		};
	}
	let verificationRequest = await getUserEmailVerificationRequestFromRequest();
	if (verificationRequest === null) {
		if (user.emailVerified) {
			return {
				message: "Forbidden"
			};
		}
		if (!sendVerificationEmailBucket.consume(user.id, 1)) {
			return {
				message: "Too many requests"
			};
		}
		verificationRequest = await createEmailVerificationRequest(user.id, user.email);
	} else {
		if (!sendVerificationEmailBucket.consume(user.id, 1)) {
			return {
				message: "Too many requests"
			};
		}
		verificationRequest = await createEmailVerificationRequest(user.id, verificationRequest.email);
	}
	sendVerificationEmail(verificationRequest.email, verificationRequest.code);
	await setEmailVerificationRequestCookie(verificationRequest);
	return {
		message: "A new code was sent to your inbox."
	};
}
