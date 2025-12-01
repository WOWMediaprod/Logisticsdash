export interface JobWizardProps {
  mode: 'admin' | 'client';
  companyId: string;
  onSuccess: (id: string) => void;
  onCancel: () => void;

  // Admin-specific
  adminUserId?: string;

  // Client-specific
  clientId?: string;
  clientName?: string;
  clientCode?: string;
}

export interface JobFormData {
  // Client info (admin mode only)
  clientId?: string;

  // Basic info
  title: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  shipmentType: 'EXPORT' | 'IMPORT' | 'LCL';

  // Documents
  releaseOrderFile: File | null;
  supportingDocuments: File[];

  // Loading information
  loadingLocation: string;
  loadingLocationLat: number;
  loadingLocationLng: number;
  loadingContactName: string;
  loadingContactPhone: string;
  loadingDate: string;
  loadingTime: string;

  // Container reservation (conditional)
  containerReservation: boolean;
  containerNumber: string;
  sealNumber: string;
  containerYardLocation: string;
  containerYardLocationLat: number;
  containerYardLocationLng: number;

  // Cargo details
  cargoDescription: string;
  cargoWeight: string;
  cargoWeightUnit: 'kg' | 'tons';

  // BL Cutoff (conditional)
  blCutoffRequired: boolean;
  blCutoffDate: string;
  blCutoffTime: string;

  // Wharf information
  wharfName: string;
  wharfContact: string;

  // Delivery information
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  deliveryContactName: string;
  deliveryContactPhone: string;

  // Additional notes
  specialRequirements: string;
}

export const getInitialFormData = (): JobFormData => ({
  title: '',
  priority: 'NORMAL',
  shipmentType: 'EXPORT',
  releaseOrderFile: null,
  supportingDocuments: [],
  loadingLocation: '',
  loadingLocationLat: 0,
  loadingLocationLng: 0,
  loadingContactName: '',
  loadingContactPhone: '',
  loadingDate: '',
  loadingTime: '',
  containerReservation: false,
  containerNumber: '',
  sealNumber: '',
  containerYardLocation: '',
  containerYardLocationLat: 0,
  containerYardLocationLng: 0,
  cargoDescription: '',
  cargoWeight: '',
  cargoWeightUnit: 'kg',
  blCutoffRequired: false,
  blCutoffDate: '',
  blCutoffTime: '',
  wharfName: '',
  wharfContact: '',
  deliveryAddress: '',
  deliveryLat: 0,
  deliveryLng: 0,
  deliveryContactName: '',
  deliveryContactPhone: '',
  specialRequirements: '',
});
