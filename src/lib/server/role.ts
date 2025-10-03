/***** IMPORTANT! ***************************************************************/
import "server-only";
/********************************************************************************/

import db, { schema } from "@/lib/server/db";
import { eq, or } from "drizzle-orm";
import { Role } from "./db/types";

export async function getRole(options: {
  id?: number | null;
  slug?: string | null;
}) {
  const [result] = await db
    .select({
      id: schema.roleTable.id,
      slug: schema.roleTable.slug,
      rank: schema.roleTable.rank,
      name: schema.roleTable.name,
      shortDescription: schema.roleTable.shortDescription,
      description: schema.roleTable.description,
    })
    .from(schema.roleTable)
    .where(or(
      options.id ? eq(schema.roleTable.id, options.id) : undefined,
      options.slug ? eq(schema.roleTable.slug, options.slug) : undefined
    ))
    .limit(1);

  return result ?? null;
}

export async function getRoles() {
  const result = await db
    .select()
    .from(schema.roleTable);

  return result;
}

export async function getRolesUpToRank(roleSlug: Role | null) {
  const result = await db
    .select({
      id: schema.roleTable.id,
      slug: schema.roleTable.slug,
      rank: schema.roleTable.rank,
      name: schema.roleTable.name,
      shortDescription: schema.roleTable.shortDescription,
      description: schema.roleTable.description,
    })
    .from(schema.roleTable);

  const providedRoleRank = result.find((e) => e.slug === roleSlug)?.rank ?? 0;
  return result.filter((e) => e.rank <= providedRoleRank);
}

