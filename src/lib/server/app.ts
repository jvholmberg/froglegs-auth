import { and, eq, or } from "drizzle-orm";
import { db, userDetailsTable, appInvitationTable, userAppTable, userTable, appTable } from "./db/schema";
import { IUser, UserAppRole } from "./user";
import { getCurrentSession } from "./session";
import dayjs from "dayjs";

export async function getApps(): Promise<IApp[]> {
  const result = await db
    .select()
    .from(appTable);

	return result;
}

export async function getMyApps(user: IUser): Promise<IApp[]> {
  const result = await db
    .select({ app: appTable })
    .from(userAppTable)
    .innerJoin(appTable, eq(userAppTable.appId, appTable.id))
    .where(eq(userAppTable.userId, user.id));
	return result.map((e) => e.app);
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
  const invitation = (await db
    .select({
      appId: appInvitationTable.appId,
      userId: userTable.id,
      role: appInvitationTable.role,
      externalOrganizationId: appInvitationTable.externalOrganizationId,
      externalId: appInvitationTable.externalId,
      expiresAt: appInvitationTable.expiresAt,
    })
    .from(appInvitationTable)
    .innerJoin(userTable, eq(appInvitationTable.email, userTable.email))
    .where(
      and(
        eq(appInvitationTable.id, id),
        eq(appInvitationTable.email, user.email),
      ),
    )).at(0);

  if (!invitation) {
    return false;
  }

  if (invitation.expiresAt && dayjs(invitation.expiresAt).isBefore(new Date())) {
    return false;
  }

  // Check if user already has access to app
  const exists = !!(await db
    .select()
    .from(userAppTable)
    .where(
      and(
        eq(userAppTable.appId, invitation.appId),
        eq(userAppTable.userId, user.id),
        invitation.externalOrganizationId
          ? eq(userAppTable.externalOrganizationId, invitation.externalOrganizationId)
          : undefined
      ),
    )).length;

  if (exists) {
    return false;
  }

  // Remove invitation and connect app to user
  // Do it in transaction to prevent partial data 
  await db.transaction(async (tx) => {
    await tx
      .insert(userAppTable)
      .values({
        appId: invitation.appId,
        userId: invitation.userId,
        role: invitation.role,
        externalOrganizationId: invitation.externalOrganizationId,
        externalId: invitation.externalId,
      });
    await tx
      .delete(appInvitationTable)
      .where(
        eq(appInvitationTable.id, id)
      );
  });

  return true;
}

export async function declineAppInvitation(id: number, user: IUser): Promise<void> {
  await db
    .delete(appInvitationTable)
    .where(
      and(
        eq(appInvitationTable.id, id),
        eq(appInvitationTable.email, user.email),
      )
    );
}

export async function getMyAppInvitations(): Promise<IAppInvitation[]> {
  const { user } = await getCurrentSession();

  const result = await db
    .select({
      id: appInvitationTable.id,
      appName: appTable.name,
      appDescription: appTable.description,
      firstName: userDetailsTable.firstName,
      lastName: userDetailsTable.lastName,
      email: appInvitationTable.email,
      role: appInvitationTable.role,
      expiresAt: appInvitationTable.expiresAt,
    })
    .from(appInvitationTable)
    .innerJoin(userTable, eq(appInvitationTable.email, userTable.email))
    .innerJoin(appTable, eq(appInvitationTable.appId, appTable.id))
    .leftJoin(userDetailsTable, eq(userTable.id, userDetailsTable.userId))
    .where(
      or(
        eq(userTable.id, user?.id || 0),
        eq(appInvitationTable.email, user?.email || ""),
      )
    );

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
  const result = await db
    .select({
      id: appInvitationTable.id,
      appName: appTable.name,
      appDescription: appTable.description,
      firstName: userDetailsTable.firstName,
      lastName: userDetailsTable.lastName,
      email: appInvitationTable.email,
      role: appInvitationTable.role,
      expiresAt: appInvitationTable.expiresAt,
    })
    .from(appInvitationTable)
    .innerJoin(userTable, eq(appInvitationTable.email, userTable.email))
    .innerJoin(appTable, eq(appInvitationTable.appId, appTable.id))
    .leftJoin(userDetailsTable, eq(userTable.id, userDetailsTable.userId))
    .where(
      and(
        eq(appInvitationTable.appId, appId),
        eq(appInvitationTable.externalOrganizationId, externalOrganizationId),
      )
    );
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
  const result = await db
    .select({
      id: userTable.id,
      email: userTable.email,
      role: userAppTable.role,
      firstName: userDetailsTable.firstName,
      lastName: userDetailsTable.lastName
    })
    .from(userAppTable)
    .innerJoin(userTable, eq(userAppTable.userId, userTable.id))
    .leftJoin(userDetailsTable, eq(userAppTable.userId, userDetailsTable.userId))
    .where(
      and(
        eq(userAppTable.appId, appId),
        eq(userAppTable.externalOrganizationId, externalOrganizationId),
      )
    );
	return result;
}

export interface IApp {
  id: number;
  code: string;
  url: string;
  name: string;
  description: string;
}

export interface IAppInvitation {
  id: number;
  appName: string;
  appDescription: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: "super_admin" | "admin" | "manager" | "user" | "guest" | null;
  expiresAt: Date | null;
}
