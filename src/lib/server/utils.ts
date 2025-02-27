/***** IMPORTANT! ***************************************************************/
import "server-only";
/********************************************************************************/

import { encodeBase32UpperCaseNoPadding } from "@oslojs/encoding";
import { ERR_NOT_SIGNED_IN, ERR_NO_ACCOUNT, ERR_VALIDATION } from "./constants";
import { getCurrentSession } from "./session";
import { IActionResultExtended } from "@/actions/types";

export function generateRandomOTP(): string {
	const bytes = new Uint8Array(5);
	crypto.getRandomValues(bytes);
	const code = encodeBase32UpperCaseNoPadding(bytes);
	return code;
}

export function generateRandomRecoveryCode(): string {
	const recoveryCodeBytes = new Uint8Array(10);
	crypto.getRandomValues(recoveryCodeBytes);
	const recoveryCode = encodeBase32UpperCaseNoPadding(recoveryCodeBytes);
	return recoveryCode;
}

export async function checkSignedIn(): Promise<IActionResultExtended | undefined> {
  const { session, user } = await getCurrentSession();
  if (session === null) {
    return {
      error: new Error(),
      notification: {
        color: "red",
        title: "Något gick fel!",
        message: ERR_NOT_SIGNED_IN,
      }
    };
  }
  if (user === null) {
    return {
      error: new Error(),
      notification: {
        color: "red",
        title: "Någt gick fel!",
        message: ERR_NO_ACCOUNT,
      }
    };
  }
}

export function genericValidationErrorResult(): IActionResultExtended {
  return {
    error: new Error(),
    notification: {
      color: "red",
      title: "Något gick fel!",
      message: ERR_VALIDATION,
    }
  };
}

export function genericErrorResult(): IActionResultExtended {
  return {
    error: new Error(),
    notification: {
      color: "red",
      title: "Ops! Något gick fel!",
      message: "Ett okänt fel inträffade",
    }
  };
}

export function genericSuccesResult(message: string): IActionResultExtended {
  return {
    error: undefined,
    notification: {
      color: "green",
      title: "Dina ändringar har sparats",
      message,
    }
  };
}
