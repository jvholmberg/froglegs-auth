ALTER TABLE "app_invitation" DROP CONSTRAINT "app_invitation_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "app_invitation" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "app_invitation" DROP COLUMN "code";