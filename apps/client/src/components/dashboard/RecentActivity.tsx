import React from 'react';
import { ApiSeason } from '../services/api';

interface RecentActivityProps {
  seasons: ApiSeason[];
}

export function RecentActivity({ seasons }: RecentActivityProps) {
  // Convert seasons to activities
  const activities = seasons
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map(season => {
      const date = new Date(season.createdAt);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      let timeAgo;
      if (diffInHours < 1) {
        timeAgo = 'Just now';
      } else if (diffInHours < 24) {
        timeAgo = `${diffInHours}h ago`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        timeAgo = `${diffInDays}d ago`;
      }

      return {
        id: season.id,
        time: timeAgo,
        title: `Season recorded at ${season.site.name}`,
        description: `${season.season} ${season.year}${season.notes ? ` - ${season.notes}` : ''}`,
        type: 'season' as const,
        color: 'emerald' as const
      };
    });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      
      {activities.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500">No recent activity</p>
          <p className="text-sm text-gray-400 mt-2">Start by creating your first season record</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`w-2 h-2 rounded-full mt-2 bg-${activity.color}-500`}></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </p>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {activity.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}