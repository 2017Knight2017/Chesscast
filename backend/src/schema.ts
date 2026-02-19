import {
	pgTable,
	timestamp,
	text,
	integer,
	uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const matches = pgTable('matches', {
	id:                  uuid('id').primaryKey().defaultRandom(),
	whitePlayer:         text('white_player').notNull(),
	blackPlayer:         text('black_player').notNull(),
	status:              text('status').$type<'waiting' | 'in_progress' | 'finished'>().default('waiting'),
	timeControl:         integer('time_control').notNull(), 
	increment:           integer('increment').default(0),    
	createdAt:           timestamp('created_at').defaultNow(),
});

export const analysis = pgTable('analysis', {
	id:               uuid('id').defaultRandom().primaryKey(),
	author:           text('author').notNull(),
	pgn:              text("pgn").notNull(),
	durations:        integer('durations').array().notNull().default(sql`'{}'::integer[]`),
	evaluations:      integer('evaluations').array().notNull().default(sql`'{}'::integer[]`),
	notation:         text('notation').array().notNull().default(sql`'{}'::text[]`),
	createdAt:        timestamp('created_at').notNull().defaultNow(),
});

export const moves = pgTable('moves', {
	id:                 uuid('id').primaryKey().defaultRandom(),
	matchId:            uuid('match_id').references(() => matches.id),
	moveNumber:         integer('move_number').notNull(),
	notation:           text('notation').notNull(),
	playedBy:           uuid('played_by'),
	createdAt:          timestamp('created_at').defaultNow(),
	remainingTime:      integer('remaining_time'), 
});

export const users = pgTable('users', {
	nickname:           text('nickname'),
	broadcastsPlanned:  uuid('broadcasts_planned').references(() => matches.id)
});