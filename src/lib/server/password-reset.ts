/***** IMPORTANT! ***************************************************************/
import "server-only";
/********************************************************************************/

import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import { db, passwordResetSessionTable, userAppTable, userDetailsTable, userTable } from "@/lib/server/db/schema";
import { TblPasswordResetSession } from "@/lib/server/db/types";
import { generateRandomOTP } from "@/lib/server/utils";
import { IUser } from "./user";
import { sendMail } from "./mail";

export async function createPasswordResetSession(token: string, userId: number, email: string) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: TblPasswordResetSession = {
		id: sessionId,
		userId,
		email,
		expiresAt: new Date(Date.now() + 1000 * 60 * 10),
		code: generateRandomOTP(),
		emailVerified: false,
		twoFactorVerified: false
	};
  await db.insert(passwordResetSessionTable).values(session);
	return session;
}

export async function validatePasswordResetSessionToken(token: string): Promise<IPasswordResetSessionValidationResult> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const result = await db
    .select({
      user: userTable,
      userDetails: userDetailsTable,
      session: passwordResetSessionTable,
    })
    .from(passwordResetSessionTable)
    .innerJoin(userTable, eq(passwordResetSessionTable.userId, userTable.id))
    .leftJoin(userDetailsTable, eq(passwordResetSessionTable.userId, userDetailsTable.userId))
    .where(eq(passwordResetSessionTable.id, sessionId));
  if (result.length < 1) {
    return { session: null, user: null };
  }
  const appResult = await db
    .select()
    .from(userAppTable)
    .where(eq(userAppTable.userId, result[0].user.id));
  const { session } = result[0];
  const user: IUser = {
		id: result[0].user.id,
		email: result[0].user.email,
    role: result[0].user.role,
    firstName: result[0].userDetails?.firstName || null,
    lastName: result[0].userDetails?.lastName || null,
		emailVerified: result[0].user.emailVerified,
		registered2FA: result[0].user.totpKey !== null,
    apps: appResult?.map((e) => ({
      appId: e.appId,
      externalOrganizationId: e.externalOrganizationId,
      externalId: e.externalId,
      role: e.role,
    })) || []
	};
  if (Date.now() >= session.expiresAt.getTime()) {
    await db.delete(passwordResetSessionTable).where(eq(passwordResetSessionTable.id, session.id));
    return { session: null, user: null };
  }
	return { session, user };
}

export async function setPasswordResetSessionAsEmailVerified(sessionId: string) {
  await db.update(passwordResetSessionTable)
    .set({ emailVerified: true })
    .where(eq(passwordResetSessionTable.id, sessionId));
}

export async function setPasswordResetSessionAs2FAVerified(sessionId: string) {
  await db
    .update(passwordResetSessionTable)
    .set({ twoFactorVerified: true })
    .where(eq(passwordResetSessionTable.id, sessionId));
}

export async function invalidateUserPasswordResetSessions(userId: number) {
  await db
    .delete(passwordResetSessionTable)
    .where(eq(passwordResetSessionTable.userId, userId));
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
	cookieStore.set("password_reset_session", token, {
		expires: expiresAt,
		sameSite: "lax",
		httpOnly: true,
		path: "/",
		secure: process.env.NODE_ENV === "production"
	});
}

export async function deletePasswordResetSessionTokenCookie() {
	const cookieStore = await cookies();
	cookieStore.set("password_reset_session", "", {
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
	| { session: TblPasswordResetSession; user: IUser }
	| { session: null; user: null };
