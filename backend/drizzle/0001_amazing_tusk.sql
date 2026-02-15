ALTER TABLE "broadcasts" RENAME COLUMN "durations_data" TO "durations";--> statement-breakpoint
ALTER TABLE "broadcasts" ALTER COLUMN "evaluations" SET DATA TYPE integer[];--> statement-breakpoint
ALTER TABLE "broadcasts" ALTER COLUMN "evaluations" SET DEFAULT '{}'::integer[];