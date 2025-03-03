/***** IMPORTANT! ***************************************************************/
import "server-only";
/********************************************************************************/

import { decrypt, decryptToString, encrypt, encryptString } from "@/lib/server/encryption";
import { hashPassword } from "@/lib/server/password";
import { generateRandomRecoveryCode } from "@/lib/server/utils";
import { IUpdateUserDetailsFormData } from "@/actions/user/schema";
import * as Database from "@/lib/server/db/sql";
import { DB } from "./constants";
import { IUser, TblUser, TblUserDetails, UserAppRole } from "./db/types";

export async function createUser(email: string, password: string) {
	const passwordHash = await hashPassword(password);
	const recoveryCode = generateRandomRecoveryCode();
	const encryptedRecoveryCode = encryptString(recoveryCode);
  const insertedId = await Database.insertSingle<TblUser>({
    db: DB,
    table: "user",
    columnData: {
      email,
      password_hash: passwordHash,
      recovery_code: encryptedRecoveryCode,
    },
  });
	if (!insertedId) {
		throw new Error("Unexpected error");
	}
  const user = await getUser({ userId: insertedId });
	return user;
}

export async function updateUserPassword(userId: number, password: string) {
	const passwordHash = await hashPassword(password);
  await Database.update<TblUser>({
    db: DB,
    table: "user",
    idColumn: "id",
    id: userId,
    columnData: {
      password_hash: passwordHash,
    },
  });
}

export async function updateUserEmailAndSetEmailAsVerified(userId: number, email: string) {
  await Database.update<TblUser>({
    db: DB,
    table: "user",
    idColumn: "id",
    id: userId,
    columnData: {
      email,
      email_verified: true,
    },
  });
}

export async function setUserAsEmailVerifiedIfEmailMatches(userId: number, email: string) {
  const id = await Database.getRecord<{ id: number }>(`
    SELECT
      id
    FROM ${DB}.user
    WHERE
      id = :userId
      AND
      email = :email
  `, { userId, email });
  
  // id and email matches so now we can update row
  if (id) {
    await Database.query(`
      UPDATE ${DB}.user
      SET
        email_verified = 1
      WHERE
        id = :userId
        AND
        email = :email
    `, { userId, email });
  }
  return !!id;
}

export async function getUserPasswordHash(userId: number) {
  const result = await Database.getRecord<{ passwordHash: string }>(`
    SELECT
      password_hash AS passwordHash
    FROM ${DB}.user
    WHERE
      id = :userId
  `, { userId });

	if (!result) {
		throw new Error("Ogiltigt användar id");
	}
	return result.passwordHash;
}

export async function getUserRecoverCode(userId: number) {
  const result = await Database.getRecord<{ recoveryCode: Uint8Array }>(`
    SELECT
      recovery_code AS recoveryCode
    FROM ${DB}.user
    WHERE
      id = :userId
  `, { userId });
	if (!result) {
		throw new Error("Ogiltigt användar id");
	}
	return decryptToString(result.recoveryCode);
}

export async function getUserTOTPKey(userId: number) {
  const result = await Database.getRecord<{ totpKey: Uint8Array }>(`
    SELECT
      totp_key AS totpKey
    FROM ${DB}.user
    WHERE
      id = :userId
  `, { userId });
	if (!result) {
		throw new Error("Ogiltigt användar id");
	}
	const encrypted = result.totpKey
	if (encrypted === null) {
		return null;
	}
	return decrypt(encrypted);
}

export async function updateUserTOTPKey(userId: number, key: Uint8Array) {
	const encrypted = encrypt(key);
  await Database.update<TblUser>({
    db: DB,
    table: "user",
    idColumn: "id",
    id: userId,
    columnData: {
      totp_key: encrypted,
    },
  });
}

export async function resetUserRecoveryCode(userId: number) {
	const recoveryCode = generateRandomRecoveryCode();
	const encrypted = encryptString(recoveryCode);
  await Database.update<TblUser>({
    db: DB,
    table: "user",
    idColumn: "id",
    id: userId,
    columnData: {
      recovery_code: encrypted,
    },
  });
	return recoveryCode;
}

export async function getUser(options: {
  sessionId?: string;
  passwordResetSessionId?: string;
  userId?: number;
  email?: string;
}) {
  const result = await Database.getRecord<IUser>(`
    SELECT
      usr.id AS id,
      usr.email AS email,
      rle.code AS role,
      usd.first_name AS firstName,
      usd.last_name AS lastName,
      usr.email_verified AS emailVerified,
      usr.totp_key != null AS registered2FA,
      (
        SELECT GROUP_CONCAT(
          app.app_id,
          ${Database.SEPARATORS.unit.sql},
          app.external_organization_id,
          ${Database.SEPARATORS.unit.sql},
          app.external_id,
          ${Database.SEPARATORS.unit.sql},
          rle.code SEPARATOR ${Database.SEPARATORS.group.sql}
        ) 
        FROM ${DB}.user_app AS usa
        WHERE usa.user_id = usr.id
      ) AS apps
    FROM ${DB}.user
    LEFT JOIN ${DB}.user_details AS usd
      ON usd.user_id = usr.id
    LEFT JOIN ${DB}.role AS rle
      ON usd.role_id = rle.id
    ${options.sessionId ? `
      INNER JOIN ${DB}.session AS ses
        ON usr.id = ses.user_id
      WHERE ses.id = :sessionId
    ` : ""}
    ${options.passwordResetSessionId ? `
      INNER JOIN ${DB}.password_session AS ses
        ON usr.id = ses.user_id
      WHERE ses.id = :passwordResetSessionId
    ` : ""}
    ${options.userId ? `
      WHERE usr.id = :userId
    ` : ""}
    ${options.email ? `
      WHERE usr.email = :email
    ` : ""}
  `, { ...options });

  if (!result) {
    return null;
  }

  // Since we get app-related data as string we must map it to a more useful format
  result.apps = (result.apps as unknown as string)
    .split(Database.SEPARATORS.group.js)
    .map((e) => {
      const val = e.split(Database.SEPARATORS.unit.js);
      return {
        appId: Number(val[0]),
        externalOrganizationId: val[1],
        externalId: val[2],
        role: val[3] as UserAppRole,
      };
    });

	return result;
}

export async function updateUserDetails(userId: number, data: IUpdateUserDetailsFormData): Promise<boolean> {
  const savedId = await Database.save<TblUserDetails>({
    db: DB,
    table: "user_details",
    idColumn: "user_id",
    id: userId,
    columnData: {
      first_name: data.firstName,
      last_name: data.lastName,
    },
  });
  return !!savedId;
}

