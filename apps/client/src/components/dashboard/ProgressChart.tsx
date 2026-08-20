import React from 'react';
import { ApiSeason, ApiSite } from '../services/api';

interface ProgressChartProps {
  seasons: ApiSeason[];
  sites: ApiSite[];
}

export function ProgressChart({ seasons, sites }: ProgressChartProps) {
  // Group seasons by year
  const seasonsByYear = seasons.reduce((acc, season) => {
    const year = season.year;
    if (!acc[year]) {
      acc[year] = 0;
    }
    acc[year] += 1; // Count seasons instead of trees planted
    return acc;
  }, {} as Record<number, number>);

  const years = Object.keys(seasonsByYear).map(Number).sort();
  const maxSeasons = Math.max(...Object.values(seasonsByYear), 10);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Season Progress</h3>
      
      {years.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No season data available</p>
          <p className="text-sm text-gray-400 mt-2">Start by creating your first season record</p>
        </div>
      ) : (
        <div className="space-y-4">
          {years.map((year) => {
            const seasonCount = seasonsByYear[year];
            const percentage = (seasonCount / maxSeasons) * 100;
            
            return (
              <div key={year} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{year}</span>
                  <span className="text-sm text-gray-600">{seasonCount.toLocaleString()} seasons</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Sites:</span>
            <span className="ml-2 font-medium text-gray-900">{sites.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Total Seasons:</span>
            <span className="ml-2 font-medium text-gray-900">{seasons.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}