/***** IMPORTANT! ***************************************************************/
"use server";
import "server-only";
/********************************************************************************/

import { verifyPasswordStrength } from "@/lib/server/password";
import {
	deletePasswordResetSessionTokenCookie,
	invalidateUserPasswordResetSessions,
	setPasswordResetSessionAs2FAVerified,
	setPasswordResetSessionAsEmailVerified,
	validatePasswordResetSessionRequest
} from "@/lib/server/password-reset";
import {
	createSession,
	generateSessionToken,
	invalidateUserSessions,
	setSessionTokenCookie
} from "@/lib/server/session";
import { getUserTOTPKey, setUserAsEmailVerifiedIfEmailMatches, updateUserPassword } from "@/lib/server/user";
import { redirect } from "next/navigation";
import { globalPOSTRateLimit } from "@/lib/server/request";
import { ExpiringTokenBucket } from "@/lib/server/rate-limit";
import { recoveryCodeBucket, resetUser2FAWithRecoveryCode, totpBucket } from "@/lib/server/2fa";
import { verifyTOTP } from "@oslojs/otp";
import { ROUTE_RESET_PASSWORD, ROUTE_RESET_PASSWORD_2FA, ROUTE_HOME } from "@/lib/client/constants";
import { IActionResult } from "@/lib/client/types";
import { ISessionFlags } from "@/lib/server/db/types";
import {
  genericErrorResult,
  genericForbiddenErrorResult,
  genericNotLoggedInErrorResult,
  genericTooManyRequestsResult,
  genericValidationErrorResult,
} from "@/lib/server/utils";
import {
  IResetPasswordFormData,
  resetPasswordFormDataSchema,
  IPasswordResetEmailVerificationFormData,
  passwordResetEmailVerificationFormDataSchema,
  IPasswordResetTOTPFormData,
  passwordResetTotpFormDataSchema,
  IPasswordResetRecoveryCodeFormData,
  passwordResetRecoveryCodeFormDataSchema,
} from "./schema";

const emailVerificationBucket = new ExpiringTokenBucket<number>(5, 60 * 30);

export async function resetPasswordAction(formData: IResetPasswordFormData): Promise<IActionResult> {
    
  // Rate-limit client. Check that below threshold
  const belowRateLimit = await globalPOSTRateLimit();
	if (!belowRateLimit) {
		return genericTooManyRequestsResult();
	}

  // Check if user is eligible for this action
	const { session: passwordResetSession, user } = await validatePasswordResetSessionRequest();
	if (passwordResetSession === null) {
    return genericNotLoggedInErrorResult();
	}
	if (!passwordResetSession.emailVerified) {
		return genericForbiddenErrorResult();
	}
	if (user.registered2FA && !passwordResetSession.twoFactorVerified) {
		return genericForbiddenErrorResult();
	}
    
  // Validate data
  try {
    await resetPasswordFormDataSchema.parseAsync(formData);
  } catch {
    return genericValidationErrorResult();
  }

  // Make sure password is secure
	const strongPassword = await verifyPasswordStrength(formData.password);
	if (!strongPassword) {
		return genericErrorResult("För svagt lösenord");
	}

  // Delete password-reset session and update user
	await invalidateUserPasswordResetSessions(passwordResetSession.userId);
	await invalidateUserSessions(passwordResetSession.userId);
	await updateUserPassword(passwordResetSession.userId, formData.password);

	const sessionFlags: ISessionFlags = {
		twoFactorVerified: passwordResetSession.twoFactorVerified
	};

  // Create session and redirect user to home
	const sessionToken = generateSessionToken();
	const session = await createSession(sessionToken, user.id, sessionFlags);
	await setSessionTokenCookie(sessionToken, session.expiresAt);
	await deletePasswordResetSessionTokenCookie();
	return redirect(ROUTE_HOME);
}

