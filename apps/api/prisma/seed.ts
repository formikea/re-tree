import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma.js'

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create test organisation
  const organisation = await prisma.organisation.upsert({
    where: { name: 'Re-Tree Aotearoa' },
    update: {},
    create: {
      name: 'Re-Tree Aotearoa',
    },
  })

  console.log(`✅ Created organisation: ${organisation.name}`)

  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 10)
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
      organisationId: organisation.id,
      role: 'MANAGER',
      tokenVersion: 0,
      emailVerified: true,
    },
  })

  console.log(`✅ Created test user: ${user.email}`)

  // Create species
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

  const species = await prisma.species.createMany({
    data: speciesData,
    skipDuplicates: true,
  })

  console.log(`✅ Created ${species.count} species`)

  // Create OrganisationSpecies relationships
  const createdSpecies = await prisma.species.findMany()
  const organisationSpeciesData = createdSpecies.map(species => ({
    organisationId: organisation.id,
    speciesId: species.id,
  }))

  const organisationSpecies = await prisma.organisationSpecies.createMany({
    data: organisationSpeciesData,
    skipDuplicates: true,
  })

  console.log(`✅ Created ${organisationSpecies.count} organisation-species relationships`)

  // Create sites
  const siteData = [
    {
      name: 'Waitakere Ranges',
      region: 'Auckland',
      coordinates: '-36.8485, 174.7633',
      area: 16000.00,
      owner: 'Auckland Council',
      type: 'Regional Park',
      organisationId: organisation.id,
      notes: 'Large native forest area',
    },
    {
      name: 'Hunua Ranges',
      region: 'Auckland',
      coordinates: '-37.0882, 175.0703',
      area: 12000.00,
      owner: 'Auckland Council',
      type: 'Regional Park',
      organisationId: organisation.id,
      notes: 'Water catchment area',
    },
    {
      name: 'Tiritiri Matangi Island',
      region: 'Auckland',
      coordinates: '-36.6058, 174.8903',
      area: 220.00,
      owner: 'Department of Conservation',
      type: 'Scientific Reserve',
      organisationId: organisation.id,
      notes: 'Open sanctuary island',
    },
  ]

  const sites = await prisma.site.createMany({
    data: siteData,
    skipDuplicates: true,
  })

  console.log(`✅ Created ${sites.count} sites`)

  // Create nurseries
  const nurseryData = [
    {
      name: 'Main Nursery',
      organisationId: organisation.id,
    },
    {
      name: 'Coastal Nursery',
      organisationId: organisation.id,
    },
  ]

  const nurseries = await prisma.nursery.createMany({
    data: nurseryData,
    skipDuplicates: true,
  })

  console.log(`✅ Created ${nurseries.count} nurseries`)

  // Get nurseries for batch creation
  const mainNursery = await prisma.nursery.findFirst({
    where: { name: 'Main Nursery' }
  })
  const coastalNursery = await prisma.nursery.findFirst({
    where: { name: 'Coastal Nursery' }
  })

  // Get species for batch creation
  const pohutukawa = await prisma.species.findFirst({
    where: { botanicalName: 'Metrosideros excelsa' }
  })
  const kauri = await prisma.species.findFirst({
    where: { botanicalName: 'Agathis australis' }
  })
  const kahikatea = await prisma.species.findFirst({
    where: { botanicalName: 'Dacrycarpus dacrydioides' }
  })

  // Create batches
  const batchData = [
    {
      speciesId: pohutukawa?.id || 1,
      nurseryId: mainNursery?.id || 1,
      origin: 'Waitakere Ranges',
      quantity: 500,
      stage: 'plant' as const,
      notes: 'Healthy batch of pohutukawa seedlings',
    },
    {
      speciesId: kauri?.id || 2,
      nurseryId: mainNursery?.id || 1,
      origin: 'Hunua Ranges',
      quantity: 200,
      stage: 'pot' as const,
      notes: 'Rare kauri seedlings for restoration',
    },
    {
      speciesId: kahikatea?.id || 3,
      nurseryId: coastalNursery?.id || 2,
      origin: 'Tiritiri Matangi',
      quantity: 300,
      stage: 'seed' as const,
      notes: 'Kahikatea for wetland restoration',
    },
  ]

  const batches = await prisma.batch.createMany({
    data: batchData,
    skipDuplicates: true,
  })

  console.log(`✅ Created ${batches.count} batches`)

  // Get sites for season creation
  const waitakereSite = await prisma.site.findFirst({
    where: { name: 'Waitakere Ranges' }
  })
  const hunuaSite = await prisma.site.findFirst({
    where: { name: 'Hunua Ranges' }
  })
  const tiritiriSite = await prisma.site.findFirst({
    where: { name: 'Tiritiri Matangi Island' }
  })

  // Create seasons (replacing plantings)
  const seasonData = [
    {
      siteId: waitakereSite?.id || 1,
      organisationId: organisation.id,
      year: 2024,
      season: 'spring' as const,
      notes: 'Spring planting season at Waitakere Ranges',
    },
    {
      siteId: hunuaSite?.id || 2,
      organisationId: organisation.id,
      year: 2024,
      season: 'spring' as const,
      notes: 'Spring planting season at Hunua Ranges',
    },
    {
      siteId: tiritiriSite?.id || 3,
      organisationId: organisation.id,
      year: 2024,
      season: 'summer' as const,
      notes: 'Summer planting season at Tiritiri Matangi',
    },
  ]

  const seasons = await prisma.season.createMany({
    data: seasonData,
    skipDuplicates: true,
  })

  console.log(`✅ Created ${seasons.count} seasons`)

  // Get seasons and batches for allotment creation
  const waitakereSeason = await prisma.season.findFirst({
    where: { 
      site: { name: 'Waitakere Ranges' },
      year: 2024,
      season: 'spring'
    }
  })
  const hunuaSeason = await prisma.season.findFirst({
    where: { 
      site: { name: 'Hunua Ranges' },
      year: 2024,
      season: 'spring'
    }
  })
  const tiritiriSeason = await prisma.season.findFirst({
    where: { 
      site: { name: 'Tiritiri Matangi Island' },
      year: 2024,
      season: 'summer'
    }
  })

  const pohutukawaBatch = await prisma.batch.findFirst({
    where: { origin: 'Waitakere Ranges' }
  })
  const kauriBatch = await prisma.batch.findFirst({
    where: { origin: 'Hunua Ranges' }
  })
  const kahikateaBatch = await prisma.batch.findFirst({
    where: { origin: 'Tiritiri Matangi' }
  })

  // Create allotments
  const allotmentData = [
    {
      seasonId: waitakereSeason?.id || 1,
      batchId: pohutukawaBatch?.id || 1,
      quantity: 100,
    },
    {
      seasonId: waitakereSeason?.id || 1,
      batchId: kauriBatch?.id || 2,
      quantity: 50,
    },
    {
      seasonId: hunuaSeason?.id || 2,
      batchId: kauriBatch?.id || 2,
      quantity: 50,
    },
    {
      seasonId: tiritiriSeason?.id || 3,
      batchId: kahikateaBatch?.id || 3,
      quantity: 100,
    },
  ]

  const allotments = await prisma.allotment.createMany({
    data: allotmentData,
    skipDuplicates: true,
  })

  console.log(`✅ Created ${allotments.count} allotments`)
  console.log('🎉 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect?.()
  }) 