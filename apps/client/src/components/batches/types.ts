import { ApiBatch } from '@services/api';

export interface StageStyles {
  seed: string;
  prick: string;
  pot: string;
  plant: string;
}

export interface CompletionForm {
  quantity: string;
  stage: 'seed' | 'prick' | 'pot' | 'plant';
}

export interface CreateBatchFormData {
  speciesId: string;
  nurseryId: string;
  origin?: string;
  quantity: string;
  stage: string;
  notes: string;
}

export interface OrderBatchFormData {
  speciesId: string;
  nurseryId: string;
  quantity: string;
  stage: 'seed' | 'prick' | 'pot' | 'plant';
  notes: string;
}

export interface SpeciesStageMatrix {
  [speciesId: number]: {
    [stage: string]: number;
  };
}

export interface BatchesTableProps {
  species: any[];
  speciesStageMatrix: SpeciesStageMatrix;
  stageOrder: readonly string[];
  stageStyles: StageStyles;
}

export interface OrderBatchesTableProps {
  batches: ApiBatch[];
  stageStyles: StageStyles;
  onEditBatch: (batch: ApiBatch) => void;
  onCompleteOrder: (batch: ApiBatch) => void;
  isUpdating: boolean;
}

export interface CreateBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: CreateBatchFormData;
  onInputChange: (field: string, value: string) => void;
  species: any[];
  nurseries: any[];
  isLoading: boolean;
}

export interface CreateOrderBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: OrderBatchFormData;
  onInputChange: (field: string, value: string) => void;
  species: any[];
  nurseries: any[];
  isLoading: boolean;
}

export interface EditBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onCompleteOrder?: (formData: {
    speciesId: number;
    nurseryId: number;
    origin: string;
    quantity: number;
    stage: string;
    notes?: string;
  }) => void;
  batch: ApiBatch | null;
  species: any[];
  nurseries: any[];
  isLoading: boolean;
}

export interface CompleteOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  batch: ApiBatch | null;
  completionForm: CompletionForm;
  onCompletionFormChange: (field: keyof CompletionForm, value: string) => void;
  isLoading: boolean;
}

export interface OrdersTableProps {
  species: any[];
  speciesStageMatrix: SpeciesStageMatrix;
  stageOrder: readonly string[];
  stageStyles: StageStyles;
  onEditBatch: (batch: ApiBatch) => void;
  isUpdating: boolean;
  batches: ApiBatch[];
}

export interface TabbedBatchesProps {
  activeTab: 'batches' | 'orders';
  onTabChange: (tab: 'batches' | 'orders') => void;
}
