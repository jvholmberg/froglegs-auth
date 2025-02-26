CREATE TYPE "public"."enum_user_app_roles" AS ENUM('super_admin', 'admin', 'manager', 'user', 'guest');--> statement-breakpoint
CREATE TYPE "public"."enum_user_roles" AS ENUM('super_admin', 'admin', 'user');--> statement-breakpoint
CREATE TABLE "app_invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"app_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"externalId" varchar NOT NULL,
	"role" "enum_user_app_roles" DEFAULT 'user',
	"email" varchar NOT NULL,
	"code" varchar NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar NOT NULL,
	"url" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_verification_request" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"email" varchar NOT NULL,
	"code" varchar NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"email" varchar NOT NULL,
	"code" varchar NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"two_factor_verified" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"two_factor_verified" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_app" (
	"user_id" integer NOT NULL,
	"app_id" integer NOT NULL,
	"externalId" varchar NOT NULL,
	"role" "enum_user_app_roles" DEFAULT 'user'
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"password_hash" varchar NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"totp_key" "bytea",
	"recovery_code" "bytea" NOT NULL,
	"role" "enum_user_roles" DEFAULT 'user',
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "app_invitation" ADD CONSTRAINT "app_invitation_app_id_user_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_invitation" ADD CONSTRAINT "app_invitation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_verification_request" ADD CONSTRAINT "email_verification_request_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_session" ADD CONSTRAINT "password_reset_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_app" ADD CONSTRAINT "user_app_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_app" ADD CONSTRAINT "user_app_app_id_user_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;