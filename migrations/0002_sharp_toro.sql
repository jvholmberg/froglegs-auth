ALTER TABLE "app_invitation" DROP CONSTRAINT "app_invitation_app_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "app_invitation" ADD CONSTRAINT "app_invitation_app_id_app_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."app"("id") ON DELETE no action ON UPDATE no action;