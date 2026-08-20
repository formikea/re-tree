import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrganisationSpecies, useSeasonsBySite, useBatches, useAllotments, useCreateBulkAllotments, useCreateSeason, useCreateBulkSeasons, useSite, useSites, useNurseries, useCreateBatch } from '@hooks/useApi';
import { CreateAllotmentRequest, CreateSeasonRequest, BulkCreateSeasonRequest, CreateBatchRequest } from '@services/api';
import { useAuth } from '@hooks/useAuth';
import { SiteDetailHeader } from './SiteDetailHeader';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorDisplay } from './ErrorDisplay';
import { SiteDetailGrid } from './SiteDetailGrid';
import { CreateAllotmentModal } from './CreateAllotmentModal';
import { CreateSeasonModal } from './CreateSeasonModal';
import { CreateOrderBatchModal } from './CreateOrderBatchModal';
import { 
  SeasonFormData, 
  OrderBatchFormData, 
  SelectedCell 
} from './types';

export function SiteDetail() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Modal states
  const [showAllotmentModal, setShowAllotmentModal] = useState(false);
  const [showSeasonModal, setShowSeasonModal] = useState(false);
  const [showOrderBatchModal, setShowOrderBatchModal] = useState(false);
  
  // Form states
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [quantity, setQuantity] = useState('');
  const [seasonForm, setSeasonForm] = useState<SeasonFormData>({
    year: new Date().getFullYear(),
    season: 'spring',
    notes: '',
    addToAllSites: false
  });
  const [orderBatchForm, setOrderBatchForm] = useState<OrderBatchFormData>({
    nurseryId: 0,
    quantity: 0,
    stage: 'seed',
    notes: '',
    allotmentQuantity: 0
  });

  const siteIdNum = siteId && !isNaN(parseInt(siteId, 10)) ? parseInt(siteId, 10) : 0;
  
  // Fetch data - only fetch site if we have a valid siteId
  const { data: siteResponse, isLoading: siteLoading, error: siteError } = useSite(siteIdNum);
  const { data: speciesResponse, isLoading: speciesLoading, error: speciesError } = useOrganisationSpecies(parseInt(String(user?.organisationId || '0'), 10));
  const { data: seasonsResponse, isLoading: seasonsLoading, error: seasonsError } = useSeasonsBySite(siteIdNum);
  const { data: sitesResponse, isLoading: sitesLoading, error: sitesError } = useSites();
  const { data: batchesResponse, isLoading: batchesLoading, error: batchesError } = useBatches();
  const { data: allAllotmentsResponse, isLoading: allotmentsLoading, error: allotmentsError } = useAllotments();
  const { data: nurseriesResponse, isLoading: nurseriesLoading, error: nurseriesError } = useNurseries();
  
  // Mutations
  const createBulkAllotmentsMutation = useCreateBulkAllotments();
  const createSeasonMutation = useCreateSeason();
  const createBulkSeasonsMutation = useCreateBulkSeasons();
  const createBatchMutation = useCreateBatch();

  const site = siteResponse?.site;
  const species = speciesResponse?.species || [];
  const rawSeasons = seasonsResponse?.seasons || [];
  const sites = sitesResponse?.sites || [];
  const batches = batchesResponse?.batches || [];
  const allAllotments = allAllotmentsResponse?.allotments || [];
  const nurseries = nurseriesResponse?.nurseries || [];

  // Sort seasons by year (ascending) and then by season order within each year
  const seasons = [...rawSeasons].sort((a, b) => {
    // First sort by year
    if (a.year !== b.year) {
      return a.year - b.year;
    }
    
    // Then sort by season order within the same year
    const seasonOrder = { winter: 0, spring: 1, summer: 2, autumn: 3 };
    const aOrder = seasonOrder[a.season as keyof typeof seasonOrder] ?? 4;
    const bOrder = seasonOrder[b.season as keyof typeof seasonOrder] ?? 4;
    
    return aOrder - bOrder;
  });

  // Event handlers
  const handleCellClick = (speciesId: number, seasonId: number) => {
    setSelectedCell({ speciesId, seasonId });
    setShowAllotmentModal(true);
    setQuantity('');
  };

  const handleOrderBatchClick = (speciesId: number, seasonId: number) => {
    setSelectedCell({ speciesId, seasonId });
    setShowOrderBatchModal(true);
    setOrderBatchForm({
      nurseryId: nurseries.length > 0 ? nurseries[0].id : 0,
      quantity: 0,
      stage: 'seed',
      notes: '',
      allotmentQuantity: 0
    });
  };

  const handleCreateAllotment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCell || !quantity) return;

    const quantityNum = parseInt(quantity);
    const speciesId = selectedCell.speciesId;
    const seasonId = selectedCell.seasonId;

    // Find all batches for this species, sorted by preference (plant > pot > prick > seed)
    // Include order batches in allocation
    const speciesBatches = batches
      .filter(batch => batch.speciesId === speciesId)
      .sort((a, b) => {
        const stageOrder = { plant: 0, pot: 1, prick: 2, seed: 3 };
        return (stageOrder[a.stage as keyof typeof stageOrder] || 4) - (stageOrder[b.stage as keyof typeof stageOrder] || 4);
      });

    if (speciesBatches.length === 0) {
      alert('No batches available for this species');
      return;
    }

    // Create allotments across available batches
    const allotmentRequests: CreateAllotmentRequest[] = [];
    let remainingQuantity = quantityNum;

    for (const batch of speciesBatches) {
      if (remainingQuantity <= 0) break;
      
      // Calculate available quantity for this specific batch
      const batchAllocations = new Map<number, number>();
      allAllotments.forEach(allotment => {
        const currentAllocated = batchAllocations.get(allotment.batchId) || 0;
        batchAllocations.set(allotment.batchId, currentAllocated + allotment.quantity);
      });
      
      const allocatedFromBatch = batchAllocations.get(batch.id) || 0;
      const availableFromBatch = Math.max(0, (batch.quantity || 0) - allocatedFromBatch);
      
      if (availableFromBatch > 0) {
        const allotmentQuantity = Math.min(remainingQuantity, availableFromBatch);
        
        allotmentRequests.push({
          seasonId: seasonId,
          batchId: batch.id,
          speciesId: batch.speciesId,
          quantity: allotmentQuantity,
        });
        
        remainingQuantity -= allotmentQuantity;
      }
    }

    if (allotmentRequests.length === 0) {
      alert('No available batches for this species');
      return;
    }

    if (remainingQuantity > 0) {
      alert(`Only ${quantityNum - remainingQuantity} plants available for this species`);
      return;
    }

    try {
      await createBulkAllotmentsMutation.mutateAsync({ allotments: allotmentRequests });
      setShowAllotmentModal(false);
      setSelectedCell(null);
      setQuantity('');
    } catch (err) {
      console.error('Error creating allotment:', err);
      alert('Failed to create allotment. Please try again.');
    }
  };

  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation to prevent duplicate seasons (only for single site creation)
    if (!seasonForm.addToAllSites && isDuplicateSeason) {
      alert(`A season for ${seasonForm.season} ${seasonForm.year} already exists for this site.`);
      return;
    }
    
    try {
      if (seasonForm.addToAllSites) {
        // Bulk creation for all sites
        const bulkSeasonData: BulkCreateSeasonRequest = {
          siteId: siteIdNum,
          organisationId: parseInt(String(user?.organisationId || '0'), 10),
          year: seasonForm.year,
          season: seasonForm.season,
          notes: seasonForm.notes,
          addToAllSites: true
        };
        
        const result = await createBulkSeasonsMutation.mutateAsync(bulkSeasonData);
        alert(`Successfully created seasons for ${result.created} sites. ${result.skipped} sites already had this season.`);
      } else {
        // Single site creation
        const seasonData: CreateSeasonRequest = {
          siteId: siteIdNum,
          organisationId: parseInt(String(user?.organisationId || '0'), 10),
          year: seasonForm.year,
          season: seasonForm.season,
          notes: seasonForm.notes
        };
        
        await createSeasonMutation.mutateAsync(seasonData);
      }
      
      setShowSeasonModal(false);
      setSeasonForm({
        year: new Date().getFullYear(),
        season: 'spring',
        notes: '',
        addToAllSites: false
      });
    } catch (err) {
      console.error('Error creating season:', err);
      // Extract error message from the error object
      const errorMessage = err instanceof Error ? err.message : 'Failed to create season. Please try again.';
      alert(errorMessage);
    }
  };

  const handleCreateOrderBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCell || !orderBatchForm.quantity || !orderBatchForm.allotmentQuantity || !orderBatchForm.nurseryId) return;

    if (orderBatchForm.allotmentQuantity > orderBatchForm.quantity) {
      alert('Allotment quantity cannot be greater than batch quantity');
      return;
    }

    try {
      // First create the batch with isOrder flag
      const batchData: CreateBatchRequest = {
        speciesId: selectedCell.speciesId,
        nurseryId: orderBatchForm.nurseryId,
        origin: 'Order',
        quantity: orderBatchForm.quantity,
        stage: orderBatchForm.stage,
        isOrder: true,
        notes: orderBatchForm.notes
      };

      const newBatch = await createBatchMutation.mutateAsync(batchData);

      // Then create the allotment from this batch
      const allotmentRequests: CreateAllotmentRequest[] = [{
        seasonId: selectedCell.seasonId,
        batchId: newBatch.id,
        speciesId: selectedCell.speciesId,
        quantity: orderBatchForm.allotmentQuantity,
      }];

      await createBulkAllotmentsMutation.mutateAsync({ allotments: allotmentRequests });

      // Close modal and reset form
      setShowOrderBatchModal(false);
      setSelectedCell(null);
      setOrderBatchForm({
        nurseryId: nurseries.length > 0 ? nurseries[0].id : 0,
        quantity: 0,
        stage: 'seed',
        notes: '',
        allotmentQuantity: 0
      });
    } catch (err) {
      console.error('Error creating order batch and allotment:', err);
      alert('Failed to create order. Please try again.');
    }
  };

  // Utility functions
  const getAvailableQuantityForSpecies = (speciesId: number) => {
    // Find all batches for this species (including order batches)
    const speciesBatches = batches.filter(batch => batch.speciesId === speciesId);
    
    // Calculate total available across all batches
    const batchAllocations = new Map<number, number>();
    allAllotments.forEach(allotment => {
      const currentAllocated = batchAllocations.get(allotment.batchId) || 0;
      batchAllocations.set(allotment.batchId, currentAllocated + allotment.quantity);
    });
    
    let totalAvailable = 0;
    speciesBatches.forEach(batch => {
      const allocatedFromBatch = batchAllocations.get(batch.id) || 0;
      const availableFromBatch = Math.max(0, (batch.quantity || 0) - allocatedFromBatch);
      totalAvailable += availableFromBatch;
    });
    
    return totalAvailable;
  };

  const getAllotmentQuantityForSpeciesSeason = (speciesId: number, seasonId: number) => {
    // Find all allotments for this species and season
    let totalQuantity = 0;
    
    allAllotments.forEach(allotment => {
      // Check if this allotment is for the right season
      if (allotment.seasonId === seasonId) {
        // Find the batch to get the species
        const batch = batches.find(b => b.id === allotment.batchId);
        if (batch && batch.speciesId === speciesId) {
          totalQuantity += allotment.quantity;
        }
      }
    });
    
    return totalQuantity;
  };

  // Check if a season already exists for the current form values
  const isDuplicateSeason = seasons.some(season => 
    season.year === seasonForm.year && season.season === seasonForm.season
  );

  // Calculate which sites will receive the season when bulk creation is selected
  const sitesToReceiveSeason = seasonForm.addToAllSites ? sites.filter(site => {
    // Check if this site already has the season
    return !seasons.some(season => 
      season.siteId === site.id && 
      season.year === seasonForm.year && 
      season.season === seasonForm.season
    );
  }) : [];

  // Loading and error states
  const isLoading = siteLoading || speciesLoading || seasonsLoading || batchesLoading || allotmentsLoading || nurseriesLoading;
  const error = siteError || speciesError || seasonsError || sitesError || batchesError || allotmentsError || nurseriesError;

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <SiteDetailHeader 
        site={site || null}
        siteId={siteId}
        onAddSeason={() => setShowSeasonModal(true)}
        onBack={() => navigate('/sites')}
      />

      <SiteDetailGrid 
        species={species}
        seasons={seasons}
        batches={batches}
        allAllotments={allAllotments}
        onCellClick={handleCellClick}
        onOrderBatchClick={handleOrderBatchClick}
        getAvailableQuantityForSpecies={getAvailableQuantityForSpecies}
        getAllotmentQuantityForSpeciesSeason={getAllotmentQuantityForSpeciesSeason}
      />

      <CreateAllotmentModal 
        isOpen={showAllotmentModal}
        onClose={() => {
          setShowAllotmentModal(false);
          setSelectedCell(null);
          setQuantity('');
        }}
        onSubmit={handleCreateAllotment}
        selectedCell={selectedCell}
        quantity={quantity}
        onQuantityChange={setQuantity}
        species={species}
        seasons={seasons}
        isLoading={createBulkAllotmentsMutation.isPending}
      />

      <CreateSeasonModal 
        isOpen={showSeasonModal}
        onClose={() => {
          setShowSeasonModal(false);
          setSeasonForm({
            year: new Date().getFullYear(),
            season: 'spring',
            notes: '',
            addToAllSites: false
          });
        }}
        onSubmit={handleCreateSeason}
        formData={seasonForm}
        onFormChange={(field, value) => setSeasonForm(prev => ({ ...prev, [field]: value }))}
        sites={sites}
        seasons={seasons}
        isLoading={createSeasonMutation.isPending || createBulkSeasonsMutation.isPending}
        isDuplicateSeason={isDuplicateSeason}
        sitesToReceiveSeason={sitesToReceiveSeason}
      />

      <CreateOrderBatchModal 
        isOpen={showOrderBatchModal}
        onClose={() => {
          setShowOrderBatchModal(false);
          setSelectedCell(null);
          setOrderBatchForm({
            nurseryId: nurseries.length > 0 ? nurseries[0].id : 0,
            quantity: 0,
            stage: 'seed',
            notes: '',
            allotmentQuantity: 0
          });
        }}
        onSubmit={handleCreateOrderBatch}
        selectedCell={selectedCell}
        formData={orderBatchForm}
        onFormChange={(field, value) => setOrderBatchForm(prev => ({ ...prev, [field]: value }))}
        species={species}
        seasons={seasons}
        nurseries={nurseries}
        isLoading={createBatchMutation.isPending || createBulkAllotmentsMutation.isPending}
      />
    </div>
  );
}