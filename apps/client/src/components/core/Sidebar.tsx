import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MapPin, 
  Settings,
  Leaf,
  Building2,
  Package,
  Shield,
  Globe,
  Database,
  Users
} from 'lucide-react';
import { useAuth } from '@hooks/useAuth';
import { isSuperAdmin, canManageUsers } from '@utils/roles';

export function Sidebar() {
  const { user } = useAuth();
  
  const primaryMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { id: 'sites', label: 'Sites', icon: MapPin, path: '/sites' },
    { id: 'batches', label: 'Plants', icon: Package, path: '/batches' },
  ];

  const secondaryMenuItems = [
    { id: 'nurseries', label: 'Nurseries', icon: Building2, path: '/nurseries' },
    { id: 'organisation-species', label: 'Species List', icon: Leaf, path: '/organisation-species' },
    { id: 'organization', label: 'Organization', icon: Globe, path: '/organization' },
    ...(user?.role && canManageUsers(user.role) ? [
      { id: 'users', label: 'Users', icon: Users, path: '/users' }
    ] : []),
    { id: 'data-management', label: 'Data & Export', icon: Database, path: '/data-management' },
  ];

  const adminItems = [
    { id: 'admin-organizations', label: 'Organizations', icon: Building2, path: '/admin/organizations' },
    { id: 'admin-species', label: 'Species', icon: Leaf, path: '/admin/species' },
  ];

  const renderMenuItems = (items: typeof primaryMenuItems, className = '') => {
    return items.map((item) => {
      const Icon = item.icon;
      
      return (
        <NavLink
          key={item.id}
          to={item.path}
          className={({ isActive }) => 
            `w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-colors ${className} ${
              isActive
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                : 'text-slate-700 hover:bg-slate-100'
            }`
          }
        >
          <Icon className="w-5 h-5" />
          <span className="font-medium">{item.label}</span>
        </NavLink>
      );
    });
  };

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{user?.name || user?.email || 'User'}</p>
            <p className="text-sm text-slate-600">Re-Tree Manager</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-6">
        {/* Primary Navigation */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3">
            Primary
          </h3>
          {renderMenuItems(primaryMenuItems)}
        </div>

        {/* Secondary Navigation - Only visible to managers and above */}
        {user?.role && canManageUsers(user.role) && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3">
              Settings
            </h3>
            {renderMenuItems(secondaryMenuItems, 'text-slate-600')}
          </div>
        )}

        {/* Admin Section - Only visible to super admins */}
        {user?.role && isSuperAdmin(user.role) && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3">
              <div className="flex items-center space-x-2">
                <Shield className="w-3 h-3" />
                <span>Super Admin</span>
              </div>
            </h3>
            {renderMenuItems(adminItems, 'text-orange-600')}
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div className="text-xs text-slate-500 text-center">
          v2.1.0 • Last sync: 2 min ago
        </div>
      </div>
    </div>
  );
}