CREATE TABLE "analysis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author" text NOT NULL,
	"pgn" text NOT NULL,
	"durations" integer[] DEFAULT '{}'::integer[] NOT NULL,
	"evaluations" integer[] DEFAULT '{}'::integer[] NOT NULL,
	"notation" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY NOT NULL,
	"white_player" text NOT NULL,
	"black_player" text NOT NULL,
	"history" text[] DEFAULT '{}'::text[] NOT NULL,
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
CREATE TABLE "users" (
	"nickname" text,
	"broadcasts_planned" uuid
);
--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_id_analysis_id_fk" FOREIGN KEY ("id") REFERENCES "public"."analysis"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moves" ADD CONSTRAINT "moves_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_broadcasts_planned_matches_id_fk" FOREIGN KEY ("broadcasts_planned") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;