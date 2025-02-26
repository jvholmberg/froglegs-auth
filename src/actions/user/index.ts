/***** IMPORTANT! ***************************************************************/
"use server";
import "server-only";
/********************************************************************************/

import { db, userTable } from "@/lib/server/db/schema";
import { eq } from "drizzle-orm";

export async function selectUserByEmail(email: string) {
  const records = await db.select()
    .from(userTable)
    .where(eq(userTable.email, email))
    .limit(1);
  return records.at(0) || null;
}

export async function insertUserAction(email: string, password: string) {
  
}
