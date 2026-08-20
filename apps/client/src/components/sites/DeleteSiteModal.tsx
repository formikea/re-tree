import React from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { ApiSite } from '@services/api';

interface DeleteSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  site: ApiSite | null;
  isLoading: boolean;
}

export function DeleteSiteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  site, 
  isLoading 
}: DeleteSiteModalProps) {
  if (!isOpen || !site) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Delete Site</h2>
              <p className="text-slate-600">This action cannot be undone.</p>
            </div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-medium mb-2">Are you sure you want to delete this site?</p>
            <div className="text-red-700 text-sm space-y-1">
              <p><span className="font-medium">Name:</span> {site.name}</p>
              <p><span className="font-medium">Region:</span> {site.region}</p>
              <p><span className="font-medium">Type:</span> {site.type}</p>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Site</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
