/***** IMPORTANT! ***************************************************************/
import "server-only";
/********************************************************************************/

import dayjs from "dayjs";
import { IApp, IAppInvitation, IAppUser, IUser } from "./db/types";
import * as Database from "@/lib/server/db/sql";
import { DB } from "./constants";
import { getRole } from "./role";
import { IUpdateUserAppFormData } from "@/app/(signed-in)/admin/schema";
import { Role, TblRole } from "@/lib/types/role";
import { TblAppInvitation } from "@/lib/types/app-invitation";
import { TblUserApp } from "@/lib/types/user-app";

export async function updateUserApp(
  appId: number,
  userId: number,
  formData: IUpdateUserAppFormData,
) {
  const success = await Database.updateComposite<TblUserApp>({
    db: DB,
    table: "user_app",
    ids: [
      { idColumn: "app_id", id: appId },
      { idColumn: "user_id", id: userId },
    ],
    columnData: {
      external_partition_id: formData.partitionId,
      ...(formData.organizationId ? { external_organization_id: formData.organizationId } : {}),
      ...(formData.accountId ? { external_id: formData.accountId } : {}),
    },
  });

  return !!success;
}

export async function getApps(): Promise<IApp[]> {
  const result = await Database.query<IApp>(`
    SELECT
      *
    FROM ${DB}.app
  `, {});
	return result;
}

export async function getApp(options: {
  id?: number;
  slug?: string;
}): Promise<IApp | null> {
  const result = await Database.getRecord<IApp>(`
    SELECT *
    FROM ${DB}.app
    ${options.id ? "WHERE id = :id" : ""}
    ${options.slug ? "WHERE slug = :slug" : ""}
  `, { ...options });
	return result;
}

export async function getAppsForUser(userId: number | null | undefined): Promise<IApp[]> {
  if (!userId) {
    return [];
  }

  const result = await Database.query<IApp>(`
    SELECT
      app.id AS id,
      app.slug AS slug,
      app.url AS url,
      app.name AS name,
      app.description AS description
    FROM ${DB}.user_app AS uap
    INNER JOIN ${DB}.app as app
      ON uap.app_id = app.id
    WHERE
      uap.user_id = :userId
    GROUP BY app.id
  `, { userId });
	return result;
}

export async function createAppInvitation(
  appSlug: string,
  email: string,
  roleSlug: Role | null,
  partitionId?: number | null,
  organizationId?: number | null,
): Promise<boolean> {
  const app = await getApp({ slug: appSlug });
  const role = roleSlug && await getRole({ slug: roleSlug });
  const expiryTimeInMs = 1000 * 60 * 60 * 24 * 30;
  const expiresAt = new Date(Date.now() + expiryTimeInMs);

  Database.insertSingle<TblAppInvitation>({
    db: DB,
    table: "app_invitation",
    columnData: {
      app_id: app?.id,
      email,
      role_id: role?.id,
      external_partition_id: partitionId,
      external_organization_id: organizationId,
      expires_at: expiresAt,
    },
  });
  return true;
}

export async function acceptAppInvitation(id: number, user: IUser): Promise<boolean> {
  // Find app-invitation
  const invitation = await Database.getRecord<IAppInvitation>(`
    SELECT
      api.id AS id,
      api.app_id AS appId,
      api.external_partition_id AS externalPartitionId,
      api.external_organization_id AS externalOrganizationId,
      api.email AS email, 
      rle.slug AS roleSlug,
      api.expires_at AS expiresAt
    FROM ${DB}.app_invitation AS api
    LEFT JOIN ${DB}.role AS rle
      ON api.role_id = rle.id
    WHERE
      api.id = :id
      AND
      api.email = :email
  `, { id, email: user.email });

  // No invitation found
  if (!invitation) {
    return false;
  }

  // Check if invitation has expired
  if (invitation.expiresAt && dayjs(invitation.expiresAt).isBefore(new Date())) {
    return false;
  }

  // Check if user already has access to app
  const existingAccessToApp = await Database.query<TblUserApp>(`
    SELECT
      *
    FROM ${DB}.user_app
    WHERE
      user_id = :userId
      AND
      app_id = :appId
      ${invitation.externalOrganizationId
        ? "AND external_organization_id = :externalOrganizationId" : ""
      }
  `, {
    appId: invitation.appId,
    userId: user.id,
    externalOrganizationId: invitation.externalOrganizationId,
  });

  if (existingAccessToApp.length) {
    console.log(2);
    return false;
  }

  const role = await Database.getRecord<TblRole>(`
    SELECT * FROM ${DB}.role
    WHERE slug = :roleSlug  
  `, { roleSlug: invitation.roleSlug });

  // Remove invitation and connect app to user
  // Do it in transaction to prevent partial data 
  const result = await Database.write(async (connection) => {
    await Database.insertSingle<TblUserApp>({
      connection,
      db: DB,
      table: "user_app",
      columnData: {
        user_id: user.id,
        app_id: invitation.appId,
        role_id: role?.id,
        external_partition_id: invitation.externalPartitionId || null,
        external_organization_id: invitation.externalOrganizationId || null,
      },
    });

    await Database.deleteQuery(`
      DELETE FROM ${DB}.app_invitation
      WHERE id = :id
    `, { id }, { connection });

    return true;
  });

  return result === true;
}

