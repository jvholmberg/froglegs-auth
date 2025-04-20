/***** IMPORTANT! ***************************************************************/
import "server-only";
/********************************************************************************/

import { decrypt, decryptToString, encrypt, encryptString } from "@/lib/server/encryption";
import { hashPassword } from "@/lib/server/password";
import { generateRandomRecoveryCode } from "@/lib/server/utils";
import { IUpdateUserDetailsFormData } from "@/app/(signed-in)/account/schema";
import * as Database from "@/lib/server/db/sql";
import { DB } from "./constants";
import { IUser, IUserAppItem } from "./db/types";
import { EApiUser } from "@/app/api/schema";
import { Role } from "@/lib/types/role";
import { TblUser } from "@/lib/types/user";
import { TblUserDetails } from "@/lib/types/user-details";

export async function createUser(email: string, password: string) {
  // Hash password, generate/encrypt recovery code
	const passwordHash = await hashPassword(password);
	const recoveryCode = generateRandomRecoveryCode();
	const encryptedRecoveryCode = encryptString(recoveryCode);

  // Insert user
  const insertedId = await Database.insertSingle<TblUser>({
    db: DB,
    table: "user",
    columnData: {
      email,
      password_hash: passwordHash,
      recovery_code: Buffer.from(encryptedRecoveryCode),
    },
  });
	if (!insertedId) {
		throw new Error("Unexpected error");
	}
  const user = await getOneUser({ userId: insertedId });
	return user;
}

