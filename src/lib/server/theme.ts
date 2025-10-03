/***** IMPORTANT! ***************************************************************/
import "server-only";
/********************************************************************************/

import { headers } from "next/headers";
import db, { schema } from "@/lib/server/db";
import { eq } from "drizzle-orm";

export async function getTheme() {
  let themeSlug: string | null = null;
  if (process.env.NODE_ENV === "production") {
    const headerStore = await headers();
    themeSlug = headerStore.get("X-Theme");
  } else {
    themeSlug = "localhost"
  }

  const [result] = await db
    .select()
    .from(schema.themeTable)
    .where(
      eq(schema.themeTable.slug, themeSlug || "default")
    ).limit(1);

  return result ?? null;
}
