/***** IMPORTANT! ***************************************************************/
import "server-only";
/********************************************************************************/

import * as Database from "@/lib/server/db/sql";
import { DB } from "./constants";

export function verifyEmailInput(email: string): boolean {
	return /^.+@.+\..+$/.test(email) && email.length < 256;
}

export async function checkEmailAvailability(email: string) {
  const result = await Database.query(`
    SELECT
      email
    FROM ${DB}.user
    WHERE
      email = :email
  `, { email });
	return !result.length;
}