export async function verifyPasswordResetEmailAction(formData: IPasswordResetEmailVerificationFormData): Promise<IActionResult> {
	
  // Rate-limit client. Check that below threshold
  const belowRateLimit = await globalPOSTRateLimit();
  if (!belowRateLimit) {
		return genericTooManyRequestsResult();
	}

  // Check if user is eligible for this action
	const { session } = await validatePasswordResetSessionRequest();
	if (session === null) {
    return genericNotLoggedInErrorResult();
	}
	if (session.emailVerified) {
		return genericForbiddenErrorResult();
	}
	if (!emailVerificationBucket.check(session.userId, 1)) {
		return genericTooManyRequestsResult();
	}

  // Validate data
  try {
    await passwordResetEmailVerificationFormDataSchema.parseAsync(formData);
  } catch {
    return genericValidationErrorResult();
  }

  // Thottle user
	if (!emailVerificationBucket.consume(session.userId, 1)) {
    return genericTooManyRequestsResult();
	}
	if (formData.code !== session.code) {
		return genericErrorResult("Ogiltig kod");
	}

  // Set email as verified
	emailVerificationBucket.reset(session.userId);
	await setPasswordResetSessionAsEmailVerified(session.id);
	const emailMatches = await setUserAsEmailVerifiedIfEmailMatches(session.userId, session.email);
	if (!emailMatches) {
    return genericErrorResult("Var snäll och starta om processen");
	}
  
  // Redirect user to 2FA setup
	return redirect(ROUTE_RESET_PASSWORD_2FA);
}

export async function verifyPasswordReset2FAWithTOTPAction(formData: IPasswordResetTOTPFormData): Promise<IActionResult> {
	 
  // Rate-limit client. Check that below threshold
  const belowRateLimit = await globalPOSTRateLimit();
  if (!belowRateLimit) {
		return genericTooManyRequestsResult();
	}

  // Check if user is eligible for this action
	const { session, user } = await validatePasswordResetSessionRequest();
	if (session === null) {
    return genericNotLoggedInErrorResult();
	}
	if (!session.emailVerified || !user.registered2FA || session.twoFactorVerified) {
		return genericForbiddenErrorResult();
	}
	if (!totpBucket.check(session.userId, 1)) {
		return genericTooManyRequestsResult();
	}

  // Validate data
  try {
    await passwordResetTotpFormDataSchema.parseAsync(formData);
  } catch {
    return genericValidationErrorResult();
  }
  
  // Get timed-one-time-password key for user
	const totpKey = await getUserTOTPKey(session.userId);
	if (totpKey === null) {
		return genericForbiddenErrorResult();
	}

  // Trottle user
	if (!totpBucket.consume(session.userId, 1)) {
		return genericTooManyRequestsResult();
	}

  // Verify code
	if (!verifyTOTP(totpKey, 30, 6, formData.code)) {
    return genericErrorResult("Ogilitig kod")
	}
	totpBucket.reset(session.userId);

  // Set password-reset session as verified and redirect to page where user may set new password
	await setPasswordResetSessionAs2FAVerified(session.id);
	return redirect(ROUTE_RESET_PASSWORD);
}

export async function verifyPasswordReset2FAWithRecoveryCodeAction(formData: IPasswordResetRecoveryCodeFormData): Promise<IActionResult> {
	
  // Rate-limit client. Check that below threshold
  const belowRateLimit = await globalPOSTRateLimit();
  if (!belowRateLimit) {
    return genericTooManyRequestsResult();
	}

  // Verify session
	const { session, user } = await validatePasswordResetSessionRequest();
	if (session === null) {
    return genericNotLoggedInErrorResult();
	}
	if (!session.emailVerified || !user.registered2FA || session.twoFactorVerified) {
		return genericForbiddenErrorResult();
	}

	if (!recoveryCodeBucket.check(session.userId, 1)) {
    return genericTooManyRequestsResult();
	}

  // Validate data
  try {
    await passwordResetRecoveryCodeFormDataSchema.parseAsync(formData);
  } catch {
    return genericValidationErrorResult()
  }

  // Throttle user
	if (!recoveryCodeBucket.consume(session.userId, 1)) {
    return genericTooManyRequestsResult();
	}

  // Validate recovery code
	const valid = await resetUser2FAWithRecoveryCode(session.userId, formData.code);
	if (!valid) {
    return genericErrorResult("Ogiltig kod");
	}
	recoveryCodeBucket.reset(session.userId);
	return redirect(ROUTE_RESET_PASSWORD);
}
