import { ApiSpecies, ApiSeason, ApiAllotment, CreateAllotmentRequest } from '@services/api';

export interface AllotmentToDelete {
  id: number;
  speciesName: string;
  quantity: number;
}

export interface SpeciesAvailability {
  species: ApiSpecies;
  stages: Record<string, number>;
  total: number;
}

export interface StageStyles {
  seed: string;
  prick: string;
  pot: string;
  plant: string;
}

export interface AllotmentsProps {
  seasonId: string;
}

export interface AllotmentsHeaderProps {
  siteName: string;
  seasonName: string;
  year: number;
  onBack: () => void;
  onAddAllotment: () => void;
}

export interface SeasonInfoCardProps {
  site: ApiSeason['site'];
  season: ApiSeason;
  totalAllocated: number;
  allotmentsCount: number;
  formatDate: (dateString: string) => string;
  getSeasonDisplayName: (season: string) => string;
}

export interface AllotmentsTableProps {
  allotments: ApiAllotment[];
  isLoading: boolean;
  onDeleteAllotment: (allotment: ApiAllotment) => void;
  isDeleting: boolean;
  stageStyles: StageStyles;
}

export interface AllotmentRowProps {
  allotment: ApiAllotment;
  onDelete: (allotment: ApiAllotment) => void;
  isDeleting: boolean;
  stageStyles: StageStyles;
}

export interface AddAllotmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableSpecies: SpeciesAvailability[];
  speciesQuantities: Record<number, number>;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onQuantityChange: (speciesId: number, quantity: number) => void;
  onCreateAllotment: () => void;
  isCreating: boolean;
  stageStyles: StageStyles;
}

export interface SpeciesCardProps {
  speciesData: SpeciesAvailability;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  stageStyles: StageStyles;
}

export interface DeleteAllotmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  allotmentToDelete: AllotmentToDelete | null;
  onConfirmDelete: () => void;
  isDeleting: boolean;
}

export interface LoadingSpinnerProps {
  message?: string;
}

export interface ErrorDisplayProps {
  error: Error | string;
  title?: string;
} 