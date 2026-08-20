import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiService } from '../services/api'
import type {
  ApiVolunteer,
  ApiSpecies,
  ApiBatch,
  CreateBatchRequest,
  UpdateBatchRequest,
  CreateSiteRequest,
  UpdateSiteRequest,
  CreateNurseryRequest,
  UpdateNurseryRequest,
  CreateSeasonRequest,
  BulkCreateSeasonRequest,
  ApiAllotment,
  CreateAllotmentRequest,
  BulkCreateAllotmentRequest,
  ApiAdminOrganization,
  CreateOrganizationRequest,
  AddUserToOrganizationRequest,
} from '../services/api'

// Query Keys
export const queryKeys = {
  volunteers: ['volunteers'] as const,
  species: ['species'] as const,
  speciesById: (id: number) => ['species', id] as const,
  organisationSpecies: (organisationId: number) => ['species', 'organisation', organisationId] as const,
  batches: ['batches'] as const,
  batchesByNursery: (nurseryId: number) => ['batches', 'nursery', nurseryId] as const,
  batch: (id: string) => ['batches', id] as const,
  sites: ['sites'] as const,
  site: (id: number) => ['sites', id] as const,
  nurseries: ['nurseries'] as const,
  nursery: (id: number) => ['nurseries', id] as const,
  seasons: ['seasons'] as const,
  seasonsBySite: (siteId: number) => ['seasons', 'site', siteId] as const,
  allotments: ['allotments'] as const,
  allotmentsBySeason: (seasonId: number) => ['allotments', 'season', seasonId] as const,
  organization: ['organization'] as const,
  adminOrganizations: ['admin', 'organizations'] as const,
}

// Volunteers
export const useVolunteers = () => {
  return useQuery({
    queryKey: queryKeys.volunteers,
    queryFn: () => apiService.getVolunteers(),
  })
}

export const useCreateVolunteer = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (volunteer: Omit<ApiVolunteer, 'id'>) => apiService.createVolunteer(volunteer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.volunteers })
    },
  })
}

export const useUpdateVolunteer = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, volunteer }: { id: string; volunteer: Omit<ApiVolunteer, 'id'> }) =>
      apiService.updateVolunteer(id, volunteer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.volunteers })
    },
  })
}

export const useDeleteVolunteer = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => apiService.deleteVolunteer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.volunteers })
    },
  })
}

// Species
export const useSpecies = () => {
  return useQuery({
    queryKey: queryKeys.species,
    queryFn: () => apiService.getSpecies(),
  })
}

export const useSpeciesById = (id: number) => {
  return useQuery({
    queryKey: queryKeys.speciesById(id),
    queryFn: () => apiService.getSpeciesById(id),
    enabled: !!id,
  })
}

export const useCreateSpecies = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (species: Omit<ApiSpecies, 'id' | 'createdAt' | 'updatedAt'>) =>
      apiService.createSpecies(species),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.species })
    },
  })
}

export const useUpdateSpecies = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, species }: { id: number; species: Partial<Omit<ApiSpecies, 'id' | 'createdAt' | 'updatedAt'>> }) =>
      apiService.updateSpecies(id, species),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.species })
      queryClient.invalidateQueries({ queryKey: queryKeys.speciesById(id) })
    },
  })
}

export const useDeleteSpecies = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => apiService.deleteSpecies(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.species })
    },
  })
}

// Organisation Species
export const useOrganisationSpecies = (organisationId: number) => {
  return useQuery({
    queryKey: queryKeys.organisationSpecies(organisationId),
    queryFn: () => apiService.getOrganisationSpecies(organisationId),
    enabled: !!organisationId,
  })
}

export const useAddSpeciesToOrganisation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ organisationId, speciesId }: { organisationId: number; speciesId: number }) =>
      apiService.addSpeciesToOrganisation(organisationId, speciesId),
    onSuccess: (_, { organisationId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organisationSpecies(organisationId) })
    },
  })
}

