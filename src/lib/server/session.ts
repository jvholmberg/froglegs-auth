/***** IMPORTANT! ***************************************************************/
import "server-only";
/********************************************************************************/

import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";

import type { ISessionFlags, ISession, IUser } from "@/lib/server/db/types";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import * as Database from "@/lib/server/db/sql";
import { DB } from "@/lib/server/constants";
import { getOneUser } from "./user";
import { getCookieDomain } from "./utils";
import { TblSession } from "@/lib/types/session";

export async function getForwardedFor(): Promise<string> {
  const headerStore = await headers();
  const headerName = "X-Forwarded-For";
  const ip = (headerStore.get(headerName) ?? "127.0.0.1").split(",")[0];
  return ip || "";
}

export async function getBearerToken(): Promise<string | null> {
  const headerStore = await headers();
  const authorizationHeader = headerStore.get("Authorization");
  const token = authorizationHeader?.replace("Bearer ", "") || null;
  return token;
}

export async function validateSessionToken(token: string, clientIp: string | null): Promise<ISessionValidationResult> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const user = await getOneUser({ sessionId });

  const session = await Database.getRecord<ISession & ISessionFlags>(`
    SELECT
      id,
      user_id AS userId,
      expires_at AS expiresAt,
      two_factor_verified AS twoFactorVerified
    FROM ${DB}.session
    WHERE
      id = :sessionId
      ${clientIp ? "AND ip_number = :clientIp" : ""}
  `, { sessionId, clientIp });

  if (!user || !session) {
    return { session: null, user: null };
  }
  
  // If session has expired we delete it and return null
  if (Date.now() >= session.expiresAt.getTime()) {
    await Database.deleteQuery(`
      DELETE FROM ${DB}.session
      WHERE id = :sessionId 
    `, { sessionId });
    return { session: null, user: null };
  }

  // Subtract graceperiod from Now() to check if session is inside of graceperiod
  const gracePeriodInMs = 1000 * 60 * 60 * 24 * 15;
  if (Date.now() >= session.expiresAt.getTime() - gracePeriodInMs) {

    // Add graceperiod onto session expiry to prevent it from expire
    session.expiresAt = new Date(Date.now() + gracePeriodInMs);
    await Database.update<TblSession, string>({
      db: DB,
      table: "session",
      idColumn: "id",
      id: sessionId,
      columnData: { expires_at: session.expiresAt }
    });
  }

	return { session, user };
}

export const getCurrentSession = cache(async (useAuthorizationHeader: boolean = false) => {
  let token: string | null;

  // Get token
  if (useAuthorizationHeader) {
    token = await getBearerToken();
  } else {
    const cookieStore = await cookies();
    token = cookieStore.get("session")?.value || null;
  }

	if (token === null) {
		return { user: null, session: null };
	}

  // If we authenticate using Bearer token skip ip check due to high probability of
  // it being another internal app.
  const clientIp = !useAuthorizationHeader
    ? await getForwardedFor()
    : null;

	const result = await validateSessionToken(token, clientIp);
	return result;
});

export async function invalidateSession(sessionId: string) {
  await Database.deleteQuery(`
    DELETE FROM ${DB}.session
    WHERE id = :sessionId 
  `, { sessionId });
}

export async function invalidateUserSessions(userId: number) {
  await Database.deleteQuery(`
    DELETE FROM ${DB}.session
    WHERE user_id = :userId 
  `, { userId });
}

export async function setSessionTokenCookie(token: string, expiresAt: Date) {
	const cookieStore = await cookies();
  const cookieDomain = await getCookieDomain();
	cookieStore.set("session", token, {
    domain: cookieDomain,
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		expires: expiresAt,
		path: "/"
	});
}

export async function deleteSessionTokenCookie() {
	const cookieStore = await cookies();
  const cookieDomain = await getCookieDomain();
	cookieStore.set("session", "", {
    domain: cookieDomain,
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		maxAge: 0,
		path: "/"
	});
}

export function generateSessionToken() {
	const tokenBytes = new Uint8Array(20);
	crypto.getRandomValues(tokenBytes);
	const token = encodeBase32LowerCaseNoPadding(tokenBytes).toLowerCase();
	return token;
}

export async function createSession(token: string, userId: number, flags: ISessionFlags) {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: ISession = {
    id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    twoFactorVerified: flags.twoFactorVerified,
	};
  const ip = await getForwardedFor();
  
  await Database.insertSingle<TblSession>({
    db: DB,
    table: "session",
    columnData: {
      id: sessionId,
      user_id: userId,
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      ip_number: ip,
      two_factor_verified: flags.twoFactorVerified,
    },
  })
	return session;
}

export async function setSessionAs2FAVerified(sessionId: string) {
  await Database.update<TblSession, string>({
    db: DB,
    table: "session",
    idColumn: "id",
    id: sessionId,
    columnData: {
      two_factor_verified: true,
    }
  });
}

export type ISessionValidationResult =
	| { session: ISession; user: IUser }
	| { session: null; user: null };
