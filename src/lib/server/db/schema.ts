import { pgTable, serial, text, integer, timestamp, varchar, boolean, customType, pgEnum, numeric } from "drizzle-orm/pg-core";

// Custom types
export const bytea = customType<{ data: Uint8Array; notNull: false; default: false }>({
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
export const themeTable = pgTable("theme", {
  slug: varchar("slug", { length: 20 })
    .primaryKey(),
  headerLogoUrl: varchar("header_logo_url", { length: 1000 }),
  footerLogoUrl: varchar("footer_logo_url", { length: 1000 }),
  backdropUrl: varchar("backdrop_url", { length: 1000 }),
  altText: varchar("alt_text", { length: 255 }),
  headerLogoHeight: integer("header_logo_height"),
  headerLogoWidth: integer("header_logo_width"),
  footerLogoHeight: integer("footer_logo_height"),
  footerLogoWidth: integer("footer_logo_width"),
  backdropPosition: varchar("backdrop_position", { length: 20 }),
});

export const roleTable = pgTable("role", {
  id: serial("id")
    .primaryKey(),
  slug: varchar("slug")
    .notNull()
    .unique(),
  rank: numeric("rank")
    .notNull(),
  name: varchar("name")
    .notNull(),
  shortDescription: text("short_description"),
  description: text("description"),
});

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
  roleId: integer("role_id")
    .references(() => roleTable.id, {
      onDelete: "set null",
      onUpdate: "no action",
    })
    .default(5),
});

export const userDetailsTable = pgTable("user_details", {
	userId: integer("user_id")
    .primaryKey()
		.references(() => userTable.id, {
      onDelete: "cascade",
      onUpdate: "no action",
    }),
  firstName: varchar("first_name")
    .notNull(),
  lastName: varchar("last_name")
    .notNull(),
});

export const sessionTable = pgTable("session", {
	id: varchar("id")
    .primaryKey(),
	userId: integer("user_id")
		.notNull()
		.references(() => userTable.id, {
      onDelete: "cascade",
      onUpdate: "no action",
    }),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" })
    .notNull(),
  twoFactorVerified: boolean("two_factor_verified")
    .notNull()
    .default(false),
  ipNumber: varchar("ip_number"),
});

export const passwordResetSessionTable = pgTable("password_reset_session", {
	id: varchar("id")
    .primaryKey(),
	userId: integer("user_id")
		.notNull()
		.references(() => userTable.id, {
      onDelete: "cascade",
      onUpdate: "no action",
    }),
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
	id: varchar("id")
    .primaryKey(),
	userId: integer("user_id")
		.notNull()
		.references(() => userTable.id, {
      onDelete: "cascade",
      onUpdate: "no action",
    }),
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
  slug: varchar("slug")
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
    .references(() => appTable.id, {
      onDelete: "cascade",
      onUpdate: "no action",
    }),
  roleId: integer("role_id")
    .references(() => roleTable.id, {
      onDelete: "set null",
      onUpdate: "no action",
    })
    .default(5),
  externalPartitionId: integer("external_partition_id"),
  externalOrganizationId: integer("external_organization_id"),
  externalId: integer("external_user_id"),
});

export const appInvitationTable = pgTable("app_invitation", {
	id: serial("id")
    .primaryKey(),
  appId: integer("app_id")
    .notNull()
    .references(() => appTable.id, {
      onDelete: "cascade",
      onUpdate: "no action",
    }),
  externalPartitionId: integer("external_partition_id"),
  externalOrganizationId: integer("external_organization_id"),
  email: varchar("email")
    .notNull(),
  roleId: integer("role_id")
    .references(() => roleTable.id, {
      onDelete: "set null",
      onUpdate: "no action",
    })
    .default(5),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
});
