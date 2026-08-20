import React from 'react';
import { Package, Loader2 } from 'lucide-react';
import { AllotmentsTableProps } from './types';
import { AllotmentRow } from './AllotmentRow';
import { LoadingSpinner } from './LoadingSpinner';

export function AllotmentsTable({ 
  allotments, 
  isLoading, 
  onDeleteAllotment, 
  isDeleting, 
  stageStyles 
}: AllotmentsTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-6">Plant Allotments</h2>
      
      {isLoading ? (
        <LoadingSpinner message="Loading allotments..." />
      ) : allotments.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">No plant allotments created yet.</p>
          <p className="text-slate-500 text-sm mt-2">Add your first allotment to start planning this season's planting.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium text-slate-900">Species</th>
                <th className="text-left py-3 px-4 font-medium text-slate-900">Batch</th>
                <th className="text-left py-3 px-4 font-medium text-slate-900">Nursery</th>
                <th className="text-left py-3 px-4 font-medium text-slate-900">Stage</th>
                <th className="text-left py-3 px-4 font-medium text-slate-900">Quantity</th>
                <th className="text-right py-3 px-4 font-medium text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allotments.map((allotment) => (
                <AllotmentRow
                  key={allotment.id}
                  allotment={allotment}
                  onDelete={onDeleteAllotment}
                  isDeleting={isDeleting}
                  stageStyles={stageStyles}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 