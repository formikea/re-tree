import React from 'react';
import { Leaf, X, Loader2 } from 'lucide-react';
import { AllotmentRowProps } from './types';

export function AllotmentRow({ 
  allotment, 
  onDelete, 
  isDeleting, 
  stageStyles 
}: AllotmentRowProps) {
  return (
    <tr 
      className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
        String(allotment.id).startsWith('temp-') 
          ? 'bg-blue-50 border-blue-200 animate-pulse' 
          : ''
      }`}
    >
      <td className="py-4 px-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Leaf className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="font-medium text-slate-900">
              {allotment.species?.commonName || `Species ID: ${allotment.speciesId}`}
              {String(allotment.id).startsWith('temp-') && (
                <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  Saving...
                </span>
              )}
            </div>
            <div className="text-sm text-slate-600 italic">
              {allotment.species?.botanicalName || 'Species data not available'}
            </div>
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="font-medium text-slate-900">
          #{allotment.batch?.id || `Batch ID: ${allotment.batchId}`}
        </div>
        <div className="text-sm text-slate-600">
          {allotment.batch?.origin || 'Batch data not available'}
        </div>
      </td>
      <td className="py-4 px-4 text-slate-900">
        {allotment.batch?.nursery?.name || 'Nursery data not available'}
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${stageStyles[(allotment.batch?.stage as keyof typeof stageStyles) || 'seed']}`}>
            {allotment.batch?.stage || 'unknown'}
          </span>
          {allotment.batch?.isOrder && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
              Order
            </span>
          )}
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="font-medium text-slate-900">{allotment.quantity.toLocaleString()}</div>
        <div className="text-sm text-slate-600">
          of {allotment.batch?.quantity?.toLocaleString() || 'Unknown'}
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center justify-end space-x-2">
          <button 
            onClick={() => onDelete(allotment)}
            disabled={isDeleting}
            className="p-1 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <X className="w-4 h-4" />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
} 