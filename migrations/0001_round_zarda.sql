CREATE TABLE "user_details" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_details" ADD CONSTRAINT "user_details_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;