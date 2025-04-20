/***** IMPORTANT! ***************************************************************/
import "server-only";
/********************************************************************************/

import { headers } from "next/headers";
import * as Database from "@/lib/server/db/sql";
import { DB } from "./constants";
import { TblTheme } from "@/lib/types/theme";

export async function getTheme(): Promise<TblTheme | null> {
  let themeSlug: string | null = null;
  if (process.env.NODE_ENV === "production") {
    const headerStore = await headers();
    themeSlug = headerStore.get("X-Theme");
  } else {
    themeSlug = "localhost"
  }
  const record = await Database.getRecord<TblTheme>(`
    SELECT
      slug,
      header_logo_url,
      footer_logo_url,
      backdrop_url,
      alt_text,
      header_logo_height,
      header_logo_width,
      footer_logo_height,
      footer_logo_width,
      backdrop_position
    FROM ${DB}.theme
    WHERE 
      slug= :themeSlug
  `, { themeSlug });

  return record;
}
