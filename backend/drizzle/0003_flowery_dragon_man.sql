CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"white_player_id" uuid,
	"black_player_id" uuid,
	"status" text DEFAULT 'waiting',
	"time_control" integer NOT NULL,
	"increment" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "moves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid,
	"move_number" integer NOT NULL,
	"notation" text NOT NULL,
	"played_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"remaining_time" integer
);
--> statement-breakpoint
ALTER TABLE "moves" ADD CONSTRAINT "moves_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;