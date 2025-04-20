/***** IMPORTANT! ***************************************************************/
"use server";
import "server-only";
/********************************************************************************/

import { IActionResult } from "@/lib/client/types";
import { globalPOSTRateLimit } from "@/lib/server/request";
import { IUpdateEmailFormData, updateEmailFormDataSchema } from "./schema";
import {
  createEmailVerificationRequest,
  sendVerificationEmail,
  sendVerificationEmailBucket,
  setEmailVerificationRequestCookie,
} from "@/lib/server/email-verification";
import { checkEmailAvailability } from "@/lib/server/email";
import { getCurrentSession } from "@/lib/server/session";
import {
  genericErrorResult,
  genericForbiddenErrorResult,
  genericNotLoggedInErrorResult,
  genericSuccesResult,
  genericTooManyRequestsResult,
  genericValidationErrorResult,
} from "@/lib/server/utils";

export async function updateEmailAction(formData: IUpdateEmailFormData): Promise<IActionResult> {
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
    await updateEmailFormDataSchema.parseAsync(formData);
  } catch {
    return genericValidationErrorResult();
  }

	const emailAvailable = checkEmailAvailability(formData.email);
	if (!emailAvailable) {
    return genericErrorResult("E-posten är upptagen");
	}
	if (!sendVerificationEmailBucket.consume(user.id, 1)) {
		return genericTooManyRequestsResult();
	}
	const verificationRequest = await createEmailVerificationRequest(user.id, formData.email);
	sendVerificationEmail(verificationRequest.email, verificationRequest.code);
	await setEmailVerificationRequestCookie(verificationRequest);
	return genericSuccesResult(null, "En verifieringskod har skickats till dig");
}
