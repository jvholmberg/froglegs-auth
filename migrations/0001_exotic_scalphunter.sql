ALTER TABLE "user_app" DROP CONSTRAINT "user_app_app_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "user_app" ADD CONSTRAINT "user_app_app_id_app_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."app"("id") ON DELETE no action ON UPDATE no action;