export const useRemoveSpeciesFromOrganisation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ organisationId, speciesId }: { organisationId: number; speciesId: number }) =>
      apiService.removeSpeciesFromOrganisation(organisationId, speciesId),
    onSuccess: (_, { organisationId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organisationSpecies(organisationId) })
    },
  })
}

// Batches
export const useBatches = () => {
  return useQuery({
    queryKey: queryKeys.batches,
    queryFn: () => apiService.getBatches(),
  })
}

export const useBatchesByNursery = (nurseryId: number) => {
  return useQuery({
    queryKey: queryKeys.batchesByNursery(nurseryId),
    queryFn: () => apiService.getBatchesByNursery(nurseryId),
    enabled: !!nurseryId,
  })
}

export const useBatch = (id: string) => {
  return useQuery({
    queryKey: queryKeys.batch(id),
    queryFn: () => apiService.getBatchById(id),
    enabled: !!id,
  })
}

export const useCreateBatch = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (batch: CreateBatchRequest) => apiService.createBatch(batch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.batches })
      // Invalidate all nursery-specific batch queries
      queryClient.invalidateQueries({ queryKey: ['batches', 'nursery'] })
    },
  })
}

// Custom hook for creating batches with nursery-specific cache invalidation and optimistic updates
export const useCreateBatchForNursery = (nurseryId: number) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (batch: CreateBatchRequest) => apiService.createBatch(batch),
    onMutate: async (newBatch) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.batchesByNursery(nurseryId) })
      
      // Snapshot the previous value
      const previousBatches = queryClient.getQueryData(queryKeys.batchesByNursery(nurseryId))
      
      // Get species data for optimistic update
      const speciesData = queryClient.getQueryData(queryKeys.species) as any
      const species = speciesData?.species?.find((s: any) => s.id === newBatch.speciesId)
      
      // Optimistically update to the new value
      queryClient.setQueryData(queryKeys.batchesByNursery(nurseryId), (old: any) => {
        if (!old) return old
        
        // Create a temporary batch with a temporary ID
        const tempBatch = {
          id: `temp-${Date.now()}`,
          speciesId: newBatch.speciesId,
          nurseryId: newBatch.nurseryId,
          origin: newBatch.origin,
          quantity: newBatch.quantity,
          stage: newBatch.stage,
          notes: newBatch.notes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          // Add species data if available, otherwise placeholder
          species: species || { id: newBatch.speciesId, commonName: 'Loading...', botanicalName: 'Loading...' }
        }
        
        return {
          ...old,
          batches: [tempBatch, ...old.batches]
        }
      })
      
      // Return a context object with the snapshotted value
      return { previousBatches }
    },
    onError: (err, newBatch, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousBatches) {
        queryClient.setQueryData(queryKeys.batchesByNursery(nurseryId), context.previousBatches)
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.batchesByNursery(nurseryId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.batches })
    },
  })
}

export const useUpdateBatch = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, batch }: { id: string; batch: UpdateBatchRequest }) =>
      apiService.updateBatch(id, batch),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.batches })
      queryClient.invalidateQueries({ queryKey: queryKeys.batch(id) })
      queryClient.invalidateQueries({ queryKey: ['batches', 'nursery'] })
    },
  })
}

export const useDeleteBatch = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => apiService.deleteBatch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.batches })
      queryClient.invalidateQueries({ queryKey: ['batches', 'nursery'] })
    },
  })
}

// Custom hook for deleting batches with nursery-specific cache invalidation and optimistic updates
export const useDeleteBatchForNursery = (nurseryId: number) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => apiService.deleteBatch(id),
    onMutate: async (batchId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.batchesByNursery(nurseryId) })
      
      // Snapshot the previous value
      const previousBatches = queryClient.getQueryData(queryKeys.batchesByNursery(nurseryId))
      
      // Optimistically update to the new value
      queryClient.setQueryData(queryKeys.batchesByNursery(nurseryId), (old: any) => {
        if (!old) return old
        
        return {
          ...old,
          batches: old.batches.filter((batch: any) => batch.id !== batchId)
        }
      })
      
      // Return a context object with the snapshotted value
      return { previousBatches }
    },
    onError: (err, batchId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousBatches) {
        queryClient.setQueryData(queryKeys.batchesByNursery(nurseryId), context.previousBatches)
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.batchesByNursery(nurseryId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.batches })
    },
  })
}

