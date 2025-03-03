export type UserRole = "super_admin" | "admin" | "user";
export type UserAppRole = "super_admin" | "admin" | "manager" | "user" | "guest";

export interface TblRole {
  id: number;
  code: string;
  name: string;
  short_description: string;
  description: string;
}
export interface TblApp {
  id: number;
  code: string;
  url: string | null;
  name: string | null;
  description: string | null;
}

export interface TblAppInvitation {
  id: number;
  app_id: number;
  external_organization_id: string | null;
  external_user_id: string;
  role: UserAppRole | null;
  email: string;
  expires_at: Date | null;
}

export interface TblUser {
  id: number;
  email: string;
  password_hash: string;
  email_verified: boolean;
  totp_key: Uint8Array | null;
  recovery_code: Uint8Array;
  role_id: number | null;
}

export interface TblUserDetails {
  user_id: number;
  first_name: string | null;
  last_name: string | null;
}

export interface TblUserApp {
  user_id: number;
  app_id: number;
  external_organization_id: string | null;
  external_id: string | null;
  role_id: number;
}

export interface TblSession {
  id: string;
  user_id: number;
  expires_at: Date;
  two_factor_verified: boolean;
}

export interface TblPasswordResetSession {
  id: string;
  user_id: number;
  email: string;
  code: string;
  expires_at: Date;
  email_verified: boolean;
  two_factor_verified: boolean;
}

export interface TblEmailVerificationRequest {
  id: string;
  user_id: number;
  email: string;
  code: string;
  expires_at: Date;
}

export interface IUserAppItem {
  appId: number;
  externalOrganizationId: string | null;
  externalId: string | null;
  role: UserAppRole;
}

export interface IAppUser {
  id: number;
  email: string
  role: UserAppRole;
  firstName: string;
  lastName: string;
}

export interface IAppInvitation {
  id: number;
  appId: number;
  externalOrganizationId: string | null;
  externalId: string;
  role: UserAppRole | null;
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
  role: UserRole | null;
  firstName: string | null;
  lastName: string | null;
  apps: IUserAppItem[];
  emailVerified: boolean;
  registered2FA: boolean;
}
