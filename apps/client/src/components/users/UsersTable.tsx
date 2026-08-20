import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Loader2, 
  Shield,
  User,
  UserCheck,
  Crown,
  Mail
} from 'lucide-react';
import { ApiOrganizationUser } from '@services/api';
import { UserRole } from '../../../types/auth';
import { getRoleDisplayName } from '@utils/roles';

interface UsersTableProps {
  users: ApiOrganizationUser[];
  isLoading: boolean;
  canManage: boolean;
  onEditUser: (user: ApiOrganizationUser) => void;
  onDeleteUser: (user: ApiOrganizationUser) => void;
  onUpdateRole: (userId: number, role: UserRole) => void;
}

export function UsersTable({ 
  users, 
  isLoading, 
  canManage, 
  onEditUser, 
  onDeleteUser, 
  onUpdateRole 
}: UsersTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');

  const filteredUsers = users.filter(user => {
    if (!user || !user.email) {
      console.warn('Invalid user data:', user);
      return false;
    }

    const nameLower = (user.name || '').toLowerCase();
    const emailLower = user.email.toLowerCase();
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch = emailLower.includes(searchLower) || nameLower.includes(searchLower);
    const matchesFilter = roleFilter === 'ALL' || user.role === roleFilter;
    return matchesSearch && matchesFilter;
  });

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Crown className="w-4 h-4" />;
      case 'ADMIN':
        return <Shield className="w-4 h-4" />;
      case 'MANAGER':
        return <UserCheck className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-700';
      case 'ADMIN':
        return 'bg-red-100 text-red-700';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <span className="ml-2 text-slate-600">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | 'ALL')}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="ALL">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="USER">User</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 font-medium text-slate-900">User</th>
              <th className="text-left py-3 px-4 font-medium text-slate-900">Email</th>
              <th className="text-left py-3 px-4 font-medium text-slate-900">Role</th>
              <th className="text-left py-3 px-4 font-medium text-slate-900">Status</th>
              <th className="text-right py-3 px-4 font-medium text-slate-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr 
                key={user.id} 
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                                           <div className="font-medium text-slate-900">
                       {user.name || 'No name'}
                     </div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-slate-900">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>{user.email}</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    {getRoleIcon(user.role)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {getRoleDisplayName(user.role)}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.emailVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {user.emailVerified ? 'Verified' : 'Invited'}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-end space-x-2">
                    {canManage && (
                      <>
                        <button 
                          onClick={() => onEditUser(user)}
                          className="p-1 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onDeleteUser(user)}
                          className="p-1 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
