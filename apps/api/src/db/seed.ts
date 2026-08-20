import 'dotenv/config'
import { eq } from 'drizzle-orm'
import { db } from './index.js'
import { hashPassword } from '../lib/password.js'
import {
  organisations,
  users,
  species,
  organisationSpecies,
  sites,
  nurseries,
  batches,
  seasons,
  allotments,
} from './schema.js'

async function main() {
  console.log('Starting database seeding...')

  const [organisation] = await db
    .insert(organisations)
    .values({ name: 'Re-Tree Aotearoa' })
    .onConflictDoNothing({ target: organisations.name })
    .returning()

  const org =
    organisation ??
    (await db.query.organisations.findFirst({
      where: eq(organisations.name, 'Re-Tree Aotearoa'),
    }))

  if (!org) {
    throw new Error('Failed to create or load organisation')
  }

  console.log(`Organisation: ${org.name}`)

  const hashedPassword = await hashPassword('password123')
  await db
    .insert(users)
    .values({
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
      organisationId: org.id,
      role: 'MANAGER',
      tokenVersion: 0,
      emailVerified: true,
    })
    .onConflictDoNothing({ target: users.email })

  console.log('Test user: test@example.com')

  const speciesData = [
    {
      botanicalName: 'Metrosideros excelsa',
      commonName: 'Pohutukawa',
      maoriName: 'Pohutukawa',
      threatenedSpecies: false,
      treesThatCount: true,
      notes: 'Iconic New Zealand native tree',
    },
    {
      botanicalName: 'Agathis australis',
      commonName: 'Kauri',
      maoriName: 'Kauri',
      threatenedSpecies: true,
      treesThatCount: true,
      notes: 'Ancient giant of the forest',
    },
    {
      botanicalName: 'Dacrycarpus dacrydioides',
      commonName: 'Kahikatea',
      maoriName: 'Kahikatea',
      threatenedSpecies: false,
      treesThatCount: true,
      notes: 'White pine, tallest native tree',
    },
    {
      botanicalName: 'Podocarpus totara',
      commonName: 'Totara',
      maoriName: 'Totara',
      threatenedSpecies: false,
      treesThatCount: true,
      notes: 'Long-lived native conifer',
    },
    {
      botanicalName: 'Beilschmiedia tawa',
      commonName: 'Tawa',
      maoriName: 'Tawa',
      threatenedSpecies: false,
      treesThatCount: true,
      notes: 'Large canopy tree',
    },
  ]

  const existingSpecies = await db.query.species.findMany()
  if (existingSpecies.length === 0) {
    await db.insert(species).values(speciesData)
  }

  const createdSpecies = await db.query.species.findMany()
  if (createdSpecies.length > 0) {
    await db
      .insert(organisationSpecies)
      .values(
        createdSpecies.map((row) => ({
          organisationId: org.id,
          speciesId: row.id,
        })),
      )
      .onConflictDoNothing()
  }

  console.log(`Species: ${createdSpecies.length}`)

  const siteData = [
    {
      name: 'Waitakere Ranges',
      region: 'Auckland',
      coordinates: '-36.8485, 174.7633',
      area: '16000.00',
      owner: 'Auckland Council',
      type: 'Regional Park',
      organisationId: org.id,
      notes: 'Large native forest area',
    },
    {
      name: 'Hunua Ranges',
      region: 'Auckland',
      coordinates: '-37.0882, 175.0703',
      area: '12000.00',
      owner: 'Auckland Council',
      type: 'Regional Park',
      organisationId: org.id,
      notes: 'Water catchment area',
    },
    {
      name: 'Tiritiri Matangi Island',
      region: 'Auckland',
      coordinates: '-36.6058, 174.8903',
      area: '220.00',
      owner: 'Department of Conservation',
      type: 'Scientific Reserve',
      organisationId: org.id,
      notes: 'Open sanctuary island',
    },
  ]

  const existingSites = await db.query.sites.findMany({
    where: eq(sites.organisationId, org.id),
  })
  if (existingSites.length === 0) {
    await db.insert(sites).values(siteData)
  }

  const existingNurseries = await db.query.nurseries.findMany({
    where: eq(nurseries.organisationId, org.id),
  })
  if (existingNurseries.length === 0) {
    await db.insert(nurseries).values([
      { name: 'Main Nursery', organisationId: org.id },
      { name: 'Coastal Nursery', organisationId: org.id },
    ])
  }

  const mainNursery = await db.query.nurseries.findFirst({
    where: eq(nurseries.name, 'Main Nursery'),
  })
  const coastalNursery = await db.query.nurseries.findFirst({
    where: eq(nurseries.name, 'Coastal Nursery'),
  })
  const pohutukawa = await db.query.species.findFirst({
    where: eq(species.botanicalName, 'Metrosideros excelsa'),
  })
  const kauri = await db.query.species.findFirst({
    where: eq(species.botanicalName, 'Agathis australis'),
  })
  const kahikatea = await db.query.species.findFirst({
    where: eq(species.botanicalName, 'Dacrycarpus dacrydioides'),
  })

  const existingBatches = await db.query.batches.findMany()
  if (existingBatches.length === 0 && mainNursery && coastalNursery) {
    await db.insert(batches).values([
      {
        speciesId: pohutukawa?.id ?? 1,
        nurseryId: mainNursery.id,
        origin: 'Waitakere Ranges',
        quantity: 500,
        stage: 'plant',
        notes: 'Healthy batch of pohutukawa seedlings',
      },
      {
        speciesId: kauri?.id ?? 2,
        nurseryId: mainNursery.id,
        origin: 'Hunua Ranges',
        quantity: 200,
        stage: 'pot',
        notes: 'Rare kauri seedlings for restoration',
      },
      {
        speciesId: kahikatea?.id ?? 3,
        nurseryId: coastalNursery.id,
        origin: 'Tiritiri Matangi',
        quantity: 300,
        stage: 'seed',
        notes: 'Kahikatea for wetland restoration',
      },
    ])
  }

  const waitakereSite = await db.query.sites.findFirst({
    where: eq(sites.name, 'Waitakere Ranges'),
  })
  const hunuaSite = await db.query.sites.findFirst({
    where: eq(sites.name, 'Hunua Ranges'),
  })
  const tiritiriSite = await db.query.sites.findFirst({
    where: eq(sites.name, 'Tiritiri Matangi Island'),
  })

  const existingSeasons = await db.query.seasons.findMany({
    where: eq(seasons.organisationId, org.id),
  })
  if (existingSeasons.length === 0 && waitakereSite && hunuaSite && tiritiriSite) {
    await db.insert(seasons).values([
      {
        siteId: waitakereSite.id,
        organisationId: org.id,
        year: 2024,
        season: 'spring',
        notes: 'Spring planting season at Waitakere Ranges',
      },
      {
        siteId: hunuaSite.id,
        organisationId: org.id,
        year: 2024,
        season: 'spring',
        notes: 'Spring planting season at Hunua Ranges',
      },
      {
        siteId: tiritiriSite.id,
        organisationId: org.id,
        year: 2024,
        season: 'summer',
        notes: 'Summer planting season at Tiritiri Matangi',
      },
    ])
  }

  const waitakereSeason = await db.query.seasons.findFirst({
    where: eq(seasons.siteId, waitakereSite?.id ?? -1),
  })
  const hunuaSeason = await db.query.seasons.findFirst({
    where: eq(seasons.siteId, hunuaSite?.id ?? -1),
  })
  const tiritiriSeason = await db.query.seasons.findFirst({
    where: eq(seasons.siteId, tiritiriSite?.id ?? -1),
  })
  const pohutukawaBatch = await db.query.batches.findFirst({
    where: eq(batches.origin, 'Waitakere Ranges'),
  })
  const kauriBatch = await db.query.batches.findFirst({
    where: eq(batches.origin, 'Hunua Ranges'),
  })
  const kahikateaBatch = await db.query.batches.findFirst({
    where: eq(batches.origin, 'Tiritiri Matangi'),
  })

  const existingAllotments = await db.query.allotments.findMany()
  if (
    existingAllotments.length === 0 &&
    waitakereSeason &&
    hunuaSeason &&
    tiritiriSeason &&
    pohutukawaBatch &&
    kauriBatch &&
    kahikateaBatch
  ) {
    await db.insert(allotments).values([
      { seasonId: waitakereSeason.id, batchId: pohutukawaBatch.id, quantity: 100 },
      { seasonId: waitakereSeason.id, batchId: kauriBatch.id, quantity: 50 },
      { seasonId: hunuaSeason.id, batchId: kauriBatch.id, quantity: 50 },
      { seasonId: tiritiriSeason.id, batchId: kahikateaBatch.id, quantity: 100 },
    ])
  }

  console.log('Database seeding completed successfully!')
}

main().catch((error) => {
  console.error('Error during seeding:', error)
  process.exit(1)
})
