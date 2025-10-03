/***** IMPORTANT! ***************************************************************/
import "server-only";
/********************************************************************************/

import { decrypt, decryptToString, encrypt, encryptString } from "@/lib/server/encryption";
import { hashPassword } from "@/lib/server/password";
import { generateRandomRecoveryCode } from "@/lib/server/utils";
import { IUpdateUserDetailsFormData } from "@/app/(signed-in)/account/schema";
import db from "@/lib/server/db";
import { IUser, IUserAppItem, TblNewUserDetails } from "./db/types";
import { and, eq, sql } from "drizzle-orm";
import { schema } from "@/lib/server/db";

export async function createUser(email: string, password: string) {
  // Hash password, generate/encrypt recovery code
	const passwordHash = await hashPassword(password);
	const recoveryCode = generateRandomRecoveryCode();
	const encryptedRecoveryCode = encryptString(recoveryCode);

  // Insert user
  const [{ insertedId }] = await db.insert(schema.userTable).values({
    email,
    passwordHash,
    recoveryCode: Buffer.from(encryptedRecoveryCode),
  }).returning({ insertedId: schema.userTable.id });

	if (!insertedId) {
		throw new Error("Unexpected error");
	}
  const user = await getOneUser({ userId: insertedId });
	return user;
}

export async function updateUserPassword(userId: number, password: string): Promise<boolean> {
  try {
    const passwordHash = await hashPassword(password);
    
    await db.update(schema.userTable).set({
      passwordHash,
    }).where(eq(schema.userTable.id, userId));

    return true;
  } catch {
    return false; 
  }
}

export async function updateUserEmailAndSetEmailAsVerified(userId: number, email: string) {
  await db.update(schema.userTable).set({
    email,
    emailVerified: true,
  }).where(eq(schema.userTable.id, userId));
}

export async function setUserAsEmailVerifiedIfEmailMatches(userId: number, email: string) {
  const [{ id }] = await db.update(schema.userTable).set({
    emailVerified: true,
  }).where(and(
    eq(schema.userTable.id, userId),
    eq(schema.userTable.email, email),
  )).returning({ id: schema.userTable.id });

  return !!id;
}

export async function getUserPasswordHash(userId: number) {
  const [result] = await db.select().from(schema.userTable).where(
    eq(schema.userTable.id, userId)
  ).limit(1);

  if (!result) {
    throw new Error("Ogiltigt användar id");
  }
  return result.passwordHash;
}

export async function getUserRecoverCode(userId: number) {
  const [result] = await db.select().from(schema.userTable).where(eq(schema.userTable.id, userId)).limit(1);
  if (!result) {
    throw new Error("Ogiltigt användar id");
  }
  return decryptToString(result.recoveryCode);
}

export async function getUserTOTPKey(userId: number) {
  const [result] = await db.select({
    totpKey: schema.userTable.totpKey,
  }).from(schema.userTable).where(eq(schema.userTable.id, userId)).limit(1);

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

  await db.update(schema.userTable).set({
    totpKey: Buffer.from(encrypted),
  }).where(eq(schema.userTable.id, userId));
}

export async function resetUserRecoveryCode(userId: number) {
  const recoveryCode = generateRandomRecoveryCode();
  const encrypted = encryptString(recoveryCode);

  await db.update(schema.userTable).set({
    recoveryCode: encrypted,
  }).where(eq(schema.userTable.id, userId));

  return recoveryCode;
}

export async function getUsers(): Promise<IUser[]> {
  // First, get all users with their basic info
  const users = await db.select({
    id: schema.userTable.id,
    email: schema.userTable.email,
    role: schema.roleTable.slug,
    firstName: schema.userDetailsTable.firstName,
    lastName: schema.userDetailsTable.lastName,
    emailVerified: schema.userTable.emailVerified,
    registered2FA: sql<boolean>`${schema.userTable.totpKey} IS NOT NULL`,
  })
  .from(schema.userTable)
  .leftJoin(schema.userDetailsTable, eq(schema.userDetailsTable.userId, schema.userTable.id))
  .leftJoin(schema.roleTable, eq(schema.roleTable.id, schema.userTable.roleId));

  // Then get all user-app relationships
  const userApps = await db.select({
    userId: schema.userAppTable.userId,
    appId: schema.userAppTable.appId,
    appSlug: schema.appTable.slug,
    externalPartitionId: schema.userAppTable.externalPartitionId,
    externalOrganizationId: schema.userAppTable.externalOrganizationId,
    externalId: schema.userAppTable.externalId,
    role: schema.roleTable.slug,
  })
  .from(schema.userAppTable)
  .innerJoin(schema.appTable, eq(schema.userAppTable.appId, schema.appTable.id))
  .innerJoin(schema.roleTable, eq(schema.userAppTable.roleId, schema.roleTable.id));

  // Combine users with their apps
  return users.map(user => ({
    ...user,
    role: user.role as any, // Cast to Role type
    apps: userApps
      .filter(ua => ua.userId === user.id)
      .map(ua => ({
        appId: ua.appId,
        appSlug: ua.appSlug,
        externalPartitionId: ua.externalPartitionId || 0,
        externalOrganizationId: ua.externalOrganizationId || 0,
        externalId: ua.externalId ?? 0,
        role: ua.role as any,
      } as IUserAppItem))
  }));
}

