/***** IMPORTANT! ***************************************************************/
import "server-only";
/********************************************************************************/

import { db, userTable } from "@/lib/server/db/schema";
import { eq } from "drizzle-orm";

export function verifyEmailInput(email: string): boolean {
	return /^.+@.+\..+$/.test(email) && email.length < 256;
}

export async function checkEmailAvailability(email: string) {
  const result = await db
    .select()
    .from(userTable)
    .where(eq(userTable.email, email));
	return !result.length;
}
