import React from 'react';
import { ApiSeason } from '../services/api';

interface SeasonalOverviewProps {
  seasons: ApiSeason[];
}

export function SeasonalOverview({ seasons }: SeasonalOverviewProps) {
  // Group seasons by season
  const seasonNames = ['spring', 'summer', 'autumn', 'winter'];
  const currentYear = new Date().getFullYear();

  const seasonData = seasonNames.map(seasonName => {
    const seasonRecords = seasons.filter(season => {
      const seasonDate = new Date(season.createdAt);
      return seasonDate.getFullYear() === currentYear && season.season === seasonName;
    });

    const sites = new Set(seasonRecords.map(s => s.site.name)).size;

    return {
      season: seasonName.charAt(0).toUpperCase() + seasonName.slice(1),
      sites,
      records: seasonRecords.length
    };
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Seasonal Overview ({currentYear})</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {seasonData.map((season) => (
          <div key={season.season} className="text-center p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">{season.season}</h4>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-green-600">{season.records.toLocaleString()}</div>
              <div className="text-sm text-gray-600">season records</div>
              <div className="text-xs text-gray-500">
                {season.sites} sites • {season.records} records
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {seasons.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No season data for {currentYear}</p>
          <p className="text-sm text-gray-400 mt-2">Start by creating your first season record</p>
        </div>
      )}
    </div>
  );
}