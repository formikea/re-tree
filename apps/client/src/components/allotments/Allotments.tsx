import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreateAllotmentRequest, ApiSpecies, ApiSeason, ApiAllotment } from '@services/api';
import { useSeasons, useBatches, useOrganisationSpecies, useCreateBulkAllotmentsForSeason, useAllotmentsBySeason, useAllotments, useDeleteAllotmentForSeason } from '@hooks/useApi';
import { useAuth } from '@hooks/useAuth';
import { AllotmentsHeader } from './AllotmentsHeader';
import { SeasonInfoCard } from './SeasonInfoCard';
import { AllotmentsTable } from './AllotmentsTable';
import { AddAllotmentModal } from './AddAllotmentModal';
import { DeleteAllotmentModal } from './DeleteAllotmentModal';
import { ErrorDisplay } from './ErrorDisplay';
import { LoadingSpinner } from './LoadingSpinner';
import { AllotmentToDelete, SpeciesAvailability, StageStyles } from './types';

export function Allotments() {
  const { seasonId } = useParams<{ seasonId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAllotmentModal, setShowAllotmentModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [allotmentToDelete, setAllotmentToDelete] = useState<AllotmentToDelete | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [speciesQuantities, setSpeciesQuantities] = useState<Record<number, number>>({});

  // React Query hooks
  const { data: seasonsResponse, isLoading: seasonsLoading, error: seasonsError } = useSeasons();
  const { data: batchesResponse, isLoading: batchesLoading, error: batchesError } = useBatches();
  const { isLoading: speciesLoading, error: speciesError } = useOrganisationSpecies(parseInt(user?.organisationId || '0'));
  const { data: allotmentsResponse, isLoading: allotmentsLoading, error: allotmentsError } = useAllotmentsBySeason(parseInt(seasonId || '0'));
  const { data: allAllotmentsResponse, isLoading: allAllotmentsLoading, error: allAllotmentsError } = useAllotments();
  const createBulkAllotmentsMutation = useCreateBulkAllotmentsForSeason(parseInt(seasonId || '0'));
  const deleteAllotmentMutation = useDeleteAllotmentForSeason(parseInt(seasonId || '0'));

  const seasons = seasonsResponse?.seasons || [];
  const batches = batchesResponse?.batches || [];
  const rawAllotments = allotmentsResponse?.allotments || [];
  const allAllotments = allAllotmentsResponse?.allotments || [];
  
  // Create lookup maps for species and batches
  const speciesMap = new Map();
  const batchMap = new Map();
  
  batches.forEach(batch => {
    batchMap.set(batch.id, batch);
    if (batch.species) {
      speciesMap.set(batch.speciesId, batch.species);
    }
  });
  
  // Enrich allotments with species and batch data if not provided by API
  const allotments = rawAllotments.map(allotment => {
    // Find the batch data
    const batch = allotment.batch || batchMap.get(allotment.batchId);
    // Find the species data
    const species = allotment.species || batch?.species || speciesMap.get(allotment.speciesId);
    
    return {
      ...allotment,
      batch,
      species
    };
  });

  // Find the current season
  const currentSeason = seasons.find((season: ApiSeason) => season.id === parseInt(seasonId || '0'));
  const site = currentSeason?.site;

  const stageStyles: StageStyles = {
    seed: 'bg-blue-100 text-blue-700',
    prick: 'bg-amber-100 text-amber-700',
    pot: 'bg-purple-100 text-purple-700',
    plant: 'bg-green-100 text-green-700'
  };

  const getSeasonDisplayName = (season: string) => {
    return season.charAt(0).toUpperCase() + season.slice(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleCreateAllotment = async () => {
    if (!currentSeason) return;

    // Create allotments for all species with quantities > 0
    const allotmentRequests: CreateAllotmentRequest[] = [];
    
    Object.entries(speciesQuantities).forEach(([speciesId, quantity]) => {
      if (quantity > 0) {
        const speciesIdNum = parseInt(speciesId);
        
        // Get the total available quantity for this species
        const speciesAvailability = getSpeciesAvailability().find(s => s.species.id === speciesIdNum);
        
        if (speciesAvailability && quantity <= speciesAvailability.total) {
          // Find all batches for this species, sorted by preference (plant > pot > prick > seed)
          // Include order batches in allocation
          const speciesBatches = batches
            .filter(batch => batch.speciesId === speciesIdNum)
            .sort((a, b) => {
              const stageOrder = { plant: 0, pot: 1, prick: 2, seed: 3 };
              return (stageOrder[a.stage as keyof typeof stageOrder] || 4) - (stageOrder[b.stage as keyof typeof stageOrder] || 4);
            });
          
          let remainingQuantity = quantity;
          
          // Create allotments across available batches
          for (const batch of speciesBatches) {
            if (remainingQuantity <= 0) break;
            
            // Calculate available quantity for this specific batch
            const batchAllocations = new Map<number, number>();
            allAllotments.forEach(allotment => {
              const currentAllocated = batchAllocations.get(allotment.batchId) || 0;
              batchAllocations.set(allotment.batchId, currentAllocated + allotment.quantity);
            });
            
            const allocatedFromBatch = batchAllocations.get(batch.id) || 0;
            const availableFromBatch = Math.max(0, batch.quantity - allocatedFromBatch);
            
            if (availableFromBatch > 0) {
              const allotmentQuantity = Math.min(remainingQuantity, availableFromBatch);
              
              allotmentRequests.push({
                seasonId: currentSeason.id,
                batchId: batch.id,
                speciesId: batch.speciesId,
                quantity: allotmentQuantity,
              });
              
              remainingQuantity -= allotmentQuantity;
            }
          }
        }
      }
    });

    if (allotmentRequests.length > 0) {
      try {
        await createBulkAllotmentsMutation.mutateAsync({ allotments: allotmentRequests });
        setShowAllotmentModal(false);
        setSpeciesQuantities({});
        setSearchTerm('');
      } catch (error) {
        console.error('Failed to create allotments:', error);
      }
    }
  };

  const handleRemoveAllotment = async (allotmentId: number) => {
    try {
      await deleteAllotmentMutation.mutateAsync(allotmentId);
      setShowDeleteConfirmModal(false);
      setAllotmentToDelete(null);
    } catch (error) {
      console.error('Failed to delete allotment:', error);
    }
  };

  const handleDeleteClick = (allotment: ApiAllotment) => {
    setAllotmentToDelete({
      id: allotment.id,
      speciesName: allotment.species?.commonName || `Species ID: ${allotment.speciesId}`,
      quantity: allotment.quantity
    });
    setShowDeleteConfirmModal(true);
  };

  const handleSpeciesQuantityChange = (speciesId: number, quantity: number) => {
    setSpeciesQuantities(prev => ({
      ...prev,
      [speciesId]: quantity
    }));
  };

  const getTotalAllocated = () => {
    return allotments.reduce((total, allotment) => total + allotment.quantity, 0);
  };

  // Calculate available quantities by species and stage
  const getSpeciesAvailability = (): SpeciesAvailability[] => {
    const availability: Record<number, { species: ApiSpecies; stages: Record<string, number>; total: number }> = {};
    
    // Create a map to track allocated quantities per batch
    const batchAllocations = new Map<number, number>();
    
    // Initialize batch allocations from existing allotments
    allAllotments.forEach(allotment => {
      const currentAllocated = batchAllocations.get(allotment.batchId) || 0;
      batchAllocations.set(allotment.batchId, currentAllocated + allotment.quantity);
    });
    
    // Calculate available quantities by species and stage
    batches.forEach(batch => {
      // Include order batches in availability calculation
      
      if (!availability[batch.speciesId]) {
        availability[batch.speciesId] = {
          species: batch.species,
          stages: { seed: 0, prick: 0, pot: 0, plant: 0 },
          total: 0
        };
      }
      
      // Calculate available quantity for this batch
      const allocatedFromBatch = batchAllocations.get(batch.id) || 0;
      const availableFromBatch = Math.max(0, batch.quantity - allocatedFromBatch);
      
      // Add to the appropriate stage and total
      availability[batch.speciesId].stages[batch.stage] += availableFromBatch;
      availability[batch.speciesId].total += availableFromBatch;
    });
    
    return Object.values(availability).sort((a, b) => a.species.commonName.localeCompare(b.species.commonName));
  };

  // Get unique species for the modal
  const availableSpecies = getSpeciesAvailability();

  const isLoading = seasonsLoading || batchesLoading || speciesLoading || allotmentsLoading || allAllotmentsLoading;
  const error = seasonsError || batchesError || speciesError || allotmentsError || allAllotmentsError;

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading season details..." />;
  }

  if (!currentSeason || !site) {
    return <ErrorDisplay error="The requested season could not be found." title="Season Not Found" />;
  }

  // Ensure we have the season ID for API calls
  if (!seasonId) {
    return <ErrorDisplay error="No season ID provided." title="Invalid Season ID" />;
  }

  return (
    <div className="space-y-6">
      <AllotmentsHeader
        siteName={site.name}
        seasonName={getSeasonDisplayName(currentSeason.season)}
        year={currentSeason.year}
        onBack={() => navigate('/seasons')}
        onAddAllotment={() => setShowAllotmentModal(true)}
      />

      <SeasonInfoCard
        site={site}
        season={currentSeason}
        totalAllocated={getTotalAllocated()}
        allotmentsCount={allotments.length}
        formatDate={formatDate}
        getSeasonDisplayName={getSeasonDisplayName}
      />

      <AllotmentsTable
        allotments={allotments}
        isLoading={allotmentsLoading}
        onDeleteAllotment={handleDeleteClick}
        isDeleting={deleteAllotmentMutation.isPending}
        stageStyles={stageStyles}
      />

      <AddAllotmentModal
        isOpen={showAllotmentModal}
        onClose={() => {
                    setShowAllotmentModal(false);
                    setSpeciesQuantities({});
                    setSearchTerm('');
                  }}
        availableSpecies={availableSpecies}
        speciesQuantities={speciesQuantities}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onQuantityChange={handleSpeciesQuantityChange}
        onCreateAllotment={handleCreateAllotment}
        isCreating={createBulkAllotmentsMutation.isPending}
        stageStyles={stageStyles}
      />

      <DeleteAllotmentModal
        isOpen={showDeleteConfirmModal}
        onClose={() => {
                    setShowDeleteConfirmModal(false);
                    setAllotmentToDelete(null);
                  }}
        allotmentToDelete={allotmentToDelete}
        onConfirmDelete={() => allotmentToDelete && handleRemoveAllotment(allotmentToDelete.id)}
        isDeleting={deleteAllotmentMutation.isPending}
      />
    </div>
  );
} 

//bump