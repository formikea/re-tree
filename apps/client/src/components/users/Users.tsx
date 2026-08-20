import React, { useState, useEffect } from 'react';
import { apiService } from '@services/api';
import { useAuth } from '@hooks/useAuth';
import { canManageUsers } from '@utils/roles';
import { UserRole } from '../../types/auth';
import type { 
  ApiOrganizationUser, 
  CreateOrganizationUserRequest, 
  UpdateOrganizationUserRequest 
} from '@services/api';
import { UsersHeader } from './UsersHeader';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorDisplay } from './ErrorDisplay';
import { UsersTable } from './UsersTable';
import { CreateUserModal } from './CreateUserModal';
import { EditUserModal } from './EditUserModal';
import { DeleteUserModal } from './DeleteUserModal';
import { CreateUserFormData, UpdateUserFormData } from './types';

interface UsersProps {}

export function Users({}: UsersProps) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<ApiOrganizationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingUser, setEditingUser] = useState<ApiOrganizationUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<ApiOrganizationUser | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [updateUserError, setUpdateUserError] = useState<string | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [deleteUserError, setDeleteUserError] = useState<string | null>(null);

  // Check if current user can manage users
  const canManage = currentUser?.role && canManageUsers(currentUser.role);
  
  // Debug logging
  console.log('Current user:', currentUser);
  console.log('Can manage users:', canManage);

  useEffect(() => {
    if (canManage) {
      loadUsers();
    }
  }, [canManage]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getOrganizationUsers();
      setUsers(response.users);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Form state for create user
  const [createFormData, setCreateFormData] = useState<CreateUserFormData>({
    email: '',
    name: '',
    role: 'USER',
    notes: ''
  });

  // Form state for edit user
  const [editFormData, setEditFormData] = useState<UpdateUserFormData>({
    name: '',
    notes: ''
  });

  const handleCreateUser = async (userData: CreateUserFormData) => {
    try {
      setIsCreatingUser(true);
      setCreateUserError(null);
      const newUser = await apiService.createOrganizationUser(userData);
      setUsers(prev => [...prev, newUser]);
      setShowCreateModal(false);
      resetCreateForm();
    } catch (err) {
      console.error('Error creating user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
      setCreateUserError(errorMessage);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleUpdateUser = async (userId: number, userData: UpdateUserFormData) => {
    try {
      setIsUpdatingUser(true);
      setUpdateUserError(null);
      const updatedUser = await apiService.updateOrganizationUser(userId, userData);
      setUsers(prev => prev.map(user => user.id === userId ? updatedUser : user));
      setShowEditModal(false);
      setEditingUser(null);
      resetEditForm();
    } catch (err) {
      console.error('Error updating user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user';
      setUpdateUserError(errorMessage);
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      setIsDeletingUser(true);
      setDeleteUserError(null);
      await apiService.deleteOrganizationUser(userId);
      setUsers(prev => prev.filter(user => user.id !== userId));
      setShowDeleteModal(false);
      setDeletingUser(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user';
      setDeleteUserError(errorMessage);
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleUpdateRole = async (userId: number, role: UserRole) => {
    try {
      const updatedUser = await apiService.updateOrganizationUserRole(userId, role);
      setUsers(prev => prev.map(user => user.id === userId ? updatedUser : user));
    } catch (err) {
      console.error('Error updating user role:', err);
      throw err;
    }
  };

  const resetCreateForm = () => {
    setCreateFormData({
      email: '',
      name: '',
      role: 'USER',
      notes: ''
    });
  };

  const resetEditForm = () => {
    setEditFormData({
      name: '',
      notes: ''
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setCreateFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditInputChange = (field: string, value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditUser = (user: ApiOrganizationUser) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name || '',
      notes: user.notes || ''
    });
    setShowEditModal(true);
  };

  const handleDeleteUserClick = (user: ApiOrganizationUser) => {
    setDeletingUser(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;
    await handleDeleteUser(deletingUser.id);
  };

  if (!canManage) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-yellow-800 font-semibold mb-2">Access Denied</h2>
          <p className="text-yellow-700">You don't have permission to manage users.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <UsersHeader onAddUser={() => setShowCreateModal(true)} canManage={canManage} />

      <UsersTable 
        users={users}
        isLoading={loading}
        canManage={canManage}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUserClick}
        onUpdateRole={handleUpdateRole}
      />

      <CreateUserModal 
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetCreateForm();
          setCreateUserError(null);
        }}
        onSubmit={handleCreateUser}
        formData={createFormData}
        onInputChange={handleInputChange}
        isLoading={isCreatingUser}
        error={createUserError}
      />

      <EditUserModal 
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingUser(null);
          resetEditForm();
          setUpdateUserError(null);
        }}
        onSubmit={handleUpdateUser}
        user={editingUser}
        formData={editFormData}
        onInputChange={handleEditInputChange}
        isLoading={isUpdatingUser}
        error={updateUserError}
      />

      <DeleteUserModal 
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingUser(null);
          setDeleteUserError(null);
        }}
        onConfirm={confirmDelete}
        user={deletingUser}
        isLoading={isDeletingUser}
        error={deleteUserError}
      />
    </div>
  );
}
