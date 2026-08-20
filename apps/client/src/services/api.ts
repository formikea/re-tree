import { UserRole } from '../types/auth';

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'https://api.re-tree.app'}/api`;

export interface ApiSpecies {
  id: number;
  botanicalName: string;
  commonName: string;
  maoriName: string | null;
  threatenedSpecies: boolean;
  treesThatCount: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiBatch {
  id: number;
  speciesId: number;
  nurseryId: number;
  origin: string;
  quantity: number;
  stage: 'seed' | 'prick' | 'pot' | 'plant';
  isOrder: boolean;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  species: ApiSpecies;
  nursery: {
    id: number;
    name: string;
    organisationId: number;
    createdAt: string;
    updatedAt: string;
  };
}

export interface ApiSite {
  id: number;
  name: string;
  region: string;
  coordinates: string;
  area: string;
  owner: string;
  type: string;
  notes: string;
  organisationId: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiSitesResponse {
  sites: ApiSite[];
  count: number;
  timestamp: string;
}

export interface ApiSiteResponse {
  site: ApiSite;
  timestamp: string;
}

export interface CreateSiteRequest {
  name: string;
  region: string;
  coordinates: string;
  area: number;
  owner: string;
  type: string;
  notes: string;
  organisationId: number;
}

export interface UpdateSiteRequest {
  name?: string;
  region?: string;
  coordinates?: string;
  area?: number;
  owner?: string;
  type?: string;
  notes?: string;
}

export interface ApiNursery {
  id: number;
  name: string;
  organisationId: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiNurseriesResponse {
  nurseries: ApiNursery[];
  count: number;
  timestamp: string;
}

export interface CreateNurseryRequest {
  name: string;
  organisationId: number;
}

export interface UpdateNurseryRequest {
  name?: string;
}

export interface ApiBatchesResponse {
  batches: ApiBatch[];
  count: number;
  timestamp: string;
}

export interface CreateBatchRequest {
  speciesId: number;
  nurseryId: number;
  origin?: string;
  quantity: number;
  stage: 'seed' | 'prick' | 'pot' | 'plant';
  isOrder?: boolean;
  completedAt?: string;
  notes?: string;
}

export interface UpdateBatchRequest {
  speciesId?: number;
  nurseryId?: number;
  origin?: string;
  quantity?: number;
  stage?: 'seed' | 'prick' | 'pot' | 'plant';
  isOrder?: boolean;
  completedAt?: string;
  notes?: string;
}

export interface ApiSpeciesResponse {
  species: ApiSpecies[];
  count: number;
  timestamp: string;
}

export interface ApiSeason {
  id: number;
  siteId: number;
  organisationId: number;
  year: number;
  season: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  site: ApiSite;
}

export interface ApiSeasonsResponse {
  seasons: ApiSeason[];
  count: number;
  timestamp: string;
}

export interface CreateSeasonRequest {
  siteId: number;
  organisationId: number;
  year: number;
  season: string;
  notes?: string;
}

export interface BulkCreateSeasonRequest {
  siteId: number;
  organisationId: number;
  year: number;
  season: string;
  notes?: string;
  addToAllSites: boolean;
}

export interface BulkSeasonResponse {
  seasons: ApiSeason[];
  created: number;
  skipped: number;
  message?: string;
  timestamp: string;
}

export interface ApiAllotment {
  id: number;
  seasonId: number;
  batchId: number;
  speciesId: number;
  quantity: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  batch?: ApiBatch;
  species?: ApiSpecies;
  season?: ApiSeason;
}

export interface CreateAllotmentRequest {
  seasonId: number;
  batchId: number;
  speciesId: number;
  quantity: number;
  notes?: string;
}

export interface BulkCreateAllotmentRequest {
  allotments: CreateAllotmentRequest[];
}

export interface ApiAllotmentsResponse {
  allotments: ApiAllotment[];
  count: number;
  timestamp: string;
}

export interface ApiVolunteer {
  id: string;
  name: string;
  email: string;
  role: 'coordinator' | 'planter' | 'maintenance';
  join_date: string;
  organizationId: string;
}

export interface ApiAdminOrganization {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    users: number;
    sites: number;
    nurseries: number;
    seasons: number;
  };
}

export interface ApiAdminOrganizationsResponse {
  organizations: ApiAdminOrganization[];
  count: number;
  timestamp: string;
}

export interface CreateOrganizationRequest {
  name: string;
}

export interface AddUserToOrganizationRequest {
  email: string;
  password: string;
  name: string;
  notes: string;
}

// Organization user management types
export interface ApiOrganizationUser {
  id: number;
  name: string | null;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiOrganizationUsersResponse {
  users: ApiOrganizationUser[];
  count: number;
  timestamp: string;
}

export interface ApiOrganizationUserResponse {
  user: ApiOrganizationUser;
  timestamp: string;
}

export interface CreateOrganizationUserRequest {
  name?: string;
  email: string;
  role?: UserRole;
  notes?: string;
}

export interface UpdateOrganizationUserRequest {
  name?: string;
  email?: string;
  password?: string;
  notes?: string;
}

import { authService } from './auth';

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Debug logging
    console.log('API Request Debug:', {
      url,
      isAuthenticated: authService.isAuthenticated(),
      hasToken: !!authService.getToken(),
      tokenExpired: authService.isTokenExpired()
    });
    
    // Check if token is expired and refresh if needed
    if (authService.isAuthenticated() && authService.isTokenExpired()) {
      console.log('Token expired, attempting refresh...');
      try {
        await authService.refreshToken();
        console.log('Token refreshed successfully');
      } catch (error) {
        console.error('Token refresh failed:', error);
        // If refresh fails, logout and throw error
        authService.handleRefreshTokenInvalidation();
        throw new Error('Session expired. Please log in again.');
      }
    }
    
    // Get auth token and user info
    const token = authService.getToken();
    const user = authService.getUser();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    console.log('Token for request:', token ? 'Present' : 'Missing');
    
    // Add authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('Authorization header added');
    } else {
      console.warn('No token available for request');
    }
    
    // Add organization header for multi-tenant support
    if (user?.organisationId) {
      headers['X-Organization-ID'] = user.organisationId.toString();
    }
    
    // Merge with any additional headers from options
    if (options?.headers) {
      Object.assign(headers, options.headers);
    }
    
    console.log('Final headers:', headers);
    
    const response = await fetch(url, {
      headers,
      ...options,
    });



    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        // Try to extract error message from response body
        let errorMessage = '';
        try {
          const responseText = await response.text();
          if (responseText) {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorData.error || '';
          }
        } catch (e) {
          console.warn('Failed to parse error response as JSON:', e);
        }
        
        // If it's a refresh token invalidation, don't try to refresh again
        if (errorMessage.includes('invalidated')) {
          console.log('Refresh token invalidated, logging out user');
          authService.handleRefreshTokenInvalidation();
          throw new Error('Session expired. Please log in again.');
        }
        
        // Try to refresh token before giving up (only if we haven't already tried)
        if (!authService.isRefreshingState) {
          try {
            console.log('Attempting token refresh due to 401 error');
            await authService.refreshToken();
            // Retry the request with the new token
            return this.request(endpoint, options);
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            authService.handleRefreshTokenInvalidation();
            throw new Error('Authentication failed. Please log in again.');
          }
        } else {
          console.log('Token refresh already in progress, logging out');
          authService.handleRefreshTokenInvalidation();
          throw new Error('Authentication failed. Please log in again.');
        }
      }
      
      // Try to extract error message from response body
      let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
      try {
        const responseText = await response.text();
        
        if (responseText) {
          const errorData = JSON.parse(responseText);
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        }
      } catch (e) {
        // If JSON parsing fails, use the default error message
        console.warn('Failed to parse error response as JSON:', e);
      }
      
      throw new Error(errorMessage);
    }

    const responseText = await response.text();
    
    if (!responseText) {
      throw new Error('Empty response body');
    }
    
    const data = JSON.parse(responseText);
    return data;
  }

  async getVolunteers(): Promise<ApiVolunteer[]> {
    return this.request<ApiVolunteer[]>('/volunteers');
  }

  async createVolunteer(volunteer: Omit<ApiVolunteer, 'id'>): Promise<ApiVolunteer> {
    return this.request<ApiVolunteer>('/volunteers', {
      method: 'POST',
      body: JSON.stringify(volunteer),
    });
  }

  async updateVolunteer(id: string, volunteer: Omit<ApiVolunteer, 'id'>): Promise<ApiVolunteer> {
    return this.request<ApiVolunteer>(`/volunteers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(volunteer),
    });
  }

  async deleteVolunteer(id: string): Promise<void> {
    await this.request<void>(`/volunteers/${id}`, {
      method: 'DELETE',
    });
  }

  async getOrganizationInfo(): Promise<{ id: string; name: string; description?: string }> {
    return this.request<{ id: string; name: string; description?: string }>('/organization');
  }

  // Species endpoints
  async getSpecies(): Promise<ApiSpeciesResponse> {
    return this.request<ApiSpeciesResponse>('/species');
  }

  async getSpeciesById(id: number): Promise<ApiSpecies> {
    return this.request<ApiSpecies>(`/species/${id}`);
  }

  async createSpecies(species: Omit<ApiSpecies, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiSpecies> {
    return this.request<ApiSpecies>('/species', {
      method: 'POST',
      body: JSON.stringify(species),
    });
  }

  async updateSpecies(id: number, species: Partial<Omit<ApiSpecies, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiSpecies> {
    return this.request<ApiSpecies>(`/species/${id}`, {
      method: 'PUT',
      body: JSON.stringify(species),
    });
  }

  async deleteSpecies(id: number): Promise<void> {
    await this.request<void>(`/species/${id}`, {
      method: 'DELETE',
    });
  }

  // Organisation Species endpoints
  async getOrganisationSpecies(organisationId: number): Promise<ApiSpeciesResponse> {
    return this.request<ApiSpeciesResponse>(`/species/organisation/${organisationId}`);
  }

  async addSpeciesToOrganisation(organisationId: number, speciesId: number): Promise<{message: string}> {
    const response = await this.request<{message: string, organisationSpecies?: any, timestamp?: string}>(`/species/organisation/${organisationId}`, {
      method: 'POST',
      body: JSON.stringify({ speciesId }),
    });
    
    return { message: response.message || 'Species added to organisation successfully' };
  }

  async removeSpeciesFromOrganisation(organisationId: number, speciesId: number): Promise<{message: string}> {
    const response = await this.request<{message: string, timestamp?: string}>(`/species/organisation/${organisationId}/${speciesId}`, {
      method: 'DELETE',
    });
    
    return { message: response.message || 'Species removed from organisation successfully' };
  }

  // Batches endpoints
  async getBatches(): Promise<ApiBatchesResponse> {
    return this.request<ApiBatchesResponse>('/batches');
  }

  async getBatchesByNursery(nurseryId: number): Promise<ApiBatchesResponse> {
    const response = await this.request<{batches: ApiBatch[], count: number, timestamp: string} | ApiBatchesResponse>(`/batches/nursery/${nurseryId}`);
    
    console.log('API getBatchesByNursery response:', response);
    
    // Handle both response formats
    if ('batches' in response && !('count' in response)) {
      console.log('Extracting batches from response.batches');
      return {
        batches: (response as { batches: ApiBatch[] }).batches,
        count: (response as { batches: ApiBatch[] }).batches.length,
        timestamp: new Date().toISOString()
      };
    }
    console.log('Using response directly as ApiBatchesResponse');
    return response as ApiBatchesResponse;
  }

  async getBatchById(id: string): Promise<ApiBatch> {
    return this.request<ApiBatch>(`/batches/${id}`);
  }

  async createBatch(batch: CreateBatchRequest): Promise<ApiBatch> {
    const response = await this.request<{batch: ApiBatch, message: string, timestamp: string}>('/batches', {
      method: 'POST',
      body: JSON.stringify(batch),
    });
    return response.batch;
  }

  async updateBatch(id: string, batch: UpdateBatchRequest): Promise<ApiBatch> {
    const response = await this.request<{batch: ApiBatch, message: string, timestamp: string}>('/batches/' + id, {
      method: 'PUT',
      body: JSON.stringify(batch),
    });
    return response.batch;
  }

  async deleteBatch(id: string): Promise<void> {
    await this.request<void>(`/batches/${id}`, {
      method: 'DELETE',
    });
  }

  // Sites endpoints
  async getSites(): Promise<ApiSitesResponse> {
    return this.request<ApiSitesResponse>('/sites');
  }

  async getSiteById(id: number): Promise<ApiSiteResponse> {
    return this.request<ApiSiteResponse>(`/sites/${id}`);
  }

  async createSite(site: CreateSiteRequest): Promise<ApiSite> {
    const response = await this.request<{site: ApiSite, message: string, timestamp: string} | ApiSite>('/sites', {
      method: 'POST',
      body: JSON.stringify(site),
    });
    
    console.log('API createSite response:', response);
    
    // Handle both response formats
    if ('site' in response) {
      console.log('Extracting site from response.site');
      return response.site;
    }
    console.log('Using response directly as ApiSite');
    return response as ApiSite;
  }

  async updateSite(id: number, site: UpdateSiteRequest): Promise<ApiSite> {
    const response = await this.request<{site: ApiSite, message: string, timestamp: string} | ApiSite>(`/sites/${id}`, {
      method: 'PUT',
      body: JSON.stringify(site),
    });
    
    console.log('API updateSite response:', response);
    
    // Handle both response formats
    if ('site' in response) {
      console.log('Extracting site from response.site');
      return response.site;
    }
    console.log('Using response directly as ApiSite');
    return response as ApiSite;
  }

  async deleteSite(id: number): Promise<void> {
    await this.request<void>(`/sites/${id}`, {
      method: 'DELETE',
    });
  }

  // Nurseries endpoints
  async getNurseries(): Promise<ApiNurseriesResponse> {
    return this.request<ApiNurseriesResponse>('/nurseries');
  }

  async getNurseryById(id: number): Promise<ApiNursery> {
    const response = await this.request<{nursery: ApiNursery, message: string, timestamp: string} | ApiNursery>(`/nurseries/${id}`);
    
    console.log('API getNurseryById response:', response);
    
    // Handle both response formats
    if ('nursery' in response) {
      console.log('Extracting nursery from response.nursery');
      return response.nursery;
    }
    console.log('Using response directly as ApiNursery');
    return response as ApiNursery;
  }

  async createNursery(nursery: CreateNurseryRequest): Promise<ApiNursery> {
    const response = await this.request<{nursery: ApiNursery, message: string, timestamp: string} | ApiNursery>('/nurseries', {
      method: 'POST',
      body: JSON.stringify(nursery),
    });
    
    console.log('API createNursery response:', response);
    
    // Handle both response formats
    if ('nursery' in response) {
      console.log('Extracting nursery from response.nursery');
      return response.nursery;
    }
    console.log('Using response directly as ApiNursery');
    return response as ApiNursery;
  }

  async updateNursery(id: number, nursery: UpdateNurseryRequest): Promise<ApiNursery> {
    const response = await this.request<{nursery: ApiNursery, message: string, timestamp: string} | ApiNursery>(`/nurseries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(nursery),
    });
    
    console.log('API updateNursery response:', response);
    
    // Handle both response formats
    if ('nursery' in response) {
      console.log('Extracting nursery from response.nursery');
      return response.nursery;
    }
    console.log('Using response directly as ApiNursery');
    return response as ApiNursery;
  }

  async deleteNursery(id: number): Promise<void> {
    await this.request<void>(`/nurseries/${id}`, {
      method: 'DELETE',
    });
  }

  // Get all seasons
  async getSeasons(): Promise<ApiSeasonsResponse> {
    return this.request<ApiSeasonsResponse>('/seasons');
  }

  // Get seasons by site
  async getSeasonsBySite(siteId: number): Promise<ApiSeasonsResponse> {
    return this.request<ApiSeasonsResponse>(`/seasons/site/${siteId}`);
  }

  // Create a new season
  async createSeason(season: CreateSeasonRequest): Promise<ApiSeason> {
    const response = await this.request<{season: ApiSeason, message: string, timestamp: string}>('/seasons', {
      method: 'POST',
      body: JSON.stringify(season),
    });
    
    console.log('API createSeason response:', response);
    return response.season;
  }

  // Create seasons for all organization sites
  async createBulkSeasons(season: BulkCreateSeasonRequest): Promise<BulkSeasonResponse> {
    const response = await this.request<BulkSeasonResponse>('/seasons/bulk', {
      method: 'POST',
      body: JSON.stringify(season),
    });
    
    console.log('API createBulkSeasons response:', response);
    return response;
  }

  // Allotments endpoints
  async getAllotments(): Promise<ApiAllotmentsResponse> {
    return this.request<ApiAllotmentsResponse>('/allotments');
  }

  async getAllotmentsBySeason(seasonId: number): Promise<ApiAllotmentsResponse> {
    return this.request<ApiAllotmentsResponse>(`/allotments/season/${seasonId}`);
  }

  async createAllotment(allotment: CreateAllotmentRequest): Promise<ApiAllotment> {
    const response = await this.request<{allotment: ApiAllotment, message: string, timestamp: string}>('/allotments', {
      method: 'POST',
      body: JSON.stringify(allotment),
    });
    
    console.log('API createAllotment response:', response);
    return response.allotment;
  }

  async createBulkAllotments(bulkRequest: BulkCreateAllotmentRequest): Promise<ApiAllotment[]> {
    const response = await this.request<{allotments: ApiAllotment[], message: string, timestamp: string}>('/allotments/bulk', {
      method: 'POST',
      body: JSON.stringify(bulkRequest),
    });
    
    console.log('API createBulkAllotments response:', response);
    return response.allotments;
  }

  async updateAllotment(id: number, allotment: Partial<CreateAllotmentRequest>): Promise<ApiAllotment> {
    const response = await this.request<{allotment: ApiAllotment, message: string, timestamp: string}>(`/allotments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(allotment),
    });
    
    console.log('API updateAllotment response:', response);
    return response.allotment;
  }

  async deleteAllotment(id: number): Promise<void> {
    await this.request<void>(`/allotments/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin endpoints
  async getAdminOrganizations(): Promise<ApiAdminOrganizationsResponse> {
    return this.request<ApiAdminOrganizationsResponse>('/admin/organizations');
  }

  async createAdminOrganization(organization: CreateOrganizationRequest): Promise<ApiAdminOrganization> {
    const response = await this.request<{organization: ApiAdminOrganization, message: string, timestamp: string} | ApiAdminOrganization>('/admin/organizations', {
      method: 'POST',
      body: JSON.stringify(organization),
    });
    
    console.log('API createAdminOrganization response:', response);
    
    // Handle both response formats
    if ('organization' in response) {
      console.log('Extracting organization from response.organization');
      return response.organization;
    }
    console.log('Using response directly as ApiAdminOrganization');
    return response as ApiAdminOrganization;
  }

  async addUserToOrganization(organizationId: number, userData: AddUserToOrganizationRequest): Promise<{message: string}> {
    const response = await this.request<{message: string, user?: any, timestamp?: string}>(`/admin/organizations/${organizationId}/users`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    console.log('API addUserToOrganization response:', response);
    return { message: response.message || 'User added successfully' };
  }

  // User management endpoints
  async getOrganizationUsers(): Promise<ApiOrganizationUsersResponse> {
    return this.request<ApiOrganizationUsersResponse>('/users');
  }

  async getOrganizationUser(userId: number): Promise<ApiOrganizationUserResponse> {
    return this.request<ApiOrganizationUserResponse>(`/users/${userId}`);
  }

  async createOrganizationUser(userData: CreateOrganizationUserRequest): Promise<ApiOrganizationUser> {
    const response = await this.request<{user: ApiOrganizationUser, message: string, timestamp: string}>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    return response.user;
  }

  async updateOrganizationUser(userId: number, userData: UpdateOrganizationUserRequest): Promise<ApiOrganizationUser> {
    const response = await this.request<{user: ApiOrganizationUser, message: string, timestamp: string}>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
    
    console.log('API updateOrganizationUser response:', response);
    return response.user;
  }

  async deleteOrganizationUser(userId: number): Promise<void> {
    await this.request<void>(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async updateOrganizationUserRole(userId: number, role: UserRole): Promise<ApiOrganizationUser> {
    const response = await this.request<{user: ApiOrganizationUser, message: string, timestamp: string}>(`/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    
    console.log('API updateOrganizationUserRole response:', response);
    return response.user;
  }

  // Invitation endpoints
  async verifyInvitationToken(token: string): Promise<{user: any, message: string, timestamp: string}> {
    return this.request<{user: any, message: string, timestamp: string}>(`/organization/invite/verify/${token}`);
  }

  async acceptInvitation(token: string, password: string, name?: string): Promise<{user: any, message: string, timestamp: string}> {
    const response = await this.request<{user: any, message: string, timestamp: string}>('/organization/invite/accept', {
      method: 'POST',
      body: JSON.stringify({ token, password, name }),
    });
    
    console.log('API acceptInvitation response:', response);
    return response;
  }

  async resendInvitation(userId: number): Promise<{message: string, timestamp: string}> {
    const response = await this.request<{message: string, timestamp: string}>(`/users/${userId}/resend-invitation`, {
      method: 'POST',
    });
    
    console.log('API resendInvitation response:', response);
    return response;
  }
}

export const apiService = new ApiService();