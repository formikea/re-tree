import React, { useState } from 'react';
import { Search, Plus, Minus, Loader2, Leaf, Check } from 'lucide-react';
import { ApiSpecies } from '@services/api';
import { useSpecies, useOrganisationSpecies, useAddSpeciesToOrganisation, useRemoveSpeciesFromOrganisation } from '@hooks/useApi';
import { useAuth } from '@hooks/useAuth';

type Species = ApiSpecies;

export function OrganisationSpecies() {
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  // React Query hooks
  const { data: speciesResponse, isLoading: speciesLoading, error: speciesError } = useSpecies();
  const { data: organisationSpeciesResponse, isLoading: organisationSpeciesLoading } = useOrganisationSpecies(parseInt(user?.organisationId || '0'));
  const addSpeciesMutation = useAddSpeciesToOrganisation();
  const removeSpeciesMutation = useRemoveSpeciesFromOrganisation();

  const species = speciesResponse?.species || [];
  const organisationSpecies = organisationSpeciesResponse?.species || [];

  const handleAddSpecies = async (speciesId: number) => {
    if (!user?.organisationId) return;

    try {
      await addSpeciesMutation.mutateAsync({ organisationId: parseInt(user.organisationId), speciesId });
    } catch (error) {
      console.error('Failed to add species to organisation:', error);
    }
  };

  const handleRemoveSpecies = async (speciesId: number) => {
    if (!user?.organisationId) return;

    try {
      await removeSpeciesMutation.mutateAsync({ organisationId: parseInt(user.organisationId), speciesId });
    } catch (error) {
      console.error('Failed to remove species from organisation:', error);
    }
  };

  const filteredSpecies = species.filter(species =>
    species.botanicalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    species.commonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (species.maoriName && species.maoriName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const isSpeciesAssigned = (speciesId: number) => {
    return organisationSpecies.some(s => s.id === speciesId);
  };

  if (speciesError) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold mb-2">Error</h2>
          <p className="text-red-700 mb-4">
            {speciesError instanceof Error ? speciesError.message : 'Failed to load species'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Organisation Species</h1>
          <p className="text-slate-600 mt-2">Manage which species your organisation can use</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Species for {user?.organisationName}
            </h2>
            <p className="text-slate-600 mt-1">
              {organisationSpecies.length} species assigned
            </p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search species..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        {speciesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <span className="ml-2 text-slate-600">Loading species...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSpecies.map((species) => {
              const isAssigned = isSpeciesAssigned(species.id);
              const isAdding = addSpeciesMutation.isPending && addSpeciesMutation.variables?.speciesId === species.id;
              const isRemoving = removeSpeciesMutation.isPending && removeSpeciesMutation.variables?.speciesId === species.id;

              return (
                <div
                  key={species.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                    isAssigned
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isAssigned ? 'bg-emerald-100' : 'bg-slate-100'
                    }`}>
                      <Leaf className={`w-5 h-5 ${
                        isAssigned ? 'text-emerald-600' : 'text-slate-600'
                      }`} />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{species.botanicalName}</div>
                      <div className="text-sm text-slate-600">{species.commonName}</div>
                      {species.maoriName && (
                        <div className="text-sm text-slate-500">{species.maoriName}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isAssigned && (
                      <span className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        <Check className="w-3 h-3" />
                        <span>Assigned</span>
                      </span>
                    )}
                    
                    <button
                      onClick={() => isAssigned ? handleRemoveSpecies(species.id) : handleAddSpecies(species.id)}
                      disabled={isAdding || isRemoving}
                      className={`p-2 rounded-lg transition-colors ${
                        isAssigned
                          ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
                          : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isAdding || isRemoving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isAssigned ? (
                        <Minus className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredSpecies.length === 0 && searchTerm && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No species found</h3>
            <p className="text-slate-600">Try adjusting your search terms</p>
          </div>
        )}
      </div>
    </div>
  );
}
