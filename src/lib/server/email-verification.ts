/***** IMPORTANT! ***************************************************************/
import "server-only";
/********************************************************************************/

import { cookies } from "next/headers";
import { encodeBase32LowerCase } from "@oslojs/encoding";
import { IEmailVerificationRequest } from "@/lib/server/db/types";
import { generateRandomOTP, getCookieDomain } from "@/lib/server/utils";
import { ExpiringTokenBucket } from "@/lib/server/rate-limit";
import { getCurrentSession } from "@/lib/server/session";
import { sendMail } from "./email";
import * as Database from "@/lib/server/db/sql";
import { DB } from "./constants";
import { TblEmailVerificationRequest } from "@/lib/types/email-verification-request";

export async function getUserEmailVerificationRequest(userId: number, id: string) {
  const result = await Database.getRecord<IEmailVerificationRequest>(`
    SELECT
      id,
      user_id AS userId,
      email,
      code,
      expires_at AS expiresAt
    FROM ${DB}.email_verification_request
    WHERE
      user_id = :userId
      AND
      id = :id
  `, { id, userId });
	return result;
}

export async function createEmailVerificationRequest(userId: number, email: string) {
	await deleteUserEmailVerificationRequest(userId);
	const idBytes = new Uint8Array(20);
	crypto.getRandomValues(idBytes);
	const id = encodeBase32LowerCase(idBytes);

	const code = generateRandomOTP();
	const expiresAt = new Date(Date.now() + 1000 * 60 * 10);
  const request = {
    id,
    userId,
    code,
    email,
    expiresAt,
  };
  await Database.insertSingle<TblEmailVerificationRequest>({
    db: DB,
    table: "email_verification_request",
    columnData: {
      id: request.id,
      user_id: request.userId,
      code: request.code,
      email: request.email,
      expires_at: request.expiresAt,
    },
  });
	return request;
}

export async function deleteUserEmailVerificationRequest(userId: number){
  await Database.deleteQuery(`
    DELETE FROM ${DB}.email_verification_request
    WHERE user_id = :userId  
  `, { userId });
}

export function sendVerificationEmail(email: string, code: string): void {
  sendMail({
    from: "info@kaxig.com",
    to: email,
    subject: "Din verifieringskod",
    text: `Din verifieringskod är ${code}`,
  });
}

export async function setEmailVerificationRequestCookie(request: IEmailVerificationRequest) {
	const cookieStore = await cookies();
  const cookieDomain = await getCookieDomain();
	cookieStore.set("email_verification", request.id, {
    domain: cookieDomain,
		httpOnly: true,
		path: "/",
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		expires: request.expiresAt
	});
}

export async function deleteEmailVerificationRequestCookie() {
	const cookieStore = await cookies();
  const cookieDomain = await getCookieDomain();
	cookieStore.set("email_verification", "", {
    domain: cookieDomain,
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