// Sites
export const useSites = () => {
  return useQuery({
    queryKey: queryKeys.sites,
    queryFn: () => apiService.getSites(),
  })
}

export const useSite = (id: number) => {
  return useQuery({
    queryKey: queryKeys.site(id),
    queryFn: () => apiService.getSiteById(id),
    enabled: !!id,
  })
}

export const useCreateSite = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (site: CreateSiteRequest) => apiService.createSite(site),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sites })
    },
  })
}

export const useUpdateSite = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, site }: { id: number; site: UpdateSiteRequest }) =>
      apiService.updateSite(id, site),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sites })
      queryClient.invalidateQueries({ queryKey: queryKeys.site(id) })
    },
  })
}

export const useDeleteSite = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => apiService.deleteSite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sites })
    },
  })
}

// Nurseries
export const useNurseries = () => {
  return useQuery({
    queryKey: queryKeys.nurseries,
    queryFn: () => apiService.getNurseries(),
  })
}

export const useNursery = (id: number) => {
  return useQuery({
    queryKey: queryKeys.nursery(id),
    queryFn: () => apiService.getNurseryById(id),
    enabled: !!id,
  })
}

export const useCreateNursery = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (nursery: CreateNurseryRequest) => apiService.createNursery(nursery),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.nurseries })
    },
  })
}

export const useUpdateNursery = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, nursery }: { id: number; nursery: UpdateNurseryRequest }) =>
      apiService.updateNursery(id, nursery),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.nurseries })
      queryClient.invalidateQueries({ queryKey: queryKeys.nursery(id) })
    },
  })
}

export const useDeleteNursery = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => apiService.deleteNursery(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.nurseries })
    },
  })
}

// Seasons
export const useSeasons = () => {
  return useQuery({
    queryKey: queryKeys.seasons,
    queryFn: () => apiService.getSeasons(),
  })
}

export const useSeasonsBySite = (siteId: number) => {
  return useQuery({
    queryKey: queryKeys.seasonsBySite(siteId),
    queryFn: () => apiService.getSeasonsBySite(siteId),
    enabled: !!siteId,
  })
}

export const useCreateSeason = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (season: CreateSeasonRequest) => apiService.createSeason(season),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seasons })
      queryClient.invalidateQueries({ queryKey: ['seasons', 'site'] })
    },
  })
}

export const useCreateBulkSeasons = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (season: BulkCreateSeasonRequest) => apiService.createBulkSeasons(season),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seasons })
      queryClient.invalidateQueries({ queryKey: ['seasons', 'site'] })
    },
  })
}

// Organization
export const useOrganization = () => {
  return useQuery({
    queryKey: queryKeys.organization,
    queryFn: () => apiService.getOrganizationInfo(),
  })
}

// Allotments
export const useAllotments = () => {
  return useQuery({
    queryKey: queryKeys.allotments,
    queryFn: () => apiService.getAllotments(),
  })
}

export const useAllotmentsBySeason = (seasonId: number) => {
  return useQuery({
    queryKey: queryKeys.allotmentsBySeason(seasonId),
    queryFn: () => apiService.getAllotmentsBySeason(seasonId),
    enabled: !!seasonId,
  })
}

export const useCreateAllotment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (allotment: CreateAllotmentRequest) => apiService.createAllotment(allotment),
    onSuccess: (_, allotment) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allotments })
      queryClient.invalidateQueries({ queryKey: queryKeys.allotmentsBySeason(allotment.seasonId) })
    },
  })
}

export const useCreateBulkAllotments = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (bulkRequest: BulkCreateAllotmentRequest) => apiService.createBulkAllotments(bulkRequest),
    onSuccess: (_, bulkRequest) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allotments })
      // Invalidate all season-specific allotment queries since we don't know which seasons were affected
      queryClient.invalidateQueries({ queryKey: ['allotments', 'season'] })
    },
  })
}

