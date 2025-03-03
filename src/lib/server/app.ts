import { getCurrentSession } from "./session";
import dayjs from "dayjs";
import { IApp, IAppInvitation, IAppUser, IUser, TblRole, TblUserApp, UserAppRole } from "./db/types";
import * as Database from "@/lib/server/db/sql";
import { DB } from "./constants";

export async function getApps(): Promise<IApp[]> {
  const result = await Database.query<IApp>(`
    SELECT
      *
    FROM ${DB}.app
  `, {});
	return result;
}

export async function getMyApps(user: IUser): Promise<IApp[]> {
  const result = await Database.query<IApp>(`
    SELECT
      app.id AS id,
      app.code AS code,
      app.url AS url,
      app.name AS name,
      app.description AS description
    FROM ${DB}.user_app AS uap
    INNER JOIN ${DB}.app as app
      ON uap.app_id = app.id
    WHERE
      uap.user_id = :userId
  `, { userId: user.id })
	return result;
}

export async function createAppInvitation(
  appId: number,
  email: string,
  role: UserAppRole,
  externalOrganizationId?: string | null,
): Promise<boolean> {
  console.log(appId, email, role, externalOrganizationId);
  return true;
}

export async function acceptAppInvitation(id: number, user: IUser): Promise<boolean> {
  // Find app-invitation
  const invitation = await Database.getRecord<IAppInvitation>(`
    SELECT
      id AS id,
      app_id AS appId,
      role AS role,
      external_organization_id AS externalOrganizationId,
      external_id AS externalId, 
      email AS email, 
      expires_at AS expiresAt
    FROM ${DB}.app_invitation
    WHERE
      id = :id
      AND
      email = :email
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
    return false;
  }

  const role = await Database.getRecord<TblRole>(`
    SELECT * FROM ${DB}.role
    WHERE code = :role  
  `, { role: invitation.role });

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
        external_organization_id: invitation.externalOrganizationId,
        external_id: invitation.externalId,
        role_id: role?.id,
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

export async function getMyAppInvitations(): Promise<IAppInvitation[]> {
  const { user } = await getCurrentSession();
  if (!user) {
    return [];
  }
  const result = await Database.query<IAppInvitation>(`
    SELECT
      api.id,
      api.app_id AS appId,
      app.name AS appName,
      app.description AS appDescription,
      api.external_organization_id AS externalOrganizationId,
      api.external_id AS externalId, 
      api.role,
      api.email, 
      api.expires_at AS expiresAt
    FROM ${DB}.app_invitation AS api
    INNER JOIN ${DB}.app AS app
      ON api.app_id = app.id
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
export async function getAppInvitationsForOrganization(appId: number, externalOrganizationId: string, requestedBy: IUser) {
  const app = requestedBy.apps.find((e) => e.appId === appId && e.externalOrganizationId === externalOrganizationId);
  if (app?.role && !["super_admin", "admin", "manager"].includes(app.role)) {
    return [];
  }
  const result = await Database.query<IAppInvitation>(`
    SELECT
      id AS id,
      app_id AS appId,
      role as role,
      external_organization_id AS externalOrganizationId,
      external_id AS externalId, 
      email AS email, 
      expires_at AS expiresAt,
    FROM ${DB}.app_invitation
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
export async function getAppUsersForOrganization(appId: number, externalOrganizationId: string, requestedBy: IUser) {
  const app = requestedBy.apps.find((e) => e.appId === appId && e.externalOrganizationId === externalOrganizationId);
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
