CREATE TABLE "users" (
	"nickname" text,
	"broadcasts_planned" uuid
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_broadcasts_planned_matches_id_fk" FOREIGN KEY ("broadcasts_planned") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;