/***** IMPORTANT! ***************************************************************/
import "server-only";
/********************************************************************************/

import { cookies } from "next/headers";
import { encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import { IPasswordResetSession, IUser } from "@/lib/server/db/types";
import { generateRandomOTP, getCookieDomain } from "@/lib/server/utils";
import { sendMail } from "./email";
import * as Database from "@/lib/server/db/sql";
import { DB } from "./constants";
import { getOneUser } from "./user";
import { TblPasswordResetSession } from "@/lib/types/password-reset-session";

export async function createPasswordResetSession(token: string, userId: number, email: string) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: IPasswordResetSession = {
		id: sessionId,
		userId,
		email,
		expiresAt: new Date(Date.now() + 1000 * 60 * 10),
		code: generateRandomOTP(),
		emailVerified: false,
		twoFactorVerified: false
	};
  await Database.insertSingle<TblPasswordResetSession>({
    db: DB,
    table: "password_reset_session",
    columnData: {
      id: session.id,
      user_id: session.userId,
      email: session.email,
      expires_at: session.expiresAt,
      code: session.code,
      email_verified: session.emailVerified,
      two_factor_verified: session.twoFactorVerified,
    },
  });
	return session;
}

export async function validatePasswordResetSessionToken(token: string): Promise<IPasswordResetSessionValidationResult> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const user = await getOneUser({ passwordResetSessionId: sessionId });
  const session = await Database.getRecord<IPasswordResetSession>(`
    SELECT
      id,
      user_id AS userId,
      email,
      code,
      expires_at AS expiresAt,
      email_verified AS emailVerified,
      two_factor_verified AS twoFactorVerified
    FROM ${DB}.password_reset_session
    WHERE
      id = :sessionId
  `, { sessionId });

  if (!user || !session) {
    return { session: null, user: null };
  }
    
  // If session has expired we delete it and return null
  if (Date.now() >= session.expiresAt.getTime()) {
    await Database.deleteQuery(`
      DELETE FROM ${DB}.password_reset_session
      WHERE id = :sessionId 
    `, { sessionId });
    return { session: null, user: null };
  }
	return { session, user };
}

export async function setPasswordResetSessionAsEmailVerified(sessionId: string) {
  await Database.update<TblPasswordResetSession, string>({
    db: DB,
    table: "password_reset_session",
    idColumn: "id",
    id: sessionId,
    columnData: {
      email_verified: true,
    },
  });
}

export async function setPasswordResetSessionAs2FAVerified(sessionId: string) {
  await Database.update<TblPasswordResetSession, string>({
    db: DB,
    table: "password_reset_session",
    idColumn: "id",
    id: sessionId,
    columnData: {
      two_factor_verified: true,
    },
  });
}

export async function invalidateUserPasswordResetSessions(userId: number) {
  await Database.deleteQuery(`
    DELETE FROM ${DB}.password_reset_session
    WHERE user_id = :userId 
  `, { userId });
}

export async function validatePasswordResetSessionRequest() {
	const cookieStore = await cookies();
	const token = cookieStore.get("password_reset_session")?.value ?? null;
	if (token === null) {
		return { session: null, user: null };
	}
	const result = await validatePasswordResetSessionToken(token);
	if (result.session === null) {
		await deletePasswordResetSessionTokenCookie();
	}
	return result;
}

export async function setPasswordResetSessionTokenCookie(token: string, expiresAt: Date) {
	const cookieStore = await cookies();
  const cookieDomain = await getCookieDomain();
	cookieStore.set("password_reset_session", token, {
    domain: cookieDomain,
		expires: expiresAt,
		sameSite: "lax",
		httpOnly: true,
		path: "/",
		secure: process.env.NODE_ENV === "production"
	});
}

export async function deletePasswordResetSessionTokenCookie() {
	const cookieStore = await cookies();
  const cookieDomain = await getCookieDomain();
	cookieStore.set("password_reset_session", "", {
    domain: cookieDomain,
		maxAge: 0,
		sameSite: "lax",
		httpOnly: true,
		path: "/",
		secure: process.env.NODE_ENV === "production"
	});
}

export async function sendPasswordResetEmail(email: string, code: string) {
  sendMail({
    from: "info@kaxig.com",
    to: email,
    subject: "Your reset code",
    text: `Your reset code is ${code}`,
  });
}

export type IPasswordResetSessionValidationResult =
	| { session: IPasswordResetSession; user: IUser }
	| { session: null; user: null };
