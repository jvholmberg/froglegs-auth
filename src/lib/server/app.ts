/***** IMPORTANT! ***************************************************************/
import "server-only";
/********************************************************************************/

import dayjs from "dayjs";
import { IApp, IAppInvitation, IAppUser, IUser, Role, TblNewAppInvitation } from "./db/types";
import db, { schema } from "@/lib/server/db";
import { getRole } from "./role";
import { IUpdateUserAppFormData } from "@/app/(signed-in)/admin/schema";
import { and, eq, or } from "drizzle-orm";

export async function updateUserApp(
  appId: number,
  userId: number,
  formData: IUpdateUserAppFormData,
): Promise<boolean> {
  const [result] = await db
    .update(schema.userAppTable)
    .set({
      externalPartitionId: formData.partitionId,
      ...(formData.organizationId ? { external_organization_id: formData.organizationId } : {}),
      ...(formData.accountId ? { external_id: formData.accountId } : {}),
    })
    .where(and(
      eq(schema.userAppTable.appId, appId),
      eq(schema.userAppTable.userId, userId),
    ))
    .returning()

  return !!result;
}

export async function getApps(): Promise<IApp[]> {
  const result = await db
    .select()
    .from(schema.appTable);

	return result;
}

export async function getApp(options: {
  id?: number;
  slug?: string;
}): Promise<IApp | null> {
  const [result] = await db
    .select()
    .from(schema.appTable)
    .where(and(
      options.id ? eq(schema.appTable.id, options.id) : undefined,
      options.slug ? eq(schema.appTable.slug, options.slug) : undefined,
    ))
    .limit(1);

	return result;
}

export async function getAppsForUser(userId: number | null | undefined): Promise<IApp[]> {
  if (!userId) {
    return [];
  }

  const result = await db
    .select({
      id: schema.appTable.id,
      slug: schema.appTable.slug,
      url: schema.appTable.url,
      name: schema.appTable.name,
      description: schema.appTable.description,
    })
    .from(schema.userAppTable)
    .innerJoin(schema.appTable, eq(schema.userAppTable.appId, schema.appTable.id))
    .where(eq(schema.userAppTable.userId, userId))
    .groupBy(schema.appTable.id);

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
  if (!app) {
    return false;
  }

  const role = roleSlug
    ? await getRole({ slug: roleSlug })
    : null;
  const expiryTimeInMs = 1000 * 60 * 60 * 24 * 30;
  const expiresAt = new Date(Date.now() + expiryTimeInMs);

  await db
    .insert(schema.appInvitationTable)
    .values({
      appId: app?.id,
      email,
      roleId: role?.id,
      externalPartitionId: partitionId,
      externalOrganizationId: organizationId,
      expiresAt,
    } as TblNewAppInvitation);
    
  return true;
}

export async function acceptAppInvitation(id: number, user: IUser): Promise<boolean> {

  const [invitation] = await db
    .select({
      id: schema.appInvitationTable.id,
      appId: schema.appInvitationTable.appId,
      externalPartitionId: schema.appInvitationTable.externalPartitionId,
      externalOrganizationId: schema.appInvitationTable.externalOrganizationId,
      email: schema.appInvitationTable.email,
      roleSlug: schema.roleTable.slug,
      expiresAt: schema.appInvitationTable.expiresAt,
    })
    .from(schema.appInvitationTable)
    .leftJoin(schema.roleTable, eq(schema.appInvitationTable.roleId, schema.roleTable.id))
    .where(and(
      eq(schema.appInvitationTable.id, id),
      eq(schema.appInvitationTable.email, user.email),
    ))
    .limit(1);

  // No invitation found
  if (!invitation) {
    return false;
  }

  // Check if invitation has expired
  if (invitation.expiresAt && dayjs(invitation.expiresAt).isBefore(new Date())) {
    return false;
  }

  // Check if user already has access to app
  const existingAccessToApp = await db
    .select()
    .from(schema.userAppTable)
    .where(and(
      eq(schema.userAppTable.userId, user.id),
      eq(schema.userAppTable.appId, invitation.appId),
      invitation.externalOrganizationId
        ? eq(schema.userAppTable.externalOrganizationId, invitation.externalOrganizationId)
        : undefined
    ))
    .limit(1);

  if (existingAccessToApp.length) {
    console.log(2);
    return false;
  }

  const role = await getRole({ slug: invitation.roleSlug });

  // Remove invitation and connect app to user
  // Do it in transaction to prevent partial data
  const result = await db.transaction(async (tx) => {
    await tx
      .insert(schema.userAppTable)
      .values({
        userId: user.id,
        appId: invitation.appId,
        roleId: role?.id,
        externalPartitionId: invitation.externalPartitionId,
        externalOrganizationId: invitation.externalOrganizationId,
      });

    await tx
      .delete(schema.appInvitationTable)
      .where(eq(schema.appInvitationTable.id, id));

    return true;
  });

  return result === true;
}

