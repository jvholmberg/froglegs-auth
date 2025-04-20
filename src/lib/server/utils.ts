/***** IMPORTANT! ***************************************************************/
import "server-only";
/********************************************************************************/

import { encodeBase32UpperCaseNoPadding } from "@oslojs/encoding";
import { IActionResult } from "@/lib/client/types";
import { IUser } from "./db/types";
import { NextResponse } from "next/server";
import { TWO_FACTOR_MANDATORY } from "../client/constants";
import { ISessionValidationResult } from "./session";
import { headers } from "next/headers";
import { Role } from "@/lib/types/role";

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

export function genericSuccesResult(
  title: string | null | undefined,
  message: string
): IActionResult {
  return {
    error: undefined,
    notification: {
      color: "green",
      title: title || "Dina ändringar har sparats",
      message,
    }
  };
}

export function genericTooManyRequestsResult(): IActionResult {
  return {
    error: new Error(),
    notification: {
      color: "red",
      title: "Något gick fel!",
      message: "För många anrop. Vänta en stund innan du försöker på nytt",
    }
  };
}

export function genericValidationErrorResult(): IActionResult {
  return {
    error: new Error(),
    notification: {
      color: "red",
      title: "Något gick fel!",
      message: "Validering av data misslyckades",
    }
  };
}

export function genericErrorResult(message?: string): IActionResult {
  return {
    error: new Error(),
    notification: {
      color: "red",
      title: "Ops! Något gick fel!",
      message: message || "Ett okänt fel inträffade",
    }
  };
}

export function genericNoAccountErrorResult(): IActionResult {
  return {
    error: new Error(),
    notification: {
      color: "red",
      title: "Något gick fel!",
      message: "Inget konto kunde hittas",
    }
  };
}

export function genericNotLoggedInErrorResult(): IActionResult {
  return {
    error: new Error(),
    notification: {
      color: "red",
      title: "Något gick fel!",
      message: "Du är inte inloggad",
    }
  };
}

export function genericForbiddenErrorResult(): IActionResult {
  return {
    error: new Error(),
    notification: {
      color: "red",
      title: "Något gick fel!",
      message: "Du saknar behörighet",
    }
  };
}

export function checkHasUserRole(allowedUserRoles: Role[], user: IUser | null): boolean {
  return user?.role
    ? allowedUserRoles.includes(user.role)
    : false;
}

export function checkHasAppUserRole(
  appId: number,
  allowedAppUserRoles: Role[],
  user: IUser | null,
): boolean {
  const appUserRole = user?.apps.find((e) => appId !== e.appId)?.role;
  return appUserRole
    ? allowedAppUserRoles.includes(appUserRole)
    : false;
}

export function checkApiRequestLoggedIn<T>(
  emptyResponse: T,
  { user, session }: ISessionValidationResult,
) {

  // Check if user is logged in
  if (!session) {
    return NextResponse.json(emptyResponse, {
      status: 401,
      statusText: "Inte inloggad!",
    });
  }
  if (!user) {
    return NextResponse.json(emptyResponse, {
      status: 401,
      statusText: "Inte inloggad!",
    });
  }

  // Check if account is setup correctly
  if (!user.emailVerified) {
    return NextResponse.json(emptyResponse, {
      status: 403,
      statusText: "Du har inte verifierat din e-post!!",
    });
  }
  if (TWO_FACTOR_MANDATORY) {
    if (!user.registered2FA) {
      return NextResponse.json(emptyResponse, {
        status: 403,
        statusText: "Du saknar 2-faktors autentisering på ditt konto!",
      });
    }
    if (!session.twoFactorVerified) {
      return NextResponse.json(emptyResponse, {
        status: 401,
        statusText: "Du har inte autentiserat dig med din 2-faktors autentisering!",
      });
    }
  } else {
    if (user.registered2FA && !session.twoFactorVerified) {
      return NextResponse.json(emptyResponse, {
        status: 401,
        statusText: "Du har inte autentiserat dig med din 2-faktors autentisering!",
      });
    }
  }

  return null;
}

export async function getCookieDomain() {
  const headersList = await headers();
	const hostHeader = headersList.get("X-Forwarded-Host");

  let ret = "";
  if (hostHeader) {
    ret = hostHeader
      .split(".")
      .reduce((previousValue, currentValue, currentIndex) => {
        if (currentIndex !== 0) {
          previousValue += `.${currentValue}`;
        }
        return previousValue;
      }, "");
  } else {
    ret = hostHeader ?? "localhost";
  }

  return ret;
}

