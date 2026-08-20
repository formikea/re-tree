import React, { useState } from 'react';
import { CreateNurseryRequest, UpdateNurseryRequest, ApiNursery } from '@services/api';
import { useNurseries, useCreateNursery, useUpdateNursery, useDeleteNursery } from '@hooks/useApi';
import { NurseriesHeader } from './NurseriesHeader';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorDisplay } from './ErrorDisplay';
import { NurseriesTable } from './NurseriesTable';
import { CreateNurseryModal } from './CreateNurseryModal';
import { EditNurseryModal } from './EditNurseryModal';
import { DeleteNurseryModal } from './DeleteNurseryModal';
import { CreateNurseryFormData } from './types';

export function Nurseries() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingNursery, setEditingNursery] = useState<ApiNursery | null>(null);
  const [deletingNursery, setDeletingNursery] = useState<ApiNursery | null>(null);

  // React Query hooks
  const { data: nurseriesResponse, isLoading, error } = useNurseries();
  const createNurseryMutation = useCreateNursery();
  const updateNurseryMutation = useUpdateNursery();
  const deleteNurseryMutation = useDeleteNursery();

  const nurseries = nurseriesResponse?.nurseries || [];

  // Form state
  const [formData, setFormData] = useState<CreateNurseryFormData>({
    name: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: ''
    });
  };

  const handleCreateNursery = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const nurseryData: CreateNurseryRequest = {
      name: formData.name,
      organisationId: 1 // This should come from auth context in a real app
    };
    
    try {
      await createNurseryMutation.mutateAsync(nurseryData);
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      console.error('Error creating nursery:', err);
    }
  };

  const handleEditNursery = (nursery: ApiNursery) => {
    setEditingNursery(nursery);
    setFormData({
      name: nursery.name
    });
    setShowEditModal(true);
  };

  const handleUpdateNursery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNursery) return;
    
    const nurseryData: UpdateNurseryRequest = {
      name: formData.name
    };
    
    try {
      await updateNurseryMutation.mutateAsync({ id: editingNursery.id, nursery: nurseryData });
      setShowEditModal(false);
      setEditingNursery(null);
      resetForm();
    } catch (err) {
      console.error('Error updating nursery:', err);
    }
  };

  const handleDeleteNursery = (nursery: ApiNursery) => {
    setDeletingNursery(nursery);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingNursery) return;
    
    try {
      await deleteNurseryMutation.mutateAsync(deletingNursery.id);
      setShowDeleteModal(false);
      setDeletingNursery(null);
    } catch (err) {
      console.error('Error deleting nursery:', err);
    }
  };

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <NurseriesHeader onAddNursery={() => setShowCreateModal(true)} />

      <NurseriesTable 
        nurseries={nurseries}
        isLoading={isLoading}
        onEditNursery={handleEditNursery}
        onDeleteNursery={handleDeleteNursery}
      />

      <CreateNurseryModal 
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        onSubmit={handleCreateNursery}
        formData={formData}
        onInputChange={handleInputChange}
        isLoading={createNurseryMutation.isPending}
      />

      <EditNurseryModal 
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingNursery(null);
          resetForm();
        }}
        onSubmit={handleUpdateNursery}
        nursery={editingNursery}
        formData={formData}
        onInputChange={handleInputChange}
        isLoading={updateNurseryMutation.isPending}
      />

      <DeleteNurseryModal 
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingNursery(null);
        }}
        onConfirm={confirmDelete}
        nursery={deletingNursery}
        isLoading={deleteNurseryMutation.isPending}
      />
    </div>
  );
}