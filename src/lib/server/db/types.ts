import { InferSelectModel } from "drizzle-orm";
import * as schema from "./schema";

export type TblUser = InferSelectModel<typeof schema.userTable>;
export type TblRole = InferSelectModel<typeof schema.roleTable>;
export type TblUserDetails = InferSelectModel<typeof schema.userDetailsTable>;
export type TblSession = InferSelectModel<typeof schema.sessionTable>;
export type TblPasswordResetSession = InferSelectModel<typeof schema.passwordResetSessionTable>;
export type TblEmailVerificationRequest = InferSelectModel<typeof schema.emailVerificationRequestTable>;
export type TblApp = InferSelectModel<typeof schema.appTable>;
export type TblUserApp = InferSelectModel<typeof schema.userAppTable>;
export type TblAppInvitation = InferSelectModel<typeof schema.appInvitationTable>;

// Types derived from enums
export type UserRole = typeof schema.userRolesEnum.enumValues[number];
export type UserAppRole = typeof schema.userAppRolesEnum.enumValues[number];
export type Role = UserRole | UserAppRole; // "super_admin" | "admin" | "user" | "manager" | "guest"


export type TblNewUser = typeof schema.userTable.$inferInsert;
export type TblNewUserDetails = typeof schema.userDetailsTable.$inferInsert;
export type TblNewAppInvitation = typeof schema.appInvitationTable.$inferInsert;

export interface IApp {
  id: number;
  slug: string;
  url: string | null;
  name: string;
  description: string | null;
}

export interface IUserAppItem {
  appId: number;
  appSlug: string;
  externalPartitionId: number;
  externalOrganizationId: number;
  externalId: number;
  role: Role;
}

export interface IAppUser {
  id: number;
  email: string
  role: string;
  firstName: string | null;
  lastName: string | null;
}

export interface IAppInvitation {
  id: number;
  appId: number;
  appName: string | null;
  appDescription: string | null;
  externalPartitionId: number | null;
  externalOrganizationId: number | null;
  roleSlug: string | null;
  email: string;
  expiresAt: Date | null;
}

export interface ISessionFlags {
	twoFactorVerified: boolean;
}

export interface ISession extends ISessionFlags {
  id: string;
  userId: number;
  expiresAt: Date;
}

export interface IPasswordResetSession {
  id: string;
  userId: number;
  email: string;
  code: string;
  expiresAt: Date;
  emailVerified: boolean;
  twoFactorVerified: boolean;
}

export interface IEmailVerificationRequest {
  id: string;
  userId: number;
  email: string;
  code: string;
  expiresAt: Date;
}

export interface IUser  {
  id: number;
  email: string;
  role: Role | null;
  firstName: string | null;
  lastName: string | null;
  apps: IUserAppItem[];
  emailVerified: boolean;
  registered2FA: boolean;
}
