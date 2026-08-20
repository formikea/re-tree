import React from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { CreateSeasonModalProps } from './types';

export function CreateSeasonModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onFormChange,
  sites,
  seasons,
  isLoading,
  isDuplicateSeason,
  sitesToReceiveSeason
}: CreateSeasonModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Add New Season</h2>
          
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Year *
              </label>
              <input
                type="number"
                required
                min="2020"
                max="2030"
                value={formData.year}
                onChange={(e) => onFormChange('year', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Season *
              </label>
              <select
                required
                value={formData.season}
                onChange={(e) => onFormChange('season', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="spring">Spring</option>
                <option value="summer">Summer</option>
                <option value="autumn">Autumn</option>
                <option value="winter">Winter</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => onFormChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional notes about this season..."
              />
            </div>

            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="addToAllSites"
                  checked={formData.addToAllSites}
                  onChange={(e) => onFormChange('addToAllSites', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="addToAllSites" className="text-sm font-medium text-slate-700">
                  Add this season to all organization sites
                </label>
              </div>
              <p className="text-xs text-slate-500 mt-1 ml-7">
                This will create the same season for all sites in your organization that don't already have it.
              </p>
              
              {formData.addToAllSites && (
                <div className="mt-3 ml-7">
                  <div className="text-xs text-slate-600 mb-2">
                    Sites that will receive this season ({sitesToReceiveSeason.length} of {sites.length}):
                  </div>
                  <div className="max-h-24 overflow-y-auto space-y-1">
                    {sitesToReceiveSeason.length > 0 ? (
                      sitesToReceiveSeason.map(site => (
                        <div key={site.id} className="text-xs text-slate-700 bg-slate-50 px-2 py-1 rounded">
                          {site.name}
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                        All sites already have this season
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {!formData.addToAllSites && isDuplicateSeason && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-800 text-sm">
                  ⚠️ A season for {formData.season} {formData.year} already exists for this site.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isLoading || 
                  (!formData.addToAllSites && isDuplicateSeason) ||
                  (formData.addToAllSites && sitesToReceiveSeason.length === 0)
                }
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:bg-slate-300 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{formData.addToAllSites ? 'Creating for all sites...' : 'Creating...'}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>{formData.addToAllSites ? 'Add to All Sites' : 'Add Season'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
