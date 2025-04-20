/***** IMPORTANT! ***************************************************************/
"use server";
import "server-only";
/********************************************************************************/

import { redirect } from "next/navigation";
import { decodeBase64 } from "@oslojs/encoding";
import { verifyTOTP } from "@oslojs/otp";
import { RefillingTokenBucket } from "@/lib/server/rate-limit";
import { globalPOSTRateLimit } from "@/lib/server/request";
import { getCurrentSession, setSessionAs2FAVerified } from "@/lib/server/session";
import { getUserTOTPKey, updateUserTOTPKey } from "@/lib/server/user";
import { recoveryCodeBucket, resetUser2FAWithRecoveryCode, totpBucket } from "@/lib/server/2fa";
import { ROUTE_RECOVERY_CODE, ROUTE_2FA_SETUP, ROUTE_HOME } from "@/lib/client/constants";
import { IActionResult } from "@/lib/client/types";
import {
  genericErrorResult,
  genericForbiddenErrorResult,
  genericNotLoggedInErrorResult,
  genericTooManyRequestsResult,
  genericValidationErrorResult,
} from "@/lib/server/utils";
import {
  ITwoFactorSetupFormData,
  twoFactorSetupFormDataSchema,
  ITwoFactorVerifyFormData,
  twoFactorVerifyFormDataSchema,
  ITwoFactorResetFormData,
  twoFactorResetFormDataSchema,
} from "./schema";

const totpUpdateBucket = new RefillingTokenBucket<number>(3, 60 * 10);

export async function setup2FAAction(formData: ITwoFactorSetupFormData): Promise<IActionResult> {
	const belowRateLimit = await globalPOSTRateLimit();
  if (!belowRateLimit) { return genericTooManyRequestsResult(); }

	const { session, user } = await getCurrentSession();
	if (session === null) { return genericNotLoggedInErrorResult(); }
	if (!user.emailVerified) { return genericForbiddenErrorResult(); }
	if (user.registered2FA && !session.twoFactorVerified) { return genericForbiddenErrorResult(); }
	if (!totpUpdateBucket.check(user.id, 1)) { return genericTooManyRequestsResult(); }
  
  try { await twoFactorSetupFormDataSchema.parseAsync(formData); }
  catch { return genericValidationErrorResult(); }

	let key: Uint8Array;
	if (formData.key.length !== 28) { return genericErrorResult("Ogiltig nyckel"); }

	try { key = decodeBase64(formData.key); }
  catch { return genericErrorResult("Ogiltig nyckel"); }

	if (key.byteLength !== 20) { return genericErrorResult("Ogiltig nyckel"); }
	if (!totpUpdateBucket.consume(user.id, 1)) { return genericTooManyRequestsResult(); }
	if (!verifyTOTP(key, 30, 6, formData.code)) { return genericErrorResult("Ogiltig kod"); }

	await updateUserTOTPKey(session.userId, key);
	await setSessionAs2FAVerified(session.id);
	return redirect(ROUTE_RECOVERY_CODE);
}

export async function verify2FAAction(formData: ITwoFactorVerifyFormData): Promise<IActionResult> {
	const belowRateLimit = await globalPOSTRateLimit();
  if (!belowRateLimit) { return genericTooManyRequestsResult(); }
  
	const { session, user } = await getCurrentSession();
	if (session === null) { return genericNotLoggedInErrorResult(); }
	if (!user.emailVerified || !user.registered2FA || session.twoFactorVerified) { return genericForbiddenErrorResult(); }
	if (!totpBucket.check(user.id, 1)) { return genericTooManyRequestsResult(); }

  try { await twoFactorVerifyFormDataSchema.parseAsync(formData); }
  catch { return genericValidationErrorResult(); }

	if (!totpBucket.consume(user.id, 1)) { return genericTooManyRequestsResult(); }

	const totpKey = await getUserTOTPKey(user.id);
	if (totpKey === null) { return genericForbiddenErrorResult(); }
	if (!verifyTOTP(totpKey, 30, 6, formData.code)) { return genericErrorResult("Ogiltig kod"); }

	totpBucket.reset(user.id);
	await setSessionAs2FAVerified(session.id);
	return redirect(ROUTE_HOME);
}

export async function reset2FAAction(formData: ITwoFactorResetFormData): Promise<IActionResult> {
	const { session, user } = await getCurrentSession();
	if (session === null) { return genericNotLoggedInErrorResult(); }
	if (!user.emailVerified || !user.registered2FA || session.twoFactorVerified) { return genericForbiddenErrorResult(); }
	if (!totpBucket.check(user.id, 1)) { return genericTooManyRequestsResult(); }
	if (!recoveryCodeBucket.check(user.id, 1)) { return genericTooManyRequestsResult(); }

  try { await twoFactorResetFormDataSchema.parseAsync(formData); }
  catch { return genericValidationErrorResult(); }

	if (!recoveryCodeBucket.consume(user.id, 1)) { return genericTooManyRequestsResult(); }

	const valid = await resetUser2FAWithRecoveryCode(user.id, formData.code);
	if (!valid) { return genericErrorResult("Ogiltig återställningskod"); }

	recoveryCodeBucket.reset(user.id);
	return redirect(ROUTE_2FA_SETUP);
}
