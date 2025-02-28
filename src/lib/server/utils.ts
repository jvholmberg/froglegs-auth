/***** IMPORTANT! ***************************************************************/
import "server-only";
/********************************************************************************/

import { encodeBase32UpperCaseNoPadding } from "@oslojs/encoding";
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

export function genericTooManyRequestsResult(): IActionResultExtended {
  return {
    error: new Error(),
    notification: {
      color: "red",
      title: "Något gick fel!",
      message: "För många anrop. Vänta en stund innan du försöker på nytt",
    }
  };
}

export function genericValidationErrorResult(): IActionResultExtended {
  return {
    error: new Error(),
    notification: {
      color: "red",
      title: "Något gick fel!",
      message: "Validering av data misslyckades",
    }
  };
}

export function genericErrorResult(message?: string): IActionResultExtended {
  return {
    error: new Error(),
    notification: {
      color: "red",
      title: "Ops! Något gick fel!",
      message: message || "Ett okänt fel inträffade",
    }
  };
}

export function genericNoAccountErrorResult(): IActionResultExtended {
  return {
    error: new Error(),
    notification: {
      color: "red",
      title: "Något gick fel!",
      message: "Inget konto kunde hittas",
    }
  };
}

export function genericNotLoggedInErrorResult(): IActionResultExtended {
  return {
    error: new Error(),
    notification: {
      color: "red",
      title: "Något gick fel!",
      message: "Du är inte inloggad",
    }
  };
}

export function genericForbiddenErrorResult(): IActionResultExtended {
  return {
    error: new Error(),
    notification: {
      color: "red",
      title: "Något gick fel!",
      message: "Du saknar behörighet",
    }
  };
}

export async function checkSignedIn(options: {
  emailVerified?: boolean;
  twoFactorVerified?: boolean;
}): Promise<IActionResultExtended | undefined> {
  const { session, user } = await getCurrentSession();
  if (session === null) {
    return genericNotLoggedInErrorResult();
  }
  if (user === null) {
    return genericNoAccountErrorResult();
  }
  // Additional checks
  if (options) {
    const { emailVerified, twoFactorVerified } = options;
    if (emailVerified && !user.emailVerified) {
      return genericForbiddenErrorResult();
    }
    if (twoFactorVerified && user.registered2FA && session.twoFactorVerified) {
      return genericForbiddenErrorResult();
    }
  }
}
