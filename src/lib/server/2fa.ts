/***** IMPORTANT! ***************************************************************/
import "server-only";
/********************************************************************************/

import { ExpiringTokenBucket } from "@/lib/server/rate-limit";
import { generateRandomRecoveryCode } from "@/lib/server/utils";
import { decryptToString, encryptString } from "@/lib/server/encryption";
import db, { schema } from "@/lib/server/db";
import { getCurrentSession } from "./session";
import { and, eq, sql } from "drizzle-orm";

export const totpBucket = new ExpiringTokenBucket<number>(5, 60 * 30);
export const recoveryCodeBucket = new ExpiringTokenBucket<number>(3, 60 * 60);

export async function resetUser2FAWithRecoveryCode(userId: number, recoveryCode: string) {
  const result = await db.query.userTable.findFirst({
    where: (userTable, { eq }) => eq(userTable.id, userId),
    columns: { recoveryCode: true },
  });
  
  if (!result?.recoveryCode) {
    return false;
  }
	const encryptedRecoveryCode = result.recoveryCode;
	const userRecoveryCode = decryptToString(encryptedRecoveryCode);
  if (recoveryCode !== userRecoveryCode) {
    return false;
  }

  const ret: boolean = await db.transaction(async (tx) => {
    const newRecoveryCode = generateRandomRecoveryCode();
    const encryptedNewRecoveryCode = encryptString(newRecoveryCode);
    
    await tx.update(schema.sessionTable).set({
      twoFactorVerified: false,
    }).where(eq(schema.sessionTable.userId, userId));

    await tx.update(schema.userTable).set({
      recoveryCode: encryptedNewRecoveryCode,
      totpKey: null,
    }).where(and(
      eq(schema.userTable.id, userId),
      sql`${schema.userTable.recoveryCode} = ${recoveryCode}`,
    ));

    return true;
  });

	return ret === true;
}

export async function remove2FAFromSignedInUser() {
  const { user } = await getCurrentSession();
  if (!user) {
    return false;
  }

  const ret: boolean = await db.transaction(async (tx) => {
    
    // Remove 2FA from user
    await tx.update(schema.userTable).set({
      totpKey: null,
    }).where(eq(schema.userTable.id, user.id));

    // Mark all sessions for user as not being 2FA verified
    await tx.update(schema.sessionTable).set({
      twoFactorVerified: false,
    }).where(eq(schema.sessionTable.userId, user.id));

    return true;
  });

	return ret === true;
}
