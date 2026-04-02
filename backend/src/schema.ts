import {
  pgTable,
  timestamp,
  text,
  integer,
  uuid,
  varchar,
  serial,
  pgEnum,
  primaryKey,
  index,
  jsonb,
  unique,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const statusEnum = pgEnum("status", ['processing', 'waiting', 'in_progress', 'finished']);
export const outcomeEnum = pgEnum("outcome", ['1/2-1/2', '1-0', '0-1']);

export const users = pgTable('users', {
	id:                serial('id').primaryKey(),
	email:             varchar('email', { length: 32 }).notNull().unique(),
	username:          varchar('username', { length: 32 }).notNull().unique(),
	password:          text('password').notNull(),
	createdAt:         timestamp('created_at').defaultNow().notNull()
});

export const players = pgTable('players', {
	id:               serial('id').primaryKey(),
	name:             varchar('name', { length: 255 }).notNull().unique(),
	archetype:        text('archetype'),
}, (t) => [index('name_idx').on(t.name)] );

export const analysis = pgTable('analysis', {
	id:                  uuid('id').defaultRandom().primaryKey(),
	pgn:                 text("pgn").notNull(),
	timesRemaining:      integer('times_remaining').array().notNull().default(sql`'{}'::integer[]`),
	evaluations:         integer('evaluations').array().notNull().default(sql`'{}'::integer[]`),
	notation:            text('notation').array().notNull().default(sql`'{}'::text[]`),
  outcome:             outcomeEnum().notNull().default('1/2-1/2'),
  increment:           integer('increment').notNull().default(0),
  controlMove:         integer('control_move').notNull().default(0),
  bonusTimeMin:        integer('bonus_time_min').notNull().default(30),           
  newIncrement:        integer('new_increment').notNull().default(0),
  newControlMoveEvery: integer('new_control_move_every').notNull().default(0),
  timeControl:         integer('time_control').notNull().default(600),
  createdAt:           timestamp('created_at').notNull().defaultNow(),
});

export const matches = pgTable('matches', {
	id:                  uuid('id').primaryKey().references(() => analysis.id, { onDelete: 'cascade' }),
	author:              text('author').notNull().references(() => users.username, { onDelete: 'cascade' }),
	title:               text('title').notNull().default('Без названия'),
	whitePlayer:         text('white_player').notNull().references(() => players.name, { onDelete: 'cascade' }),
	blackPlayer:         text('black_player').notNull().references(() => players.name, { onDelete: 'cascade' }),
	whitePlayerTime:     integer('white_player_time').notNull().default(600000),
	blackPlayerTime:     integer('black_player_time').notNull().default(600000),
	moveIndex:           integer('move_index').notNull().default(0),
  lastControlMove:     integer('last_control_move').notNull().default(0),
	fen:                 text('fen').notNull().default('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),
	status:              statusEnum().notNull().default('processing'),
  newestMoveAt:        timestamp('newest_move_at'),
	scheduledAt:         timestamp('scheduled_time').notNull().defaultNow(),
	createdAt:           timestamp('created_at').notNull().defaultNow(),
},  (t) => [
    index('scheduled_at_idx').on(t.scheduledAt),
    index('status_idx').on(t.status),
]);

export const plannedBroadcasts = pgTable('planned_broadcasts', {
	userId:              integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	matchId:             uuid('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),
	}, (t) => [ primaryKey({ columns: [t.userId, t.matchId] }) ]
);

export const followedBroadcasts = pgTable('followed_broadcasts', {
  userId:              integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  matchId:             uuid('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),
}, (t) => [ primaryKey({ columns: [t.userId, t.matchId] }) ]
);

export const userAnalysis = pgTable('user_analysis', {
    id: serial('id').primaryKey(),
    matchId: uuid('match_id').references(() => matches.id).notNull(),
    userId: integer('user_id').references(() => users.id).notNull(),
    data: jsonb('data').notNull(),
    lastUpdated: timestamp('last_updated').defaultNow(),
  }, (t) => [unique('unique_user_match_analysis').on(t.matchId, t.userId)],
);