export async function declineAppInvitation(id: number, user: IUser): Promise<void> {
  await db
    .delete(schema.appInvitationTable)
    .where(and(
      eq(schema.appInvitationTable.id, id),
      eq(schema.appInvitationTable.email, user.email),
    ));
}

export async function getAppInvitations(user: IUser): Promise<IAppInvitation[]> {
  const result = await db
    .select({
      id: schema.appInvitationTable.id,
      appId: schema.appInvitationTable.appId,
      appName: schema.appTable.name,
      appDescription: schema.appTable.description,
      externalPartitionId: schema.appInvitationTable.externalPartitionId,
      externalOrganizationId: schema.appInvitationTable.externalOrganizationId,
      roleSlug: schema.roleTable.slug,
      email: schema.appInvitationTable.email,
      expiresAt: schema.appInvitationTable.expiresAt,
    })
    .from(schema.appInvitationTable)
    .innerJoin(schema.appTable, eq(schema.appInvitationTable.appId, schema.appTable.id))
    .leftJoin(schema.roleTable, eq(schema.appInvitationTable.roleId, schema.roleTable.id))
    .where(eq(schema.appInvitationTable.email, user.email));

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
  const result = await db
    .select({
      id: schema.appInvitationTable.id,
      appId: schema.appInvitationTable.appId,
      externalPartitionId: schema.appInvitationTable.externalPartitionId,
      externalOrganizationId: schema.appInvitationTable.externalOrganizationId,
      roleSlug: schema.roleTable.slug,
      email: schema.appInvitationTable.email,
      expiresAt: schema.appInvitationTable.expiresAt,
    })
    .from(schema.appInvitationTable)
    .innerJoin(schema.roleTable, eq(schema.appInvitationTable.roleId, schema.roleTable.id))
    .where(and(
      eq(schema.appInvitationTable.appId, appId),
      eq(schema.appInvitationTable.externalOrganizationId, externalOrganizationId),
    ));

	return result;
}

/**
 * Designed to be used by external app
 * @param appId 
 * @param externalOrganizationId 
 * @param requestedBy 
 * @returns 
 */
export async function getAppUsersForOrganization(appId: number, externalOrganizationId: number, user: IUser): Promise<IAppUser[]> {
  const app = user.apps.find((e) => {
    return e.appId === appId && e.externalOrganizationId === externalOrganizationId;
  });
  if (app?.role && !["super_admin", "admin", "manager"].includes(app.role)) {
    return [];
  }

  const result = await db
    .select({
      id: schema.userAppTable.userId,
      email: schema.userTable.email,
      role: schema.roleTable.slug,
      firstName: schema.userDetailsTable.firstName,
      lastName: schema.userDetailsTable.lastName,
    })
    .from(schema.userAppTable)
    .innerJoin(schema.userTable, eq(schema.userAppTable.userId, schema.userTable.id))
    .leftJoin(schema.userDetailsTable, eq(schema.userAppTable.userId, schema.userDetailsTable.userId))
    .where(and(
      eq(schema.userAppTable.appId, appId),
      eq(schema.userAppTable.externalOrganizationId, externalOrganizationId),
    ));

	return result;
}
