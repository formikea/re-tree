import React, { useState } from 'react';
import { CreateSiteRequest, UpdateSiteRequest, ApiSite } from '@services/api';
import { useSites, useCreateSite, useUpdateSite, useDeleteSite } from '@hooks/useApi';
import { SitesHeader } from './SitesHeader';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorDisplay } from './ErrorDisplay';
import { SitesTable } from './SitesTable';
import { CreateSiteModal } from './CreateSiteModal';
import { EditSiteModal } from './EditSiteModal';
import { DeleteSiteModal } from './DeleteSiteModal';
import { CreateSiteFormData } from './types';

export function Sites() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingSite, setEditingSite] = useState<ApiSite | null>(null);
  const [deletingSite, setDeletingSite] = useState<ApiSite | null>(null);

  // React Query hooks
  const { data: sitesResponse, isLoading, error } = useSites();
  const createSiteMutation = useCreateSite();
  const updateSiteMutation = useUpdateSite();
  const deleteSiteMutation = useDeleteSite();

  const sites = sitesResponse?.sites || [];

  // Form state
  const [formData, setFormData] = useState<CreateSiteFormData>({
    name: '',
    region: '',
    coordinates: '',
    area: '',
    owner: '',
    type: 'Regional Park',
    notes: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      region: '',
      coordinates: '',
      area: '',
      owner: '',
      type: 'Regional Park',
      notes: ''
    });
  };

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const siteData: CreateSiteRequest = {
      name: formData.name,
      region: formData.region,
      coordinates: formData.coordinates,
      area: parseFloat(formData.area),
      owner: formData.owner,
      type: formData.type,
      notes: formData.notes,
      organisationId: 1 // This should come from auth context in a real app
    };
    
    try {
      await createSiteMutation.mutateAsync(siteData);
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      console.error('Error creating site:', err);
    }
  };

  const handleEditSite = (site: ApiSite) => {
    setEditingSite(site);
    setFormData({
      name: site.name,
      region: site.region,
      coordinates: site.coordinates,
      area: site.area.toString(),
      owner: site.owner,
      type: site.type,
      notes: site.notes
    });
    setShowEditModal(true);
  };

  const handleUpdateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSite) return;
    
    const siteData: UpdateSiteRequest = {
      name: formData.name,
      region: formData.region,
      coordinates: formData.coordinates,
      area: parseFloat(formData.area),
      owner: formData.owner,
      type: formData.type,
      notes: formData.notes
    };
    
    try {
      await updateSiteMutation.mutateAsync({ id: editingSite.id, site: siteData });
      setShowEditModal(false);
      setEditingSite(null);
      resetForm();
    } catch (err) {
      console.error('Error updating site:', err);
    }
  };

  const handleDeleteSite = (site: ApiSite) => {
    setDeletingSite(site);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingSite) return;
    
    try {
      await deleteSiteMutation.mutateAsync(deletingSite.id);
      setShowDeleteModal(false);
      setDeletingSite(null);
    } catch (err) {
      console.error('Error deleting site:', err);
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
      <SitesHeader onAddSite={() => setShowCreateModal(true)} />

      <SitesTable 
        sites={sites}
        isLoading={isLoading}
        onEditSite={handleEditSite}
        onDeleteSite={handleDeleteSite}
      />

      <CreateSiteModal 
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        onSubmit={handleCreateSite}
        formData={formData}
        onInputChange={handleInputChange}
        isLoading={createSiteMutation.isPending}
      />

      <EditSiteModal 
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingSite(null);
          resetForm();
        }}
        onSubmit={handleUpdateSite}
        site={editingSite}
        formData={formData}
        onInputChange={handleInputChange}
        isLoading={updateSiteMutation.isPending}
      />

      <DeleteSiteModal 
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingSite(null);
        }}
        onConfirm={confirmDelete}
        site={deletingSite}
        isLoading={deleteSiteMutation.isPending}
      />
    </div>
  );
}