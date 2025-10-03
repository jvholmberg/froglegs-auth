/***** IMPORTANT! ***************************************************************/
import "server-only";
/********************************************************************************/

import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";

import type { ISessionFlags } from "@/lib/server/db/types";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import db, { schema } from "@/lib/server/db";
import { getOneUser } from "./user";
import { getCookieDomain } from "./utils";
import { and, eq } from "drizzle-orm";

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

export async function validateSessionToken(token: string, clientIp: string | null) {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const user = await getOneUser({ sessionId });

  const [session] = await db
    .select({
      id: schema.sessionTable.id,
      userId: schema.sessionTable.userId,
      expiresAt: schema.sessionTable.expiresAt,
      twoFactorVerified: schema.sessionTable.twoFactorVerified,
    })
    .from(schema.sessionTable)
    .where(and(
      eq(schema.sessionTable.id, sessionId),
      clientIp ? eq(schema.sessionTable.ipNumber, clientIp) : undefined
    ));

  if (!user || !session) {
    return { session: null, user: null };
  }
  
  // If session has expired we delete it and return null
  if (Date.now() >= session.expiresAt.getTime()) {
    await db
      .delete(schema.sessionTable)
      .where(eq(schema.sessionTable.id, sessionId));
    return { session: null, user: null };
  }

  // Subtract graceperiod from Now() to check if session is inside of graceperiod
  const gracePeriodInMs = 1000 * 60 * 60 * 24 * 15;
  if (Date.now() >= session.expiresAt.getTime() - gracePeriodInMs) {

    // Add graceperiod onto session expiry to prevent it from expire
    session.expiresAt = new Date(Date.now() + gracePeriodInMs);
    await db
      .update(schema.sessionTable)
      .set({
        expiresAt: session.expiresAt,
      })
      .where(eq(schema.sessionTable.id, sessionId));
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
  await db
    .delete(schema.sessionTable)
    .where(eq(schema.sessionTable.id, sessionId));
}

export async function invalidateUserSessions(userId: number) {
  await db
    .delete(schema.sessionTable)
    .where(eq(schema.sessionTable.userId, userId));
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
  const ip = await getForwardedFor();
  
  const session = await db.insert(schema.sessionTable).values({
    id: sessionId,
    userId,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    ipNumber: ip,
    twoFactorVerified: flags.twoFactorVerified,
  }).returning();

	return session;
}

export async function setSessionAs2FAVerified(sessionId: string) {
  await db
    .update(schema.sessionTable)
    .set({
      twoFactorVerified: true,
    })
    .where(eq(schema.sessionTable.id, sessionId));
}
