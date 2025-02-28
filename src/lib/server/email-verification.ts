/***** IMPORTANT! ***************************************************************/
import "server-only";
/********************************************************************************/

import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { encodeBase32 } from "@oslojs/encoding";
import { db, emailVerificationRequestTable } from "@/lib/server/db/schema";
import { TblEmailVerificationRequest } from "@/lib/server/db/types";
import { generateRandomOTP } from "@/lib/server/utils";
import { ExpiringTokenBucket } from "@/lib/server/rate-limit";
import { getCurrentSession } from "@/lib/server/session";
import { sendMail } from "./mail";

export async function getUserEmailVerificationRequest(userId: number, id: string) {
  const result = await db
    .select()
    .from(emailVerificationRequestTable)
    .where(
      and(
        eq(emailVerificationRequestTable.id, id),
        eq(emailVerificationRequestTable.userId, userId)
      ))
    .limit(1);
  const request = result.at(0);
	return request || null;
}

export async function createEmailVerificationRequest(userId: number, email: string) {
	await deleteUserEmailVerificationRequest(userId);
	const idBytes = new Uint8Array(20);
	crypto.getRandomValues(idBytes);
	const id = encodeBase32(idBytes).toLowerCase();

	const code = generateRandomOTP();
	const expiresAt = new Date(Date.now() + 1000 * 60 * 10);
  const request = {
    id,
    userId,
    code,
    email,
    expiresAt,
  };
  await db.insert(emailVerificationRequestTable).values(request);
	return request;
}

export async function deleteUserEmailVerificationRequest(userId: number){
  await db.delete(emailVerificationRequestTable).where(eq(emailVerificationRequestTable.userId, userId));
}

export function sendVerificationEmail(email: string, code: string): void {
  sendMail({
    from: "info@kaxig.com",
    to: email,
    subject: "Your verification code",
    text: `Your verification code is ${code}`,
  });
}

export async function setEmailVerificationRequestCookie(request: TblEmailVerificationRequest) {
	const cookieStore = await cookies();
	cookieStore.set("email_verification", request.id, {
		httpOnly: true,
		path: "/",
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		expires: request.expiresAt
	});
}

export async function deleteEmailVerificationRequestCookie() {
	const cookieStore = await cookies();
	cookieStore.set("email_verification", "", {
		httpOnly: true,
		path: "/",
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 0
	});
}

export async function getUserEmailVerificationRequestFromRequest() {
	const { user } = await getCurrentSession();
	if (user === null) {
		return null;
	}
  const cookieStore = await cookies();
	const id = cookieStore.get("email_verification")?.value ?? null;
	if (id === null) {
		return null;
	}
	const request = getUserEmailVerificationRequest(user.id, id);
	if (request === null) {
		deleteEmailVerificationRequestCookie();
	}
	return request;
}

export const sendVerificationEmailBucket = new ExpiringTokenBucket<number>(3, 60 * 10);

