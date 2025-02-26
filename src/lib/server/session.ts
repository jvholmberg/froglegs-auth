/***** IMPORTANT! ***************************************************************/
import "server-only";
/********************************************************************************/

import { eq } from "drizzle-orm";
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";

import { db, userTable, sessionTable, userDetailsTable } from "@/lib/server/db/schema";
import type { TblSession } from "@/lib/server/db/types";
import { cache } from "react";
import { cookies } from "next/headers";
import { IUser } from "@/lib/server/user";

export async function validateSessionToken(token: string): Promise<ISessionValidationResult> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const result = await db
		.select({
      user: userTable,
      userDetails: userDetailsTable,
      session: sessionTable,
    })
		.from(sessionTable)
		.innerJoin(userTable, eq(sessionTable.userId, userTable.id))
		.leftJoin(userDetailsTable, eq(sessionTable.userId, userDetailsTable.userId))
		.where(eq(sessionTable.id, sessionId));
	if (result.length < 1) {
		return { session: null, user: null };
	}
  const { session } = result[0];
  const user: IUser = {
		id: result[0].user.id,
		email: result[0].user.email,
    firstName: result[0].userDetails?.firstName || null,
    lastName: result[0].userDetails?.lastName || null,
		emailVerified: result[0].user.emailVerified,
		registered2FA: result[0].user.totpKey !== null,
	};
	if (Date.now() >= session.expiresAt.getTime()) {
		await db.delete(sessionTable).where(eq(sessionTable.id, session.id));
		return { session: null, user: null };
	}
	if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
		session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
		await db
			.update(sessionTable)
			.set({
				expiresAt: session.expiresAt
			})
			.where(eq(sessionTable.id, session.id));
	}
	return { session, user };
}

export const getCurrentSession = cache(async () => {
	const cookieStore = await cookies();
	const token = cookieStore.get("session")?.value ?? null;
	if (token === null) {
		return { session: null, user: null };
	}
	const result = await validateSessionToken(token);
	return result;
});

export async function invalidateSession(sessionId: string) {
	await db.delete(sessionTable).where(eq(sessionTable.id, sessionId));
}

export async function invalidateUserSessions(userId: number) {
	await db.delete(sessionTable).where(eq(sessionTable.userId, userId));
}

export async function setSessionTokenCookie(token: string, expiresAt: Date) {
	const cookieStore = await cookies();
	cookieStore.set("session", token, {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		expires: expiresAt,
		path: "/"
	});
}

export async function deleteSessionTokenCookie() {
	const cookieStore = await cookies();
	cookieStore.set("session", "", {
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
	const session: TblSession = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    twoFactorVerified: flags.twoFactorVerified,
	};
	await db.insert(sessionTable).values(session);
	return session;
}

export async function setSessionAs2FAVerified(sessionId: string) {
	await db.update(sessionTable)
    .set({ twoFactorVerified: true })
    .where(eq(sessionTable.id, sessionId));
}

export interface ISessionFlags {
	twoFactorVerified: boolean;
}

export type ISessionValidationResult =
	| { session: TblSession; user: IUser }
	| { session: null; user: null };
