
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@components/core/Layout';
import { LoginScreen } from '@components/auth/LoginScreen';
import { InviteAccept } from '@components/auth/InviteAccept';
import { ProtectedRoute } from '@components/core/ProtectedRoute';
import { SuperAdminRoute } from '@components/core/SuperAdminRoute';
import { ManagerRoute } from '@components/core/ManagerRoute';
import { Dashboard } from '@components/dashboard/Dashboard';
import { Sites } from '@components/sites/Sites';
import { SiteDetail } from '@components/sitedetail/SiteDetail';

import { Allotments } from '@components/allotments/Allotments';

import { Batches } from '@components/batches/Batches';
import { Species } from '@components/species/Species';
import { Nurseries } from '@components/nurseries/Nurseries';

import { Profile } from '@components/settings/Profile';
import { Organization } from '@components/settings/Organization';
import { DataManagement } from '@components/settings/DataManagement';
import { Organizations } from '@components/admin/Organizations';
import { OrganisationSpecies } from '@components/admin/OrganisationSpecies';
import { Users } from '@components/users/Users';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/invite" element={<InviteAccept />} />
      
      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="sites" element={<Sites />} />
        <Route path="sites/:siteId" element={<SiteDetail />} />

        <Route path="seasons/:seasonId" element={<Allotments />} />
        <Route path="batches" element={<Batches />} />
        <Route path="nurseries" element={<Nurseries />} />
        <Route path="organisation-species" element={<OrganisationSpecies />} />

        {/* Settings routes - Only accessible to managers and above */}
        <Route path="profile" element={
          <ManagerRoute>
            <Profile />
          </ManagerRoute>
        } />
        <Route path="organization" element={
          <ManagerRoute>
            <Organization />
          </ManagerRoute>
        } />
        <Route path="users" element={
          <ManagerRoute>
            <Users />
          </ManagerRoute>
        } />
        <Route path="data-management" element={
          <ManagerRoute>
            <DataManagement />
          </ManagerRoute>
        } />
        
        {/* Super Admin routes */}
        <Route path="admin/organizations" element={
          <SuperAdminRoute>
            <Organizations />
          </SuperAdminRoute>
        } />
        <Route path="admin/species" element={
          <SuperAdminRoute>
            <Species />
          </SuperAdminRoute>
        } />
      </Route>

      {/* Catch all route - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;