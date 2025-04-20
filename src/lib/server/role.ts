/***** IMPORTANT! ***************************************************************/
import "server-only";
/********************************************************************************/

import * as Database from "@/lib/server/db/sql";
import { DB } from "@/lib/server/constants";
import { TblRole, Role } from "@/lib/types/role";

export async function getRole(options: {
  id?: number;
  slug?: Role;
}): Promise<TblRole | null> {
  const result = await Database.getRecord<TblRole>(`
    SELECT
      id,
      slug,
      rank,
      name,
      short_description,
      description
    FROM ${DB}.role
    ${options.id ? "WHERE id = :id" : ""}
    ${options.slug ? "WHERE slug = :slug" : ""}
  `, { ...options });

  return result;
}

export async function getRoles(): Promise<TblRole[]> {
  const result = await Database.query<TblRole>(`
    SELECT
      id,
      slug,
      rank,
      name,
      short_description,
      description
    FROM ${DB}.role
  `, {});

  return result;
}

export async function getRolesUpToRank(roleSlug: Role | null): Promise<TblRole[]> {
  const result = await Database.query<TblRole>(`
    SELECT
      id,
      slug,
      rank,
      name,
      short_description,
      description
    FROM ${DB}.role
  `, {});

  const providedRoleRank = result.find((e) => e.slug === roleSlug)?.rank ?? 0;
  return result.filter((e) => e.rank <= providedRoleRank);
}