export async function updateUserPassword(userId: number, password: string): Promise<boolean> {
  try {
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

    return true;
  } catch {
    return false; 
  }
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
      totp_key: Buffer.from(encrypted),
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

export async function getUsers(): Promise<IUser[]> {
  const result = await Database.query<IUser>(`
    SELECT
      usr.id AS id,
      usr.email AS email,
      rle.slug AS role,
      usd.first_name AS firstName,
      usd.last_name AS lastName,
      usr.email_verified AS emailVerified,
      usr.totp_key IS NOT NULL AS registered2FA,
      (
        SELECT GROUP_CONCAT(
          usa.app_id,
          ${Database.SEPARATORS.unit.sql},
          app.slug,
          ${Database.SEPARATORS.unit.sql},
          usa.external_partition_id,
          ${Database.SEPARATORS.unit.sql},
          usa.external_organization_id,
          ${Database.SEPARATORS.unit.sql},
          usa.external_id,
          ${Database.SEPARATORS.unit.sql},
          rle.slug SEPARATOR ${Database.SEPARATORS.group.sql}
        )
        FROM ${DB}.user_app AS usa
        INNER JOIN ${DB}.app AS app
          ON usa.app_id = app.id
        INNER JOIN ${DB}.role AS rle
          ON usa.role_id = rle.id
        WHERE usa.user_id = usr.id
      ) AS apps
    FROM ${DB}.user AS usr
    LEFT JOIN ${DB}.user_details AS usd
      ON usd.user_id = usr.id
    LEFT JOIN ${DB}.role AS rle
      ON usr.role_id = rle.id
  `, {});

  // Since we get app-related data as string we must map it to a more useful format
  const mappedResult = result.map((user) => {
    const appsString = user.apps as unknown as string || "";
    user.apps = appsString?.split(Database.SEPARATORS.group.js)
      .map((e) => {
        const val = e.split(Database.SEPARATORS.unit.js);
        return {
          appId: Number(val[0]),
          appSlug: val[1],
          externalPartitionId: val[2] ? Number(val[2]) : null,
          externalOrganizationId: val[3] ? Number(val[3]) : null,
          externalId: val[4] ? Number(val[4]) : null,
          role: val[5] as Role,
        } as IUserAppItem;
      }) || [];
    return user;
  });

  return mappedResult;
}

export async function getOneUser(options: {
  sessionId?: string;
  passwordResetSessionId?: string;
  userId?: number;
  email?: string;
}): Promise<IUser | null> {
  const result = await Database.getRecord<IUser>(`
    SELECT
      usr.id AS id,
      usr.email AS email,
      rle.slug AS role,
      usd.first_name AS firstName,
      usd.last_name AS lastName,
      usr.email_verified AS emailVerified,
      usr.totp_key IS NOT NULL AS registered2FA,
      (
        SELECT GROUP_CONCAT(
          usa.app_id,
          ${Database.SEPARATORS.unit.sql},
          app.slug,
          ${Database.SEPARATORS.unit.sql},
					IFNULL(usa.external_partition_id, ''),
          ${Database.SEPARATORS.unit.sql},
					IFNULL(usa.external_organization_id, ''),
          ${Database.SEPARATORS.unit.sql},
					IFNULL(usa.external_id, ''),
          ${Database.SEPARATORS.unit.sql},
          rle.slug SEPARATOR ${Database.SEPARATORS.group.sql}
        )
        FROM ${DB}.user_app AS usa
        INNER JOIN ${DB}.app AS app
          ON usa.app_id = app.id
        INNER JOIN ${DB}.role AS rle
          ON usa.role_id = rle.id
        WHERE usa.user_id = usr.id
      ) AS apps
    FROM ${DB}.user AS usr
    LEFT JOIN ${DB}.user_details AS usd
      ON usd.user_id = usr.id
    LEFT JOIN ${DB}.role AS rle
      ON usr.role_id = rle.id
    ${options.sessionId ? `
      INNER JOIN ${DB}.session AS ses
        ON usr.id = ses.user_id
      WHERE ses.id = :sessionId
    ` : ""}
    ${options.passwordResetSessionId ? `
      INNER JOIN ${DB}.password_reset_session AS ses
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
  const appsString = result.apps as unknown as string || "";
  result.apps = appsString?.split(Database.SEPARATORS.group.js)
    .map((e) => {
      const val = e.split(Database.SEPARATORS.unit.js);
      return {
        appId: Number(val[0]),
        appSlug: val[1],
        externalPartitionId: val[2] ? Number(val[2]) : null,
        externalOrganizationId: val[3] ? Number(val[3]) : null,
        externalId: val[4] ? Number(val[4]) : null,
        role: val[5] as Role,
      } as IUserAppItem;
    }) || [];

  return result;
}

export async function getExternalUsers(options: {
  appId?: number;
  appSlug?: string;
  externalPartitionId?: number;
  externalOrganizationId?: number;
}): Promise<EApiUser[]> {
  const result = await Database.query<EApiUser>(`
    SELECT
      usr.id AS id,
      usa.external_partition_id AS externalPartitionId,
      usa.external_organization_id AS externalOrganizationId,
      usa.external_id AS externalId,
      usr.email AS email,
      rle.slug AS role,
      usd.first_name AS firstName,
      usd.last_name AS lastName
    FROM ${DB}.user_app AS usa
    INNER JOIN ${DB}.user AS usr
      ON usa.user_id = usr.id
    LEFT JOIN ${DB}.user_details AS usd
      ON usr.id = usd.user_id
    INNER JOIN ${DB}.role AS rle
      ON usa.role_id = rle.id
    ${/** If we're gonna filter using app slug we must also join app-table */
    options.appSlug ? `INNER JOIN ${DB}.app as app ON usa.app_id = app.id` : ""
    }
    WHERE
      1 = 1
      ${options.appId ? "AND usa.app_id = :appId" : ""}
      ${options.appSlug ? "AND app.slug = :appSlug" : ""}
      ${options.externalPartitionId ? "AND usa.external_partition_id = :externalPartitionId" : ""}
      ${options.externalOrganizationId ? "AND usa.external_organization_id = :externalOrganizationId" : ""}  
  `, { ...options });

  return result;
}

export async function updateUserDetails(userId: number, data: IUpdateUserDetailsFormData): Promise<boolean> {
  const ret = await Database.write(async (connection) => {
    await Database.deleteQuery(`
      DELETE FROM ${DB}.user_details
      WHERE user_id = :userId
    `, { userId }, { connection });
    await Database.insertSingle<TblUserDetails>({
      connection,
      db: DB,
      table: "user_details",
      columnData: {
        user_id: userId,
        first_name: data.firstName,
        last_name: data.lastName,
      },
    });
    return true;
  });

  return ret;
}

export async function deleteUser(userId: number) {
  try {
    await Database.query(`
      DELETE FROM ${DB}.user
      WHERE id = :userId
    `, { userId });

    return true; 
  } catch {
    return false; 
  }
}


export async function updateUserRole(userId: number, roleId: number | null) {
  try {
    await Database.update<TblUser>({
      db: DB,
      table: "user",
      idColumn: "id",
      id: userId,
      columnData: {
        role_id: roleId,
      },
    });

    return true;
  } catch {
    return false;
  }
}


