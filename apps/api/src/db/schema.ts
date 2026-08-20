import { relations } from 'drizzle-orm'
import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'

export const batchStageEnum = pgEnum('BatchStageEnum', ['seed', 'prick', 'pot', 'plant'])
export const seasonEnum = pgEnum('SeasonEnum', ['winter', 'spring', 'summer', 'autumn'])
export const roleEnum = pgEnum('Role', ['USER', 'MANAGER', 'SUPER_ADMIN'])

const timestamps = {
  createdAt: timestamp('createdAt', { precision: 3, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).notNull().defaultNow(),
}

export const organisations = pgTable('organisations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  ...timestamps,
})

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  organisationId: integer('organisationId')
    .notNull()
    .references(() => organisations.id, { onDelete: 'cascade' }),
  role: roleEnum('role').notNull().default('USER'),
  tokenVersion: integer('tokenVersion').notNull().default(0),
  emailVerified: boolean('emailVerified').notNull().default(false),
  invitationToken: text('invitationToken').unique(),
  invitationExpires: timestamp('invitationExpires', { precision: 3, mode: 'date' }),
  notes: text('notes'),
  ...timestamps,
})

export const species = pgTable('species', {
  id: serial('id').primaryKey(),
  botanicalName: text('botanicalName'),
  commonName: text('commonName'),
  maoriName: text('maoriName'),
  threatenedSpecies: boolean('threatenedSpecies').notNull().default(false),
  treesThatCount: boolean('treesThatCount').notNull().default(false),
  notes: text('notes'),
  ...timestamps,
})

export const sites = pgTable('sites', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  region: text('region'),
  coordinates: text('coordinates'),
  area: numeric('area', { precision: 10, scale: 2 }),
  owner: text('owner'),
  type: text('type'),
  notes: text('notes'),
  organisationId: integer('organisationId')
    .notNull()
    .references(() => organisations.id, { onDelete: 'cascade' }),
  ...timestamps,
})

export const nurseries = pgTable('nurseries', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  organisationId: integer('organisationId')
    .notNull()
    .references(() => organisations.id, { onDelete: 'cascade' }),
  ...timestamps,
})

export const batches = pgTable('batches', {
  id: serial('id').primaryKey(),
  speciesId: integer('speciesId')
    .notNull()
    .references(() => species.id, { onDelete: 'cascade' }),
  quantity: integer('quantity'),
  notes: text('notes'),
  nurseryId: integer('nurseryId')
    .notNull()
    .references(() => nurseries.id, { onDelete: 'cascade' }),
  origin: text('origin'),
  stage: batchStageEnum('stage'),
  isOrder: boolean('isOrder').notNull().default(false),
  completedAt: timestamp('completedAt', { precision: 3, mode: 'date' }),
  ...timestamps,
})

export const seasons = pgTable(
  'seasons',
  {
    id: serial('id').primaryKey(),
    siteId: integer('siteId')
      .notNull()
      .references(() => sites.id, { onDelete: 'cascade' }),
    organisationId: integer('organisationId')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    year: integer('year').notNull(),
    season: seasonEnum('season').notNull(),
    notes: text('notes'),
    ...timestamps,
  },
  (table) => [unique().on(table.siteId, table.year, table.season)],
)

export const allotments = pgTable('allotments', {
  id: serial('id').primaryKey(),
  batchId: integer('batchId')
    .notNull()
    .references(() => batches.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull(),
  seasonId: integer('seasonId')
    .notNull()
    .references(() => seasons.id, { onDelete: 'cascade' }),
  ...timestamps,
})

export const organisationSpecies = pgTable(
  'organisation_species',
  {
    id: serial('id').primaryKey(),
    organisationId: integer('organisationId')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    speciesId: integer('speciesId')
      .notNull()
      .references(() => species.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (table) => [unique().on(table.organisationId, table.speciesId)],
)

export const organisationsRelations = relations(organisations, ({ many }) => ({
  users: many(users),
  sites: many(sites),
  nurseries: many(nurseries),
  seasons: many(seasons),
  organisationSpecies: many(organisationSpecies),
}))

export const usersRelations = relations(users, ({ one }) => ({
  organisation: one(organisations, {
    fields: [users.organisationId],
    references: [organisations.id],
  }),
}))

export const speciesRelations = relations(species, ({ many }) => ({
  batches: many(batches),
  organisationSpecies: many(organisationSpecies),
}))

export const sitesRelations = relations(sites, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [sites.organisationId],
    references: [organisations.id],
  }),
  seasons: many(seasons),
}))

export const nurseriesRelations = relations(nurseries, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [nurseries.organisationId],
    references: [organisations.id],
  }),
  batches: many(batches),
}))

export const batchesRelations = relations(batches, ({ one, many }) => ({
  species: one(species, {
    fields: [batches.speciesId],
    references: [species.id],
  }),
  nursery: one(nurseries, {
    fields: [batches.nurseryId],
    references: [nurseries.id],
  }),
  allotments: many(allotments),
}))

export const seasonsRelations = relations(seasons, ({ one, many }) => ({
  site: one(sites, {
    fields: [seasons.siteId],
    references: [sites.id],
  }),
  organisation: one(organisations, {
    fields: [seasons.organisationId],
    references: [organisations.id],
  }),
  allotments: many(allotments),
}))

export const allotmentsRelations = relations(allotments, ({ one }) => ({
  batch: one(batches, {
    fields: [allotments.batchId],
    references: [batches.id],
  }),
  season: one(seasons, {
    fields: [allotments.seasonId],
    references: [seasons.id],
  }),
}))

export const organisationSpeciesRelations = relations(organisationSpecies, ({ one }) => ({
  organisation: one(organisations, {
    fields: [organisationSpecies.organisationId],
    references: [organisations.id],
  }),
  species: one(species, {
    fields: [organisationSpecies.speciesId],
    references: [species.id],
  }),
}))

export const schema = {
  organisations,
  users,
  species,
  sites,
  nurseries,
  batches,
  seasons,
  allotments,
  organisationSpecies,
  organisationsRelations,
  usersRelations,
  speciesRelations,
  sitesRelations,
  nurseriesRelations,
  batchesRelations,
  seasonsRelations,
  allotmentsRelations,
  organisationSpeciesRelations,
}