export const useUpdateAllotment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, allotment }: { id: number; allotment: Partial<CreateAllotmentRequest> }) =>
      apiService.updateAllotment(id, allotment),
    onSuccess: (_, { allotment }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allotments })
      if (allotment.seasonId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.allotmentsBySeason(allotment.seasonId) })
      } else {
        queryClient.invalidateQueries({ queryKey: ['allotments', 'season'] })
      }
    },
  })
}

export const useDeleteAllotment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => apiService.deleteAllotment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allotments })
      // Invalidate all season-specific allotment queries since we don't know which season was affected
      queryClient.invalidateQueries({ queryKey: ['allotments', 'season'] })
    },
  })
}

// Custom hook for bulk allotments with season-specific cache invalidation
export const useCreateBulkAllotmentsForSeason = (seasonId: number) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (bulkRequest: BulkCreateAllotmentRequest) => apiService.createBulkAllotments(bulkRequest),
    onMutate: async (bulkRequest) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.allotmentsBySeason(seasonId) })
      
      // Snapshot the previous value
      const previousAllotments = queryClient.getQueryData(queryKeys.allotmentsBySeason(seasonId))
      
      // Optimistically update to the new value
      queryClient.setQueryData(queryKeys.allotmentsBySeason(seasonId), (old: any) => {
        if (!old) return old
        
        // Create temporary allotments with temporary IDs
        const tempAllotments = bulkRequest.allotments.map((allotment, index) => ({
          id: `temp-${Date.now()}-${index}`,
          seasonId: allotment.seasonId,
          batchId: allotment.batchId,
          speciesId: allotment.speciesId,
          quantity: allotment.quantity,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          // Add placeholder batch and species data
          batch: { id: allotment.batchId, stage: 'plant' },
          species: { id: allotment.speciesId, commonName: 'Loading...', botanicalName: 'Loading...' }
        }))
        
        return {
          ...old,
          allotments: [...old.allotments, ...tempAllotments]
        }
      })
      
      // Return a context object with the snapshotted value
      return { previousAllotments }
    },
    onError: (err, bulkRequest, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousAllotments) {
        queryClient.setQueryData(queryKeys.allotmentsBySeason(seasonId), context.previousAllotments)
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.allotmentsBySeason(seasonId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.allotments })
    },
  })
}

// Custom hook for deleting allotments with season-specific cache invalidation
export const useDeleteAllotmentForSeason = (seasonId: number) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => apiService.deleteAllotment(id),
    onMutate: async (allotmentId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.allotmentsBySeason(seasonId) })
      
      // Snapshot the previous value
      const previousAllotments = queryClient.getQueryData(queryKeys.allotmentsBySeason(seasonId))
      
      // Optimistically update to the new value
      queryClient.setQueryData(queryKeys.allotmentsBySeason(seasonId), (old: any) => {
        if (!old) return old
        
        return {
          ...old,
          allotments: old.allotments.filter((allotment: any) => allotment.id !== allotmentId)
        }
      })
      
      // Return a context object with the snapshotted value
      return { previousAllotments }
    },
    onError: (err, allotmentId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousAllotments) {
        queryClient.setQueryData(queryKeys.allotmentsBySeason(seasonId), context.previousAllotments)
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.allotmentsBySeason(seasonId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.allotments })
    },
  })
}

// Admin Organizations
export const useAdminOrganizations = () => {
  return useQuery({
    queryKey: queryKeys.adminOrganizations,
    queryFn: () => apiService.getAdminOrganizations(),
  })
}

export const useCreateAdminOrganization = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (organization: CreateOrganizationRequest) => apiService.createAdminOrganization(organization),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminOrganizations })
    },
  })
}

export const useAddUserToOrganization = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ organizationId, userData }: { organizationId: number; userData: AddUserToOrganizationRequest }) =>
      apiService.addUserToOrganization(organizationId, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminOrganizations })
    },
  })
}