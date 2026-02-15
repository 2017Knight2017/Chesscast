import {
  pgTable,
  timestamp,
  text,
  integer,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const broadcasts = pgTable('broadcasts', {
  id:               uuid('id').defaultRandom().primaryKey(),
  author:           text('author').notNull(),
  pgn:              text("pgn").notNull(),
  durations:        integer('durations').array().notNull().default(sql`'{}'::integer[]`),
  evaluations:      integer('evaluations').array().notNull().default(sql`'{}'::integer[]`),
  createdAt:        timestamp('created_at').notNull().defaultNow(),
});