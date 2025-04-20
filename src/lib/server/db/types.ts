/***** IMPORTANT! ***************************************************************/
import "server-only";
/********************************************************************************/

import { Role } from "@/lib/types/role";

// Internal types

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
  role: Role;
  firstName: string;
  lastName: string;
}

export interface IAppInvitation {
  id: number;
  appId: number;
  appName: string | null;
  appDescription: string | null;
  externalPartitionId: number | null;
  externalOrganizationId: number | null;
  roleSlug: Role | null;
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

// External types

export interface EApiUser  {
  id: number;
  email: string;
  role: Role | null;
  firstName: string | null;
  lastName: string | null;
  apps: IUserAppItem[];
  emailVerified: boolean;
  registered2FA: boolean;
}
