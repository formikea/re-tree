import React, { useState } from 'react';
import { ApiSpecies } from '@services/api';
import { useSpecies, useCreateSpecies, useUpdateSpecies, useDeleteSpecies } from '@hooks/useApi';
import { SpeciesHeader } from './SpeciesHeader';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorDisplay } from './ErrorDisplay';
import { SpeciesTable } from './SpeciesTable';
import { CreateSpeciesModal } from './CreateSpeciesModal';
import { EditSpeciesModal } from './EditSpeciesModal';
import { DeleteSpeciesModal } from './DeleteSpeciesModal';
import { CreateSpeciesFormData } from './types';

export function Species() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingSpecies, setEditingSpecies] = useState<ApiSpecies | null>(null);
  const [deletingSpecies, setDeletingSpecies] = useState<ApiSpecies | null>(null);

  // React Query hooks
  const { data: speciesResponse, isLoading, error } = useSpecies();
  const createSpeciesMutation = useCreateSpecies();
  const updateSpeciesMutation = useUpdateSpecies();
  const deleteSpeciesMutation = useDeleteSpecies();

  const species = speciesResponse?.species || [];

  // Form state
  const [formData, setFormData] = useState<CreateSpeciesFormData>({
    botanicalName: '',
    commonName: '',
    maoriName: '',
    threatenedSpecies: false,
    treesThatCount: true,
    notes: ''
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      botanicalName: '',
      commonName: '',
      maoriName: '',
      threatenedSpecies: false,
      treesThatCount: true,
      notes: ''
    });
  };

  const handleCreateSpecies = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createSpeciesMutation.mutateAsync(formData);
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create species:', error);
    }
  };

  const handleEditSpecies = (species: ApiSpecies) => {
    setEditingSpecies(species);
    setFormData({
      botanicalName: species.botanicalName,
      commonName: species.commonName,
      maoriName: species.maoriName || '',
      threatenedSpecies: species.threatenedSpecies,
      treesThatCount: species.treesThatCount,
      notes: species.notes || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateSpecies = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSpecies) return;

    try {
      await updateSpeciesMutation.mutateAsync({ id: editingSpecies.id, species: formData });
      setShowEditModal(false);
      setEditingSpecies(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update species:', error);
    }
  };

  const handleDeleteSpecies = (species: ApiSpecies) => {
    setDeletingSpecies(species);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingSpecies) return;

    try {
      await deleteSpeciesMutation.mutateAsync(deletingSpecies.id);
      setShowDeleteModal(false);
      setDeletingSpecies(null);
    } catch (error) {
      console.error('Failed to delete species:', error);
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
      <SpeciesHeader onAddSpecies={() => setShowCreateModal(true)} />

      <SpeciesTable 
        species={species}
        isLoading={isLoading}
        onEditSpecies={handleEditSpecies}
        onDeleteSpecies={handleDeleteSpecies}
      />

      <CreateSpeciesModal 
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        onSubmit={handleCreateSpecies}
        formData={formData}
        onInputChange={handleInputChange}
        isLoading={createSpeciesMutation.isPending}
      />

      <EditSpeciesModal 
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingSpecies(null);
          resetForm();
        }}
        onSubmit={handleUpdateSpecies}
        species={editingSpecies}
        formData={formData}
        onInputChange={handleInputChange}
        isLoading={updateSpeciesMutation.isPending}
      />

      <DeleteSpeciesModal 
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingSpecies(null);
        }}
        onConfirm={handleConfirmDelete}
        species={deletingSpecies}
        isLoading={deleteSpeciesMutation.isPending}
      />
    </div>
  );
} 