export async function getOneUser(options: {
  sessionId?: string;
  passwordResetSessionId?: string;
  userId?: number;
  email?: string;
}): Promise<IUser | null> {
  
  const query = db.select({
    id: schema.userTable.id,
    email: schema.userTable.email,
    role: schema.roleTable.slug,
    firstName: schema.userDetailsTable.firstName,
    lastName: schema.userDetailsTable.lastName,
    emailVerified: schema.userTable.emailVerified,
    registered2FA: sql<boolean>`${schema.userTable.totpKey} IS NOT NULL`,
  })
  .from(schema.userTable)
  .leftJoin(schema.userDetailsTable, eq(schema.userDetailsTable.userId, schema.userTable.id))
  .leftJoin(schema.roleTable, eq(schema.roleTable.id, schema.userTable.roleId))
  .$dynamic();

  if (options.sessionId) {
    query
      .innerJoin(schema.sessionTable, eq(schema.sessionTable.userId, schema.userTable.id))
      .where(eq(schema.sessionTable.id, options.sessionId));
  } else if (options.passwordResetSessionId) {
    query
      .innerJoin(schema.passwordResetSessionTable, eq(schema.passwordResetSessionTable.userId, schema.userTable.id))
      .where(eq(schema.passwordResetSessionTable.id, options.passwordResetSessionId));
  } else if (options.userId) {
    query.where(eq(schema.userTable.id, options.userId));
  } else if (options.email) {
    query.where(eq(schema.userTable.email, options.email));
  }

  const [user] = await query.limit(1);

  if (!user) {
    return null;
  }

  // Get user's apps separately
  const userApps = await db.select({
    appId: schema.userAppTable.appId,
    appSlug: schema.appTable.slug,
    externalPartitionId: schema.userAppTable.externalPartitionId,
    externalOrganizationId: schema.userAppTable.externalOrganizationId,
    externalId: schema.userAppTable.externalId,
    role: schema.roleTable.slug,
  })
  .from(schema.userAppTable)
  .innerJoin(schema.appTable, eq(schema.userAppTable.appId, schema.appTable.id))
  .innerJoin(schema.roleTable, eq(schema.userAppTable.roleId, schema.roleTable.id))
  .where(eq(schema.userAppTable.userId, user.id));

  // Combine user with their apps
  return {
    ...user,
    role: user.role as any, // Cast to Role type
    apps: userApps.map(ua => ({
      appId: ua.appId,
      appSlug: ua.appSlug,
      externalPartitionId: ua.externalPartitionId || 0,
      externalOrganizationId: ua.externalOrganizationId || 0,
      externalId: ua.externalId ?? 0,
      role: ua.role as any,
    } as IUserAppItem))
  };
}

export async function getExternalUsers(options: {
  appId?: number;
  appSlug?: string;
  externalPartitionId?: number;
  externalOrganizationId?: number;
}) {

  const result = await db.select({
    id: schema.userTable.id,
    externalPartitionId: schema.userAppTable.externalPartitionId,
    externalOrganizationId: schema.userAppTable.externalOrganizationId,
    externalId: schema.userAppTable.externalId,
    email: schema.userTable.email,
    role: schema.roleTable.slug,
    firstName: schema.userDetailsTable.firstName,
    lastName: schema.userDetailsTable.lastName,
  })
    .from(schema.userAppTable)
    .innerJoin(schema.appTable, eq(schema.userAppTable.appId, schema.appTable.id))
    .innerJoin(schema.userTable, eq(schema.userAppTable.userId, schema.userTable.id))
    .leftJoin(schema.userDetailsTable, eq(schema.userTable.id, schema.userDetailsTable.userId))
    .leftJoin(schema.roleTable, eq(schema.userTable.roleId, schema.roleTable.id))
    .where(and(
      options.appId
        ? eq(schema.userAppTable.appId, options.appId)
        : undefined,
      options.appSlug
        ? eq(schema.appTable.slug, options.appSlug)
        : undefined,
      options.externalPartitionId
        ? eq(schema.userAppTable.externalPartitionId, options.externalPartitionId)
        : undefined,
      options.externalOrganizationId
        ? eq(schema.userAppTable.externalOrganizationId, options.externalOrganizationId)
        : undefined,
    ));

  return result;
}

export async function updateUserDetails(userId: number, data: IUpdateUserDetailsFormData): Promise<boolean> {
  const ret = await db.transaction(async (tx) => {
    await tx.delete(schema.userDetailsTable).where(eq(schema.userDetailsTable.userId, userId));
    await tx.insert(schema.userDetailsTable).values({
      userId,
      firstName: data.firstName,
      lastName: data.lastName,
    } as TblNewUserDetails);
    return true;
  });

  return ret;
}

export async function deleteUser(userId: number) {
  try {
    db.delete(schema.userTable).where(eq(schema.userTable.id, userId));

    return true; 
  } catch {
    return false; 
  }
}


export async function updateUserRole(userId: number, roleId: number | null) {
  try {
    db.update(schema.userTable).set({
      roleId,
    }).where(eq(schema.userTable.id, userId));

    return true;
  } catch {
    return false;
  }
}


