import { ApiSeason, ApiSpecies, ApiSite } from '@services/api';

export interface SeasonFormData {
  year: number;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  notes: string;
  addToAllSites: boolean;
}

export interface AllotmentFormData {
  quantity: string;
}

export interface OrderBatchFormData {
  nurseryId: number;
  quantity: number;
  stage: 'seed' | 'prick' | 'pot' | 'plant';
  notes: string;
  allotmentQuantity: number;
}

export interface SelectedCell {
  speciesId: number;
  seasonId: number;
}

export interface SiteDetailHeaderProps {
  site: ApiSite | null;
  siteId: string | undefined;
  onAddSeason: () => void;
  onBack: () => void;
}

export interface SiteDetailGridProps {
  species: ApiSpecies[];
  seasons: ApiSeason[];
  batches: any[];
  allAllotments: any[];
  onCellClick: (speciesId: number, seasonId: number) => void;
  onOrderBatchClick: (speciesId: number, seasonId: number) => void;
  getAvailableQuantityForSpecies: (speciesId: number) => number;
  getAllotmentQuantityForSpeciesSeason: (speciesId: number, seasonId: number) => number;
}

export interface CreateAllotmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  selectedCell: SelectedCell | null;
  quantity: string;
  onQuantityChange: (value: string) => void;
  species: ApiSpecies[];
  seasons: ApiSeason[];
  isLoading: boolean;
}

export interface CreateSeasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: SeasonFormData;
  onFormChange: (field: keyof SeasonFormData, value: any) => void;
  sites: ApiSite[];
  seasons: ApiSeason[];
  isLoading: boolean;
  isDuplicateSeason: boolean;
  sitesToReceiveSeason: ApiSite[];
}

export interface CreateOrderBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  selectedCell: SelectedCell | null;
  formData: OrderBatchFormData;
  onFormChange: (field: keyof OrderBatchFormData, value: any) => void;
  species: ApiSpecies[];
  seasons: ApiSeason[];
  nurseries: any[];
  isLoading: boolean;
}
