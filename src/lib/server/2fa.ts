/***** IMPORTANT! ***************************************************************/
import "server-only";
/********************************************************************************/

import { and, eq } from "drizzle-orm";
import { db, sessionTable, userTable } from "@/lib/server/db/schema";
import { ExpiringTokenBucket } from "@/lib/server/rate-limit";
import { generateRandomRecoveryCode } from "@/lib/server/utils";
import { decryptToString, encryptString } from "@/lib/server/encryption";

export const totpBucket = new ExpiringTokenBucket<number>(5, 60 * 30);
export const recoveryCodeBucket = new ExpiringTokenBucket<number>(3, 60 * 60);

export async function resetUser2FAWithRecoveryCode(userId: number, recoveryCode: string) {
  const result = await db
    .select({ recoveryCode: userTable.recoveryCode })
    .from(userTable)
    .where(eq(userTable.id, userId));
  const user = result[0];
  if (!user?.recoveryCode) {
    return false;
  }
	const encryptedRecoveryCode = user.recoveryCode;
	const userRecoveryCode = decryptToString(encryptedRecoveryCode);
  if (recoveryCode !== userRecoveryCode) {
    return false;
  }
	// Note: In Postgres and MySQL, these queries should be done in a transaction using SELECT FOR UPDATE
  const ret = await db.transaction(async (tx) => {
    try {
      const newRecoveryCode = generateRandomRecoveryCode();
      const encryptedNewRecoveryCode = encryptString(newRecoveryCode);
      await tx
        .update(sessionTable)
        .set({ twoFactorVerified: false })
        .where(eq(sessionTable.userId, userId));
  
      // Compare old recovery code to ensure recovery code wasn't updated.
      await tx
        .update(userTable)
        .set({ recoveryCode: encryptedNewRecoveryCode, totpKey: null })
        .where(
          and(
            eq(userTable.id, userId),
            eq(userTable.recoveryCode, encryptedRecoveryCode),
          ));
      return true;
    } catch {
      tx.rollback();
      return false;
    }
  });
	return ret;
}
