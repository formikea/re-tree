import React from 'react';
import { MapPin, Calendar, Package, Target } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { ProgressChart } from './ProgressChart';
import { RecentActivity } from './RecentActivity';
import { SeasonalOverview } from './SeasonalOverview';
import { useSeasons, useSites } from '@hooks/useApi';
import { useAuth } from '@hooks/useAuth';

export function Dashboard() {
  const { user } = useAuth();
  const { data: seasonsResponse, isLoading: seasonsLoading, error: seasonsError } = useSeasons();
  const { data: sitesResponse, isLoading: sitesLoading, error: sitesError } = useSites();

  const seasons = seasonsResponse?.seasons || [];
  const sites = sitesResponse?.sites || [];

  // Calculate metrics from seasons, sites, and batches data
  const totalSeasons = seasons.length;
  const activeSites = sites.length; // All sites are considered active
  const completedSeasons = seasons.length;

  // Get current season seasons (last 3 months)
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const currentSeasonSeasons = seasons.filter(season => 
    new Date(season.createdAt) >= threeMonthsAgo
  ).length;

  const metrics = [
    {
      title: 'Total Seasons',
      value: totalSeasons.toLocaleString(),
      icon: Target,
      change: '+12%',
      trend: 'up' as const,
      color: 'emerald' as const,
    },
    {
      title: 'Active Sites',
      value: activeSites.toString(),
      icon: MapPin,
      change: '+3',
      trend: 'up' as const,
      color: 'blue' as const,
    },
    {
      title: 'Season Records',
      value: completedSeasons.toString(),
      icon: Calendar,
      change: '+5',
      trend: 'up' as const,
      color: 'amber' as const,
    },
    {
      title: 'Current Season',
      value: currentSeasonSeasons.toString(),
      icon: Package,
      change: '+8',
      trend: 'up' as const,
      color: 'purple' as const,
    },
  ];

  const isLoading = seasonsLoading || sitesLoading;
  const error = seasonsError || sitesError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">
          Error: {error instanceof Error ? error.message : 'Failed to load dashboard data'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name || user?.email || 'User'}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening with your reforestation activities today.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProgressChart seasons={seasons} sites={sites} />
        <RecentActivity seasons={seasons} />
      </div>

      {/* Seasonal Overview */}
      <SeasonalOverview seasons={seasons} />
    </div>
  );
}