export async function declineAppInvitation(id: number, user: IUser): Promise<void> {
  await Database.deleteQuery(`
    DELETE FROM ${DB}.app_invitation
    WHERE
      id = :id
      AND
      email = :email
  `, { id, email: user.email });
}

export async function getAppInvitations(user: IUser): Promise<IAppInvitation[]> {
  const result = await Database.query<IAppInvitation>(`
    SELECT
      api.id,
      api.app_id AS appId,
      app.name AS appName,
      app.description AS appDescription,
      api.external_organization_id AS externalOrganizationId,
      rle.slug AS roleSlug,
      api.email, 
      api.expires_at AS expiresAt
    FROM ${DB}.app_invitation AS api
    INNER JOIN ${DB}.app AS app
      ON api.app_id = app.id
    LEFT JOIN ${DB}.role AS rle
      ON api.role_id = rle.id
    WHERE
      email = :email

  `, { email: user.email });

	return result;
}

/**
 * Designed to be used by external app
 * @param appId 
 * @param externalOrganizationId 
 * @param requestedBy 
 * @returns 
 */
export async function getAppInvitationsForOrganization(appId: number, externalOrganizationId: number, requestedBy: IUser) {
  const app = requestedBy.apps.find((e) => e.appId === appId && e.externalOrganizationId === externalOrganizationId);
  if (app?.role && !["super_admin", "admin", "manager"].includes(app.role)) {
    return [];
  }
  const result = await Database.query<IAppInvitation>(`
    SELECT
      api.id AS id,
      api.app_id AS appId,
      api.external_partition_id AS externalPartitionId,
      api.external_organization_id AS externalOrganizationId,
      rle.slug as roleSlug,
      api.email AS email, 
      api.expires_at AS expiresAt,
    FROM ${DB}.app_invitation as api
    INNER JOIN ${DB}.role AS rle
      ON api.role_id = rle.id
    WHERE
      app_id = :appId
      AND
      external_organization_id = :externalOrganizationId
  `, { appId, externalOrganizationId });

	return result;
}

/**
 * Designed to be used by external app
 * @param appId 
 * @param externalOrganizationId 
 * @param requestedBy 
 * @returns 
 */
export async function getAppUsersForOrganization(appId: number, externalOrganizationId: number, user: IUser) {
  const app = user.apps.find((e) => {
    return e.appId === appId && e.externalOrganizationId === externalOrganizationId;
  });
  if (app?.role && !["super_admin", "admin", "manager"].includes(app.role)) {
    return [];
  }
  const result = await Database.query<IAppUser>(`
    SELECT
      usa.user_id AS id,
      usr.email AS email,
      usa.role AS role,
      usd.first_name AS firstName,
      usd.last_name AS lastName, 
    FROM ${DB}.user_app AS usa
    INNER JOIN ${DB}.user AS usr
      ON usa.user_id = usr.id
    LEFT JOIN ${DB}.user_details AS usd
      ON usa.user_id = usd.user_id
    WHERE
      app_id = :appId
      AND
      external_organization_id = :externalOrganizationId
  `, { appId, externalOrganizationId });
	return result;
}
