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
import { IActionResultExtended } from "../types";
import { genericErrorResult, genericForbiddenErrorResult, genericNotLoggedInErrorResult, genericSuccesResult, genericTooManyRequestsResult, genericValidationErrorResult } from "@/lib/server/utils";

const bucket = new ExpiringTokenBucket<number>(5, 60 * 30);

export async function verifyEmailAction(formData: IVerifyEmailFormData): Promise<IActionResultExtended> {
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

	if (!bucket.check(user.id, 1)) {
    return genericTooManyRequestsResult();
	}

	let verificationRequest = await getUserEmailVerificationRequestFromRequest();
	if (verificationRequest === null) {
		return genericNotLoggedInErrorResult();
	}

  try {
    await verifyEmailFormDataSchema.parseAsync(formData);
  } catch {
    return genericValidationErrorResult();
  }

	if (!bucket.consume(user.id, 1)) {
    return genericTooManyRequestsResult();
	}
	if (Date.now() >= verificationRequest.expiresAt.getTime()) {
		verificationRequest = await createEmailVerificationRequest(verificationRequest.userId, verificationRequest.email);
		sendVerificationEmail(verificationRequest.email, verificationRequest.code);
    return genericErrorResult("Verifieringskoden har gått ut. Vi har skickat en ny till din e-post.");
	}
	if (verificationRequest.code !== formData.code) {
    return genericErrorResult("Felaktig kod!");
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

export async function resendEmailVerificationCodeAction(): Promise<IActionResultExtended> {
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
	let verificationRequest = await getUserEmailVerificationRequestFromRequest();
	if (verificationRequest === null) {
		if (user.emailVerified) {
      return genericForbiddenErrorResult();
		}
		if (!sendVerificationEmailBucket.consume(user.id, 1)) {
      return genericTooManyRequestsResult();
		}
		verificationRequest = await createEmailVerificationRequest(user.id, user.email);
	} else {
		if (!sendVerificationEmailBucket.consume(user.id, 1)) {
      return genericTooManyRequestsResult();
		}
		verificationRequest = await createEmailVerificationRequest(user.id, verificationRequest.email);
	}
	sendVerificationEmail(verificationRequest.email, verificationRequest.code);
	await setEmailVerificationRequestCookie(verificationRequest);
  return genericSuccesResult("En ny kod har skickats till din e-post");
}
