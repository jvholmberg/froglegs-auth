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
import {
  IPasswordResetEmailVerificationFormData,
  IResetPasswordFormData,
  IPasswordResetRecoveryCodeFormData,
  passwordResetEmailVerificationFormDataSchema,
  resetPasswordFormDataSchema,
  passwordResetRecoveryCodeFormDataSchema,
  passwordResetTotpFormDataSchema,
  IPasswordResetTOTPFormData
} from "@/actions/reset-password/schema";
import { ExpiringTokenBucket } from "@/lib/server/rate-limit";
import { recoveryCodeBucket, resetUser2FAWithRecoveryCode, totpBucket } from "@/lib/server/2fa";
import { verifyTOTP } from "@oslojs/otp";
import { ROUTE_SETTINGS, ROUTE_RESET_PASSWORD, ROUTE_RESET_PASSWORD_2FA } from "@/lib/client/constants";
import { IActionResult, IActionResultExtended } from "../types";
import { ISessionFlags } from "@/lib/server/db/types";
import { genericErrorResult, genericForbiddenErrorResult, genericNotLoggedInErrorResult, genericTooManyRequestsResult, genericValidationErrorResult } from "@/lib/server/utils";

const emailVerificationBucket = new ExpiringTokenBucket<number>(5, 60 * 30);

export async function resetPasswordAction(formData: IResetPasswordFormData): Promise<IActionResult> {
  const belowRateLimit = await globalPOSTRateLimit();
	if (!belowRateLimit) {
		return {
			message: "Too many requests"
		};
	}
	const { session: passwordResetSession, user } = await validatePasswordResetSessionRequest();
	if (passwordResetSession === null) {
		return {
			message: "Not authenticated"
		};
	}
	if (!passwordResetSession.emailVerified) {
		return {
			message: "Forbidden"
		};
	}
	if (user.registered2FA && !passwordResetSession.twoFactorVerified) {
		return {
			message: "Forbidden"
		};
	}
      
  try {
    await resetPasswordFormDataSchema.parseAsync(formData);
  } catch {
    return {
      message: "Ogiltig data. Kontrollera att uppgifter är korrekta",
    };
  }

	const strongPassword = await verifyPasswordStrength(formData.password);
	if (!strongPassword) {
		return {
			message: "Weak password"
		};
	}
	await invalidateUserPasswordResetSessions(passwordResetSession.userId);
	await invalidateUserSessions(passwordResetSession.userId);
	await updateUserPassword(passwordResetSession.userId, formData.password);

	const sessionFlags: ISessionFlags = {
		twoFactorVerified: passwordResetSession.twoFactorVerified
	};
	const sessionToken = generateSessionToken();
	const session = await createSession(sessionToken, user.id, sessionFlags);
	await setSessionTokenCookie(sessionToken, session.expiresAt);
	await deletePasswordResetSessionTokenCookie();
	return redirect(ROUTE_SETTINGS);
}

export async function verifyPasswordResetEmailAction(formData: IPasswordResetEmailVerificationFormData): Promise<IActionResult> {
	const belowRateLimit = await globalPOSTRateLimit();
  if (!belowRateLimit) {
		return {
			message: "Too many requests"
		};
	}
	const { session } = await validatePasswordResetSessionRequest();
	if (session === null) {
		return {
			message: "Not authenticated"
		};
	}
	if (session.emailVerified) {
		return {
			message: "Forbidden"
		};
	}
	if (!emailVerificationBucket.check(session.userId, 1)) {
		return {
			message: "Too many requests"
		};
	}

  try {
    await passwordResetEmailVerificationFormDataSchema.parseAsync(formData);
  } catch {
    return {
      message: "Ogiltig data. Kontrollera att uppgifter är korrekta",
    };
  }

	if (!emailVerificationBucket.consume(session.userId, 1)) {
		return { message: "Too many requests" };
	}
	if (formData.code !== session.code) {
		return {
			message: "Incorrect code"
		};
	}
	emailVerificationBucket.reset(session.userId);
	await setPasswordResetSessionAsEmailVerified(session.id);
	const emailMatches = await setUserAsEmailVerifiedIfEmailMatches(session.userId, session.email);
	if (!emailMatches) {
		return {
			message: "Please restart the process"
		};
	}
	return redirect(ROUTE_RESET_PASSWORD_2FA);
}

export async function verifyPasswordReset2FAWithTOTPAction(formData: IPasswordResetTOTPFormData): Promise<IActionResult> {
	const belowRateLimit = await globalPOSTRateLimit();
  if (!belowRateLimit) {
		return {
			message: "Too many requests"
		};
	}
	const { session, user } = await validatePasswordResetSessionRequest();
	if (session === null) {
		return {
			message: "Not authenticated"
		};
	}
	if (!session.emailVerified || !user.registered2FA || session.twoFactorVerified) {
		return {
			message: "Forbidden"
		};
	}
	if (!totpBucket.check(session.userId, 1)) {
		return {
			message: "Too many requests"
		};
	}

  try {
    await passwordResetTotpFormDataSchema.parseAsync(formData);
  } catch {
    return {
      message: "Ogiltig data. Kontrollera att uppgifter är korrekta",
    };
  }
  
	const totpKey = await getUserTOTPKey(session.userId);
	if (totpKey === null) {
		return {
			message: "Forbidden"
		};
	}
	if (!totpBucket.consume(session.userId, 1)) {
		return {
			message: "Too many requests"
		};
	}
	if (!verifyTOTP(totpKey, 30, 6, formData.code)) {
		return {
			message: "Invalid code"
		};
	}
	totpBucket.reset(session.userId);
	await setPasswordResetSessionAs2FAVerified(session.id);
	return redirect(ROUTE_RESET_PASSWORD);
}

export async function verifyPasswordReset2FAWithRecoveryCodeAction(formData: IPasswordResetRecoveryCodeFormData): Promise<IActionResultExtended> {
	const belowRateLimit = await globalPOSTRateLimit();
  if (!belowRateLimit) {
    return genericTooManyRequestsResult();
	}
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

  try {
    await passwordResetRecoveryCodeFormDataSchema.parseAsync(formData);
  } catch {
    return genericValidationErrorResult()
  }

	if (!recoveryCodeBucket.consume(session.userId, 1)) {
    return genericTooManyRequestsResult();
	}
	const valid = await resetUser2FAWithRecoveryCode(session.userId, formData.code);
	if (!valid) {
    return genericErrorResult("Ogiltig kod");
	}
	recoveryCodeBucket.reset(session.userId);
	return redirect(ROUTE_RESET_PASSWORD);
}
