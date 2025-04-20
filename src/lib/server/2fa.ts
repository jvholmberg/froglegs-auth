/***** IMPORTANT! ***************************************************************/
import "server-only";
/********************************************************************************/

import { ExpiringTokenBucket } from "@/lib/server/rate-limit";
import { generateRandomRecoveryCode } from "@/lib/server/utils";
import { decryptToString, encryptString } from "@/lib/server/encryption";
import * as Database from "@/lib/server/db/sql";
import { DB } from "./constants";
import { TblSession } from "@/lib/types/session";
import { getCurrentSession } from "./session";

export const totpBucket = new ExpiringTokenBucket<number>(5, 60 * 30);
export const recoveryCodeBucket = new ExpiringTokenBucket<number>(3, 60 * 60);

export async function resetUser2FAWithRecoveryCode(userId: number, recoveryCode: string) {
  const result = await Database.getRecord<{ recoveryCode: Uint8Array; }>(`
    SELECT
      recovery_code
    FROM ${DB}.user
    WHERE id = :userId
  `, { userId })
  if (!result?.recoveryCode) {
    return false;
  }
	const encryptedRecoveryCode = result.recoveryCode;
	const userRecoveryCode = decryptToString(encryptedRecoveryCode);
  if (recoveryCode !== userRecoveryCode) {
    return false;
  }
  const ret = await Database.write(async (connection) => {
    const newRecoveryCode = generateRandomRecoveryCode();
    const encryptedNewRecoveryCode = encryptString(newRecoveryCode);

    await Database.update<TblSession>({
      connection,
      db: DB,
      table: "session",
      idColumn: "user_id",
      id: userId,
      columnData: {
        two_factor_verified: false,
      },
    });

    await Database.query(`
      UPDATE ${DB}.user
      SET
        recovery_code = :encryptedNewRecoveryCode,
        totp_key = null
      WHERE
        id = :userId
        AND
        recovery_code = :recoveryCode
    `, {
      encryptedNewRecoveryCode,
      userId,
      recoveryCode
    }, { connection });

    return true;
  });
	return ret == true;
}

export async function remove2FAFromSignedInUser() {
  const { user } = await getCurrentSession();

  return await Database.write(async (connection) => {
    // Remove 2FA from user
    Database.query(`
      UPDATE ${DB}.user
      SET totp_key = null
      WHERE
        id = :userId
    `, { userId: user?.id }, { connection });

    // Mark all sessions for user as not being 2FA verified
    Database.query(`
      UPDATE ${DB}.session
      SET two_factor_verified = 0
      WHERE
        user_id = :userId
    `, { userId: user?.id }, { connection });

    return true;
  });
}
