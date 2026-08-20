import React, { useState, useEffect } from 'react';
import { apiService, ApiAdminOrganization } from '@services/api';
import { LoadingSpinner } from '@components/allotments/LoadingSpinner';
import { ErrorDisplay } from '@components/allotments/ErrorDisplay';
import { CreateOrganizationModal } from './CreateOrganizationModal';
import { AddUserToOrganizationModal } from './AddUserToOrganizationModal';
import { Building2, Users, MapPin, Calendar, TreePine, Plus, UserPlus, X } from 'lucide-react';

export function Organizations() {
  const [organizations, setOrganizations] = useState<ApiAdminOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<ApiAdminOrganization | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getAdminOrganizations();
      setOrganizations(response.organizations);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleCreateSuccess = (newOrganization: ApiAdminOrganization) => {
    setOrganizations(prev => [...prev, newOrganization]);
  };

  const handleAddUserClick = (organization: ApiAdminOrganization) => {
    setSelectedOrganization(organization);
    setIsAddUserModalOpen(true);
  };

  const handleAddUserSuccess = async (message: string) => {
    setSuccessMessage(message);
    setSelectedOrganization(null);
    // Auto-hide success message after 5 seconds
    setTimeout(() => setSuccessMessage(null), 5000);
    // Refresh the organizations to get updated user counts
    await fetchOrganizations();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
            <ErrorDisplay 
              message={error}
              onRetry={() => window.location.reload()}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Organizations</h1>
              <p className="text-slate-600 mt-2">
                Manage and view all organizations in the system
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Organization</span>
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <p className="text-sm text-green-700">{successMessage}</p>
                <button
                  onClick={() => setSuccessMessage(null)}
                  className="ml-auto text-green-500 hover:text-green-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-slate-600" />
                <span className="text-sm font-medium text-slate-600">Total Organizations</span>
              </div>
              <span className="text-2xl font-bold text-slate-900">{organizations.length}</span>
            </div>
          </div>
        </div>

        {/* Organizations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <div
              key={org.id}
              className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              {/* Organization Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">
                    {org.name}
                  </h3>
                  <p className="text-sm text-slate-500">ID: {org.id}</p>
                </div>
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-lg font-semibold text-slate-900">
                    {org._count.users}
                  </div>
                  <div className="text-xs text-slate-600">Users</div>
                </div>

                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <MapPin className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="text-lg font-semibold text-slate-900">
                    {org._count.sites}
                  </div>
                  <div className="text-xs text-slate-600">Sites</div>
                </div>

                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <TreePine className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-lg font-semibold text-slate-900">
                    {org._count.nurseries}
                  </div>
                  <div className="text-xs text-slate-600">Nurseries</div>
                </div>

                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <Calendar className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-lg font-semibold text-slate-900">
                    {org._count.seasons}
                  </div>
                  <div className="text-xs text-slate-600">Seasons</div>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-slate-200 pt-4">
                <button
                  onClick={() => handleAddUserClick(org)}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add User</span>
                </button>
              </div>

              {/* Timestamps */}
              <div className="border-t border-slate-200 pt-4 mt-4">
                <div className="text-xs text-slate-500 space-y-1">
                  <div>Created: {formatDate(org.createdAt)}</div>
                  <div>Updated: {formatDate(org.updatedAt)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {organizations.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
            <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No organizations found
            </h3>
            <p className="text-slate-600">
              There are currently no organizations in the system.
            </p>
          </div>
        )}

        {/* Create Organization Modal */}
        <CreateOrganizationModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />

        {/* Add User to Organization Modal */}
        <AddUserToOrganizationModal
          isOpen={isAddUserModalOpen}
          onClose={() => {
            setIsAddUserModalOpen(false);
            setSelectedOrganization(null);
          }}
          onSuccess={handleAddUserSuccess}
          organization={selectedOrganization}
        />
      </div>
    </div>
  );
}