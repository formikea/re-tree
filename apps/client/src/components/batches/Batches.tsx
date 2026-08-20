import React, { useState } from 'react';
import { CreateBatchRequest, UpdateBatchRequest, ApiBatch } from '@services/api';
import { useBatches, useOrganisationSpecies, useNurseries, useCreateBatch, useUpdateBatch } from '@hooks/useApi';
import { useAuth } from '@hooks/useAuth';
import { BatchesHeader } from './BatchesHeader';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorDisplay } from './ErrorDisplay';
import { BatchesTable } from './BatchesTable';
import { OrdersTable } from './OrdersTable';
import { TabbedBatches } from './TabbedBatches';
import { CreateBatchModal } from './CreateBatchModal';
import { CreateOrderBatchModal } from './CreateOrderBatchModal';
import { EditBatchModal } from './EditBatchModal';

import { 
  CreateBatchFormData, 
  OrderBatchFormData, 
  StageStyles, 
  SpeciesStageMatrix 
} from './types';

export function Batches() {
  const [activeTab, setActiveTab] = useState<'batches' | 'orders'>('batches');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<ApiBatch | null>(null);
  const { user } = useAuth();

  // React Query hooks
  const { data: batchesResponse, isLoading: batchesLoading, error: batchesError } = useBatches();
  const { data: speciesResponse, isLoading: speciesLoading, error: speciesError } = useOrganisationSpecies(parseInt(String(user?.organisationId || '0'), 10));
  const { data: nurseriesResponse, isLoading: nurseriesLoading, error: nurseriesError } = useNurseries();
  const createBatchMutation = useCreateBatch();
  const updateBatchMutation = useUpdateBatch();

  const batches = batchesResponse?.batches || [];
  const species = speciesResponse?.species || [];
  const nurseries = nurseriesResponse?.nurseries || [];

  // Form state for create batch
  const [formData, setFormData] = useState<CreateBatchFormData>({
    speciesId: '',
    nurseryId: '',
    origin: '',
    quantity: '',
    stage: 'seed',
    notes: ''
  });

  // Form state for create order batch
  const [orderFormData, setOrderFormData] = useState<OrderBatchFormData>({
    speciesId: '',
    nurseryId: '',
    quantity: '',
    stage: 'seed',
    notes: ''
  });

  const stageStyles: StageStyles = {
    seed: 'bg-blue-100 text-blue-700',
    prick: 'bg-amber-100 text-amber-700',
    pot: 'bg-purple-100 text-purple-700',
    plant: 'bg-green-100 text-green-700'
  };

  // Create species-stage matrix data for inventory batches
  const createInventoryMatrix = (): { matrix: SpeciesStageMatrix; stageOrder: readonly string[] } => {
    const stageOrder = ['seed', 'prick', 'pot', 'plant'] as const;
    const matrix: SpeciesStageMatrix = {};
    
    // Initialize matrix with all species
    species.forEach(spec => {
      matrix[spec.id] = {};
      stageOrder.forEach(stage => {
        matrix[spec.id][stage] = 0;
      });
    });

    // Aggregate quantities by species and stage (only non-order batches)
    batches.forEach(batch => {
      if (matrix[batch.speciesId] && !batch.isOrder) {
        matrix[batch.speciesId][batch.stage] += batch.quantity;
      }
    });

    return { matrix, stageOrder };
  };

  // Create species-stage matrix data for order batches
  const createOrdersMatrix = (): { matrix: SpeciesStageMatrix; stageOrder: readonly string[] } => {
    const stageOrder = ['seed', 'prick', 'pot', 'plant'] as const;
    const matrix: SpeciesStageMatrix = {};
    
    // Initialize matrix with all species
    species.forEach(spec => {
      matrix[spec.id] = {};
      stageOrder.forEach(stage => {
        matrix[spec.id][stage] = 0;
      });
    });

    // Aggregate quantities by species and stage (only order batches)
    batches.forEach(batch => {
      if (matrix[batch.speciesId] && batch.isOrder) {
        matrix[batch.speciesId][batch.stage] += batch.quantity;
      }
    });

    return { matrix, stageOrder };
  };

  const { matrix: inventoryMatrix, stageOrder: inventoryStageOrder } = createInventoryMatrix();
  const { matrix: ordersMatrix, stageOrder: ordersStageOrder } = createOrdersMatrix();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOrderInputChange = (field: string, value: string) => {
    setOrderFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      speciesId: '',
      nurseryId: '',
      origin: '',
      quantity: '',
      stage: 'seed',
      notes: ''
    });
  };

  const resetOrderForm = () => {
    setOrderFormData({
      speciesId: '',
      nurseryId: '',
      quantity: '',
      stage: 'seed',
      notes: ''
    });
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();

    const newBatch: CreateBatchRequest = {
      speciesId: parseInt(formData.speciesId),
      nurseryId: parseInt(formData.nurseryId),
      origin: formData.origin || undefined,
      quantity: parseInt(formData.quantity),
      stage: formData.stage as 'seed' | 'prick' | 'pot' | 'plant',
      isOrder: false,
      notes: formData.notes
    };

    try {
      await createBatchMutation.mutateAsync(newBatch);
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      console.error('Error creating batch:', err);
    }
  };

  const handleCreateOrderBatch = async (e: React.FormEvent) => {
    e.preventDefault();

    const newOrderBatch: CreateBatchRequest = {
      speciesId: parseInt(orderFormData.speciesId),
      nurseryId: parseInt(orderFormData.nurseryId),
      origin: 'Order',
      quantity: parseInt(orderFormData.quantity),
      stage: orderFormData.stage,
      isOrder: true,
      notes: orderFormData.notes
    };

    try {
      await createBatchMutation.mutateAsync(newOrderBatch);
      setShowOrderModal(false);
      resetOrderForm();
    } catch (err) {
      console.error('Error creating order batch:', err);
    }
  };

  const handleEditBatch = (batch: ApiBatch) => {
    setEditingBatch(batch);
    setShowEditModal(true);
  };

  const handleCompleteOrder = async (formData: {
    speciesId: number;
    nurseryId: number;
    origin: string;
    quantity: number;
    stage: string;
    notes?: string;
  }) => {
    if (!editingBatch) return;
    
    try {
      await updateBatchMutation.mutateAsync({
        id: editingBatch.id.toString(),
        batch: {
          speciesId: formData.speciesId,
          nurseryId: formData.nurseryId,
          origin: formData.origin || undefined,
          quantity: formData.quantity,
          stage: formData.stage as 'seed' | 'prick' | 'pot' | 'plant',
          notes: formData.notes,
          isOrder: false,
          completedAt: new Date().toISOString()
        }
      });
      setShowEditModal(false);
      setEditingBatch(null);
    } catch (err) {
      console.error('Error completing order:', err);
    }
  };

  const handleEditBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch) return;

    const form = e.target as HTMLFormElement;
    const updatedBatch: UpdateBatchRequest = {
      speciesId: parseInt(form.speciesId.value),
      nurseryId: parseInt(form.nurseryId.value),
      origin: form.origin.value,
      quantity: parseInt(form.quantity.value),
      stage: form.stage.value,
      notes: form.notes.value
    };

    try {
      await updateBatchMutation.mutateAsync({
        id: editingBatch.id.toString(),
        batch: updatedBatch
      });
      setShowEditModal(false);
      setEditingBatch(null);
    } catch (err) {
      console.error('Error updating batch:', err);
    }
  };



  const isLoading = batchesLoading || speciesLoading || nurseriesLoading;
  const error = batchesError || speciesError || nurseriesError;

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <BatchesHeader />

      <TabbedBatches 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        species={species}
        inventoryMatrix={inventoryMatrix}
        inventoryStageOrder={inventoryStageOrder}
        ordersMatrix={ordersMatrix}
        ordersStageOrder={ordersStageOrder}
        stageStyles={stageStyles}
        onEditBatch={handleEditBatch}
        isUpdating={updateBatchMutation.isPending}
        batches={batches}
        onShowCreateModal={() => setShowCreateModal(true)}
        onShowOrderModal={() => setShowOrderModal(true)}
      />

      <CreateBatchModal 
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        onSubmit={handleCreateBatch}
        formData={formData}
        onInputChange={handleInputChange}
        species={species}
        nurseries={nurseries}
        isLoading={createBatchMutation.isPending}
      />

      <CreateOrderBatchModal 
        isOpen={showOrderModal}
        onClose={() => {
          setShowOrderModal(false);
          resetOrderForm();
        }}
        onSubmit={handleCreateOrderBatch}
        formData={orderFormData}
        onInputChange={handleOrderInputChange}
        species={species}
        nurseries={nurseries}
        isLoading={createBatchMutation.isPending}
      />

      <EditBatchModal 
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingBatch(null);
        }}
        onSubmit={handleEditBatchSubmit}
        onCompleteOrder={handleCompleteOrder}
        batch={editingBatch}
        species={species}
        nurseries={nurseries}
        isLoading={updateBatchMutation.isPending}
      />


    </div>
  );
}