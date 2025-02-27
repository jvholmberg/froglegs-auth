/***** IMPORTANT! ***************************************************************/
"use server";
import "server-only";
/********************************************************************************/

import { verifyPasswordHash } from "@/lib/server/password";
import { RefillingTokenBucket, Throttler } from "@/lib/server/rate-limit";
import { createSession, generateSessionToken, ISessionFlags, setSessionTokenCookie } from "@/lib/server/session";
import { getUserFromEmail, getUserPasswordHash } from "@/lib/server/user";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { globalPOSTRateLimit } from "@/lib/server/request";
import { ISignInFormData, signInFormDataSchema } from "./schema";
import { ROUTE_2FA, ROUTE_2FA_SETUP, ROUTE_VERIFY_EMAIL } from "@/lib/client/constants";
import { IActionResult } from "../types";

const throttler = new Throttler<number>([1, 2, 4, 8, 16, 30, 60, 180, 300]);
const ipBucket = new RefillingTokenBucket<string>(20, 1);

export async function signInAction(formData: ISignInFormData): Promise<IActionResult> {
  const belowRateLimit = await globalPOSTRateLimit();
	if (!belowRateLimit) {
		return {
      message: "För många anrop",
		};
	}

  // TODO: Assumes X-Forwarded-For is always included.
  const headerStore = await headers();
  const clientIP = headerStore.get("X-Forwarded-For");
  if (clientIP !== null && !ipBucket.check(clientIP, 1)) {
    return {
      message: "För många anrop",
    };
  }
  
  try {
    await signInFormDataSchema.parseAsync(formData);
  } catch {
    return {
      message: "Ogiltig data. Kontrollera att uppgifter är korrekta",
    };
  }

	const user = await getUserFromEmail(formData.email);
	if (user === null) {
		return {
			message: "Inget konto kunde hittas"
		};
	}
	if (clientIP !== null && !ipBucket.consume(clientIP, 1)) {
		return {
      message: "För många anrop",
		};
	}
	if (!throttler.consume(user.id)) {
		return {
      message: "För många anrop",
		};
	}
	const passwordHash = await getUserPasswordHash(user.id);
	const validPassword = await verifyPasswordHash(passwordHash, formData.password);
	if (!validPassword) {
		return {
			message: "Ogiltigt lösenord"
		};
	}
	throttler.reset(user.id);
	const sessionFlags: ISessionFlags = {
		twoFactorVerified: false
	};
	const sessionToken = generateSessionToken();
	const session = await createSession(sessionToken, user.id, sessionFlags);
	setSessionTokenCookie(sessionToken, session.expiresAt);

	if (!user.emailVerified) {
		return redirect(ROUTE_VERIFY_EMAIL);
	}
	if (!user.registered2FA) {
		return redirect(ROUTE_2FA_SETUP);
	}
	return redirect(ROUTE_2FA);
}
