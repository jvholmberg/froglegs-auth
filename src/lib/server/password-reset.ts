/***** IMPORTANT! ***************************************************************/
import "server-only";
/********************************************************************************/

import { cookies } from "next/headers";
import { encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import { IPasswordResetSession, IUser } from "@/lib/server/db/types";
import { generateRandomOTP, getCookieDomain } from "@/lib/server/utils";
import { sendMail } from "./email";
import db, { schema } from "@/lib/server/db";
import { eq } from "drizzle-orm";
import { getOneUser } from "./user";

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
  await db
    .insert(schema.passwordResetSessionTable)
    .values({
      id: session.id,
      userId: session.userId,
      email: session.email,
      expiresAt: session.expiresAt,
      code: session.code,
      emailVerified: session.emailVerified,
      twoFactorVerified: session.twoFactorVerified,
    });
	return session;
}

export async function validatePasswordResetSessionToken(token: string): Promise<IPasswordResetSessionValidationResult> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const user = await getOneUser({ passwordResetSessionId: sessionId });
  
  const [session] = await db
    .select({
      id: schema.passwordResetSessionTable.id,
      userId: schema.passwordResetSessionTable.userId,
      email: schema.passwordResetSessionTable.email,
      code: schema.passwordResetSessionTable.code,
      expiresAt: schema.passwordResetSessionTable.expiresAt,
      emailVerified: schema.passwordResetSessionTable.emailVerified,
      twoFactorVerified: schema.passwordResetSessionTable.twoFactorVerified,
    })
    .from(schema.passwordResetSessionTable)
    .where(eq(schema.passwordResetSessionTable.id, sessionId))
    .limit(1);

  if (!user || !session) {
    return { session: null, user: null };
  }
    
  // If session has expired we delete it and return null
  if (Date.now() >= session.expiresAt.getTime()) {
    await db
      .delete(schema.passwordResetSessionTable)
      .where(eq(schema.passwordResetSessionTable.id, sessionId));

    return { session: null, user: null };
  }
	return { session, user };
}

export async function setPasswordResetSessionAsEmailVerified(sessionId: string) {
  await db
    .update(schema.passwordResetSessionTable)
    .set({ emailVerified: true })
    .where(eq(schema.passwordResetSessionTable.id, sessionId));
}

export async function setPasswordResetSessionAs2FAVerified(sessionId: string) {
  await db
    .update(schema.passwordResetSessionTable)
    .set({ twoFactorVerified: true })
    .where(eq(schema.passwordResetSessionTable.id, sessionId));
}

export async function invalidateUserPasswordResetSessions(userId: number) {
  await db
    .delete(schema.passwordResetSessionTable)
    .where(eq(schema.passwordResetSessionTable.userId, userId));
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
