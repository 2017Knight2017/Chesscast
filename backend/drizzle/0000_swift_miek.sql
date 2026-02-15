CREATE TABLE "broadcasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author" text NOT NULL,
	"pgn" text NOT NULL,
	"durations_data" integer[] DEFAULT '{}'::integer[] NOT NULL,
	"evaluations" numeric(10, 2)[] DEFAULT '{}'::decimal[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
