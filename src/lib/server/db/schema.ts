/***** IMPORTANT! ***************************************************************/
/**
 * You need to comment this out when generating the migration-file.
 */
// import "server-only";
/********************************************************************************/

import { Pool } from "pg";
import { pgTable, serial, text, integer, timestamp, varchar, boolean, customType, pgEnum } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/node-postgres";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
export const db = drizzle(pool);

// Custom types
const bytea = customType<{ data: Uint8Array; notNull: false; default: false }>({
  dataType() {
    return "bytea";
  },
  toDriver(val) {
    return val;
  },
  fromDriver(val: unknown) {
    return val as Uint8Array;
  },
});

// Enums
export const userRolesEnum = pgEnum("enum_user_roles", ["super_admin", "admin", "user"]);
export const userAppRolesEnum = pgEnum("enum_user_app_roles", ["super_admin", "admin", "manager", "user", "guest"]);

// Tables
export const userTable = pgTable("user", {
	id: serial("id")
    .primaryKey(),
  email: varchar("email")
    .notNull()
    .unique(),
  passwordHash: varchar("password_hash")
    .notNull(),
	emailVerified: boolean("email_verified")
    .notNull()
    .default(false),
  totpKey: bytea("totp_key"),
  recoveryCode: bytea("recovery_code")
    .notNull(),
  role: userRolesEnum()
    .default("user"),
});

export const sessionTable = pgTable("session", {
	id: text("id")
    .primaryKey(),
	userId: integer("user_id")
		.notNull()
		.references(() => userTable.id),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" })
    .notNull(),
  twoFactorVerified: boolean("two_factor_verified")
    .notNull()
    .default(false),
});

export const passwordResetSessionTable = pgTable("password_reset_session", {
	id: text("id")
    .primaryKey(),
	userId: integer("user_id")
		.notNull()
		.references(() => userTable.id),
  email: varchar("email")
    .notNull(),
  code: varchar("code")
    .notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" })
    .notNull(),
  emailVerified: boolean("email_verified")
    .notNull()
    .default(false),
  twoFactorVerified: boolean("two_factor_verified")
    .notNull()
    .default(false),
});

export const emailVerificationRequestTable = pgTable("email_verification_request", {
	id: text("id")
    .primaryKey(),
	userId: integer("user_id")
		.notNull()
		.references(() => userTable.id),
  email: varchar("email")
    .notNull(),
  code: varchar("code")
    .notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" })
    .notNull(),
});

export const appTable = pgTable("app", {
	id: serial("id")
    .primaryKey(),
  code: varchar("code")
    .notNull(),
  url: varchar("url")
    .notNull(),
  name: varchar("name")
    .notNull(),
  description: text("description")
    .notNull(),
});

export const userAppTable = pgTable("user_app", {
	userId: integer("user_id")
		.notNull()
		.references(() => userTable.id),
  appId: integer("app_id")
    .notNull()
    .references(() => userTable.id),
  externalId: varchar()
    .notNull(),
  role: userAppRolesEnum()
    .default("user"),
});

export const appInvitationTable = pgTable("app_invitation", {
	id: text("id")
    .primaryKey(),
  appId: integer("app_id")
    .notNull()
    .references(() => userTable.id),
	userId: integer("user_id")
		.notNull()
		.references(() => userTable.id),
  externalId: varchar()
    .notNull(),
  role: userAppRolesEnum()
    .default("user"),
  email: varchar("email")
    .notNull(),
  code: varchar("code")
    .notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" })
    .notNull(),
});
