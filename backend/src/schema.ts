import {
	pgTable,
	timestamp,
	text,
	integer,
	uuid,
	varchar,
	serial,
	pgEnum
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const statusEnum = pgEnum("status", ['waiting', 'in_progress', 'finished']);

export const analysis = pgTable('analysis', {
	id:               uuid('id').defaultRandom().primaryKey(),
	author:           text('author').notNull(),
	pgn:              text("pgn").notNull(),
	durations:        integer('durations').array().notNull().default(sql`'{}'::integer[]`),
	evaluations:      integer('evaluations').array().notNull().default(sql`'{}'::integer[]`),
	notation:         text('notation').array().notNull().default(sql`'{}'::text[]`),
	createdAt:        timestamp('created_at').notNull().defaultNow(),
});

export const matches = pgTable('matches', {
	id:                  uuid('id').primaryKey().references(() => analysis.id, { onDelete: 'cascade' }),
	whitePlayer:         text('white_player').notNull(),
	blackPlayer:         text('black_player').notNull(),
	history:             text('history').array().notNull().default(sql`'{}'::text[]`),
	status:              statusEnum().default('waiting'),
	timeControl:         integer('time_control').notNull(), 
	increment:           integer('increment').default(0),    
	createdAt:           timestamp('created_at').defaultNow(),
});

export const users = pgTable('users', {
	id: serial('id').primaryKey(),
	email: varchar('email', { length: 255 }).notNull().unique(),
	username: varchar('username', { length: 255 }).notNull().unique(),
	password: text('password').notNull(),
});

export const plannedBroadcasts = pgTable('planned_broadcasts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  matchId: uuid('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),
});