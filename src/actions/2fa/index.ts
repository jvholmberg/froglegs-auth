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
import {
  ITwoFactorResetFormData,
  ITwoFactorSetupFormData,
  ITwoFactorVerifyFormData,
  twoFactorResetFormDataSchema,
  twoFactorSetupFormDataSchema,
  twoFactorVerifyFormDataSchema,
} from "@/actions/2fa/schema";
import { recoveryCodeBucket, resetUser2FAWithRecoveryCode, totpBucket } from "@/lib/server/2fa";
import { ROUTE_RECOVERY_CODE, ROUTE_2FA_SETUP, ROUTE_SETTINGS } from "@/lib/client/constants";

const totpUpdateBucket = new RefillingTokenBucket<number>(3, 60 * 10);

export async function setup2FAAction(formData: ITwoFactorSetupFormData): Promise<ActionResult> {
	const belowRateLimit = await globalPOSTRateLimit();
  if (!belowRateLimit) {
		return {
			message: "För många anrop"
		};
	}
	const { session, user } = await getCurrentSession();
	if (session === null) {
		return {
			message: "Not authenticated"
		};
	}
	if (!user.emailVerified) {
		return {
			message: "Forbidden"
		};
	}
	if (user.registered2FA && !session.twoFactorVerified) {
		return {
			message: "Forbidden"
		};
	}
	if (!totpUpdateBucket.check(user.id, 1)) {
		return {
			message: "För många anrop"
		};
	}
  
  try {
    await twoFactorSetupFormDataSchema.parseAsync(formData);
  } catch {
    return {
      message: "Ogiltig data. Kontrollera att uppgifter är korrekta",
    };
  }
	let key: Uint8Array;
  
	if (formData.key.length !== 28) {
		return {
			message: "Invalid key"
		};
	}
	try {
		key = decodeBase64(formData.key);
	} catch {
		return {
			message: "Invalid key"
		};
	}
	if (key.byteLength !== 20) {
		return {
			message: "Invalid key"
		};
	}
	if (!totpUpdateBucket.consume(user.id, 1)) {
		return {
			message: "För många anrop"
		};
	}
	if (!verifyTOTP(key, 30, 6, formData.code)) {
		return {
			message: "Invalid code"
		};
	}
	await updateUserTOTPKey(session.userId, key);
	await setSessionAs2FAVerified(session.id);
	return redirect(ROUTE_RECOVERY_CODE);
}

export async function verify2FAAction(formData: ITwoFactorVerifyFormData): Promise<ActionResult> {
	const belowRateLimit = await globalPOSTRateLimit();
  if (!belowRateLimit) {
		return {
			message: "För många anrop"
		};
	}
	const { session, user } = await getCurrentSession();
	if (session === null) {
		return {
			message: "Not authenticated"
		};
	}
	if (!user.emailVerified || !user.registered2FA || session.twoFactorVerified) {
		return {
			message: "Forbidden"
		};
	}
	if (!totpBucket.check(user.id, 1)) {
		return {
			message: "För många anrop"
		};
	}

  try {
    await twoFactorVerifyFormDataSchema.parseAsync(formData);
  } catch {
    return {
      message: "Ogiltig data. Kontrollera att uppgifter är korrekta",
    };
  }

	if (!totpBucket.consume(user.id, 1)) {
		return {
			message: "För många anrop"
		};
	}
	const totpKey = await getUserTOTPKey(user.id);
	if (totpKey === null) {
		return {
			message: "Forbidden"
		};
	}
	if (!verifyTOTP(totpKey, 30, 6, formData.code)) {
		return {
			message: "Invalid code"
		};
	}
	totpBucket.reset(user.id);
	await setSessionAs2FAVerified(session.id);
	return redirect(ROUTE_SETTINGS);
}

export async function reset2FAAction(formData: ITwoFactorResetFormData): Promise<ActionResult> {
	const { session, user } = await getCurrentSession();
	if (session === null) {
		return {
			message: "Not authenticated"
		};
	}
	if (!user.emailVerified || !user.registered2FA || session.twoFactorVerified) {
		return {
			message: "Forbidden"
		};
	}
	if (!recoveryCodeBucket.check(user.id, 1)) {
		return {
			message: "Too many requests"
		};
	}

  try {
    await twoFactorResetFormDataSchema.parseAsync(formData);
  } catch {
    return {
      message: "Ogiltig data. Kontrollera att uppgifter är korrekta",
    };
  }

	if (!recoveryCodeBucket.consume(user.id, 1)) {
		return {
			message: "Too many requests"
		};
	}
	const valid = await resetUser2FAWithRecoveryCode(user.id, formData.code);
	if (!valid) {
		return {
			message: "Invalid recovery code"
		};
	}
	recoveryCodeBucket.reset(user.id);
	return redirect(ROUTE_2FA_SETUP);
}

interface ActionResult {
	message: string;
}


interface ActionResult {
	message: string;
}


interface ActionResult {
	message: string;
}
