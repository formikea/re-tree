import React from 'react';
import { Leaf } from 'lucide-react';
import { BatchesTableProps } from './types';

export function BatchesTable({ species, speciesStageMatrix, stageOrder, stageStyles }: BatchesTableProps) {
  // Get unique species that have batches
  const speciesWithBatches = species.filter(spec => 
    Object.values(speciesStageMatrix[spec.id] || {}).some(qty => qty > 0)
  );

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
            {speciesWithBatches.map((spec) => {
              const rowTotal = stageOrder.reduce((sum, stage) => sum + (speciesStageMatrix[spec.id]?.[stage] || 0), 0);
              return (
                <tr key={spec.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4 sticky left-0 bg-white z-10">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <Leaf className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{spec.commonName}</div>
                        <div className="text-sm text-slate-600 italic">{spec.botanicalName}</div>
                      </div>
                    </div>
                  </td>
                  {stageOrder.map((stage) => {
                    const quantity = speciesStageMatrix[spec.id]?.[stage] || 0;
                    return (
                      <td key={stage} className="py-4 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`font-medium ${quantity > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                            {quantity > 0 ? quantity.toLocaleString() : '-'}
                          </span>
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
            {speciesWithBatches.length === 0 && (
              <tr>
                <td colSpan={stageOrder.length + 2} className="py-8 text-center text-slate-500">
                  No plants found.
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
                const stageTotal = speciesWithBatches.reduce((sum, spec) => 
                  sum + (speciesStageMatrix[spec.id]?.[stage] || 0), 0);
                return (
                  <td key={stage} className="py-3 px-4 text-center font-semibold text-slate-900">
                    {stageTotal.toLocaleString()}
                  </td>
                );
              })}
              <td className="py-3 px-4 text-center font-bold text-slate-900">
                {speciesWithBatches.reduce((sum, spec) => 
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
