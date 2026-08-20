import React from 'react';
import { Leaf } from 'lucide-react';
import { ApiBatch } from '@services/api';
import { OrdersTableProps } from './types';

export function OrdersTable({ 
  species, 
  speciesStageMatrix, 
  stageOrder, 
  stageStyles, 
  onEditBatch, 
  isUpdating,
  batches
}: OrdersTableProps) {
  // Get unique species that have order batches
  const speciesWithOrders = species.filter(spec => 
    Object.values(speciesStageMatrix[spec.id] || {}).some(qty => qty > 0)
  );

  // Helper function to find batches for a species and stage
  const findBatchesForSpeciesStage = (speciesId: number, stage: string): ApiBatch[] => {
    return batches.filter(batch => 
      batch.speciesId === speciesId && 
      batch.stage === stage && 
      batch.isOrder
    );
  };

  // Helper function to find the first batch for a species and stage
  const findFirstBatchForSpeciesStage = (speciesId: number, stage: string): ApiBatch | null => {
    const foundBatches = findBatchesForSpeciesStage(speciesId, stage);
    return foundBatches.length > 0 ? foundBatches[0] : null;
  };

  // Handle cell click to edit/complete order for specific stage
  const handleCellClick = (spec: any, stage: string) => {
    const quantity = speciesStageMatrix[spec.id]?.[stage] || 0;
    if (quantity > 0) {
      const batch = findFirstBatchForSpeciesStage(spec.id, stage);
      if (batch) {
        onEditBatch(batch);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 font-medium text-slate-900 sticky left-0 bg-white z-10">Species</th>
              {stageOrder.map((stage) => (
                <th key={stage} className="text-center py-3 px-4 font-medium text-slate-900 capitalize">
                  <div className="flex flex-col items-center space-y-1">
                    <span className="capitalize">{stage}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${stageStyles[stage as keyof typeof stageStyles]}`}>
                      {stage}
                    </span>
                  </div>
                </th>
              ))}
              <th className="text-center py-3 px-4 font-medium text-slate-900">Total</th>
            </tr>
          </thead>
          <tbody>
            {speciesWithOrders.map((spec) => {
              const rowTotal = stageOrder.reduce((sum, stage) => sum + (speciesStageMatrix[spec.id]?.[stage] || 0), 0);
              
              return (
                <tr key={spec.id} className="border-b border-slate-100">
                  <td className="py-4 px-4 sticky left-0 bg-white z-10">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Leaf className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{spec.commonName}</div>
                        <div className="text-sm text-slate-600 italic">{spec.botanicalName}</div>
                      </div>
                    </div>
                  </td>
                  {stageOrder.map((stage) => {
                    const quantity = speciesStageMatrix[spec.id]?.[stage] || 0;
                    const hasOrders = quantity > 0;
                    
                    return (
                      <td 
                        key={stage} 
                        className={`py-4 px-4 text-center transition-colors ${
                          hasOrders 
                            ? 'hover:bg-orange-50 cursor-pointer' 
                            : ''
                        }`}
                        onClick={hasOrders ? () => handleCellClick(spec, stage) : undefined}
                        title={hasOrders ? `Click to manage ${spec.commonName} at ${stage} stage` : undefined}
                      >
                        <div className="flex flex-col items-center">
                          <span className={`font-medium ${hasOrders ? 'text-slate-900' : 'text-slate-400'}`}>
                            {hasOrders ? quantity.toLocaleString() : '-'}
                          </span>
                          {hasOrders && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 mt-1">
                              Order
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="py-4 px-4 text-center">
                    <span className="font-semibold text-slate-900">
                      {rowTotal.toLocaleString()}
                    </span>
                  </td>
                </tr>
              );
            })}
            {speciesWithOrders.length === 0 && (
              <tr>
                <td colSpan={stageOrder.length + 2} className="py-8 text-center text-slate-500">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 bg-slate-50">
              <td className="py-3 px-4 font-semibold text-slate-900 sticky left-0 bg-slate-50 z-10">
                Total by Stage
              </td>
              {stageOrder.map((stage) => {
                const stageTotal = speciesWithOrders.reduce((sum, spec) => 
                  sum + (speciesStageMatrix[spec.id]?.[stage] || 0), 0);
                return (
                  <td key={stage} className="py-3 px-4 text-center font-semibold text-slate-900">
                    {stageTotal.toLocaleString()}
                  </td>
                );
              })}
              <td className="py-3 px-4 text-center font-bold text-slate-900">
                {speciesWithOrders.reduce((sum, spec) => 
                  sum + stageOrder.reduce((stageSum, stage) => 
                    stageSum + (speciesStageMatrix[spec.id]?.[stage] || 0), 0), 0).toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
