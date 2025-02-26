/***** IMPORTANT! ***************************************************************/
import "server-only";
/********************************************************************************/

import { db, userTable } from "@/lib/server/db/schema";
import { decrypt, decryptToString, encrypt, encryptString } from "@/lib/server/encryption";
import { hashPassword } from "@/lib/server/password";
import { generateRandomRecoveryCode } from "@/lib/server/utils";
import { and, eq } from "drizzle-orm";

export async function createUser(email: string, password: string) {
	const passwordHash = await hashPassword(password);
	const recoveryCode = generateRandomRecoveryCode();
	const encryptedRecoveryCode = encryptString(recoveryCode);
  const result = await db
    .insert(userTable)
    .values({
      email,
      passwordHash,
      recoveryCode: encryptedRecoveryCode,
    }).returning();
	if (!result?.at(0)) {
		throw new Error("Unexpected error");
	}
	const user: IUser = {
		id: result[0].id,
		email,
		emailVerified: false,
		registered2FA: false
	};
	return user;
}

export async function updateUserPassword(userId: number, password: string) {
	const passwordHash = await hashPassword(password);
  await db
    .update(userTable)
    .set({ passwordHash })
    .where(eq(userTable.id, userId));
}

export async function updateUserEmailAndSetEmailAsVerified(userId: number, email: string) {
  await db
    .update(userTable)
    .set({ email, emailVerified: true })
    .where(eq(userTable.id, userId));
}

export async function setUserAsEmailVerifiedIfEmailMatches(userId: number, email: string) {
  const result = await db
    .update(userTable)
    .set({ emailVerified: true })
    .where(
      and(
        eq(userTable.id, userId),
        eq(userTable.email, email)
      )
    ).returning();
  return result.length > 0;
}

export async function getUserPasswordHash(userId: number) {
  const result = await db
    .select({ passwordHash: userTable.passwordHash })
    .from(userTable)
    .where(eq(userTable.id, userId));
	if (!result.length) {
		throw new Error("Invalid user ID");
	}
	return result[0].passwordHash;
}

export async function getUserRecoverCode(userId: number) {
  const result = await db
    .select({ recoveryCode: userTable.recoveryCode })
    .from(userTable)
    .where(eq(userTable.id, userId));
	if (!result.length) {
		throw new Error("Invalid user ID");
	}
	return decryptToString(result[0].recoveryCode);
}

export async function getUserTOTPKey(userId: number) {
  const result = await db
    .select({ totpKey: userTable.totpKey })
    .from(userTable)
    .where(eq(userTable.id, userId));
	if (!result.length) {
		throw new Error("Invalid user ID");
	}
	const encrypted = result[0].totpKey
	if (encrypted === null) {
		return null;
	}
	return decrypt(encrypted);
}

export async function updateUserTOTPKey(userId: number, key: Uint8Array) {
	const encrypted = encrypt(key);
  await db
    .update(userTable)
    .set({ totpKey: encrypted })
    .where(eq(userTable.id, userId));
}

export async function resetUserRecoveryCode(userId: number) {
	const recoveryCode = generateRandomRecoveryCode();
	const encrypted = encryptString(recoveryCode);
  await db
    .update(userTable)
    .set({ recoveryCode: encrypted })
    .where(eq(userTable.id, userId));
	return recoveryCode;
}

export async function getUserFromEmail(email: string) {
  const result = await db
    .select()
    .from(userTable)
    .where(eq(userTable.email, email));
    console.log(result);
	if (!result.length) {
		return null;
	}
	const user: IUser = {
		id: result[0].id,
		email: result[0].email,
		emailVerified: result[0].emailVerified,
		registered2FA: result[0].totpKey !== null
	};
	return user;
}

export interface IUser {
	id: number;
	email: string;
	emailVerified: boolean;
	registered2FA: boolean;
}
