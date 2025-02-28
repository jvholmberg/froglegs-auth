/***** IMPORTANT! ***************************************************************/
import "server-only";
/********************************************************************************/

import { encodeBase32UpperCaseNoPadding } from "@oslojs/encoding";
import { getCurrentSession } from "./session";
import { IActionResultExtended } from "@/actions/types";
import { IUser, UserAppRole, UserRole } from "./user";
import { ROUTE_2FA, ROUTE_LANDING, ROUTE_SETTINGS, ROUTE_VERIFY_EMAIL } from "../client/constants";

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

export function checkHasUserRole(allowedUserRoles: UserRole[], user: IUser): boolean {
  return user.role
    ? allowedUserRoles.includes(user.role)
    : false;
}

export function checkHasAppUserRole(
  appId: number,
  externalOrganizationId: string | null,
  allowedAppUserRoles: UserAppRole[],
  user: IUser,
): boolean {
  const appUserRole = user.apps.find((e) => {
    if (appId === e.appId) { return false; }
    if (externalOrganizationId === e.externalId) { return false; }
    return true;
  })?.role;
  return appUserRole
    ? allowedAppUserRoles.includes(appUserRole)
    : false;
}

export async function checkSignedIn(): Promise<IActionResultExtended | undefined> {
  const { session, user } = await getCurrentSession();
  if (session === null) {
    return genericNotLoggedInErrorResult();
  }
  if (user === null) {
    return genericNoAccountErrorResult();
  }
  if (!user.emailVerified) {
    return genericForbiddenErrorResult();
  }
  if (user.registered2FA && !session.twoFactorVerified) {
    return genericForbiddenErrorResult();
  }
}

export async function shouldRedirectDueToUserRole(allowedRoles: UserRole[]): Promise<string | null> {
  const { session, user } = await getCurrentSession();
  if (session === null) {
    return ROUTE_LANDING;
  }
  if (user === null) {
    return ROUTE_LANDING;
  }
  if (!user.emailVerified) {
    return ROUTE_VERIFY_EMAIL;
  }
  if (user.registered2FA && !session.twoFactorVerified) {
    return ROUTE_2FA;
  }

  // Now check roles
  if (!checkHasUserRole(allowedRoles, user)) {
    return ROUTE_SETTINGS;
  }
  
  return null;
}
