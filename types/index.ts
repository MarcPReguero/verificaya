export interface TenantScreening {
  id: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  documentType: 'NIE' | 'DNI' | 'PASSPORT';
  documentNumber: string;
  monthlyIncome: number;
  employmentStatus: 'employed' | 'self-employed' | 'unemployed' | 'student';
  landlordId: string;
  propertyAddress: string;
  monthlyRent: number;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  score?: number;
  reportUrl?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface ScreeningDocument {
  id: string;
  screeningId: string;
  type: 'payslip' | 'employment-contract' | 'id-document' | 'bank-statement' | 'reference';
  url: string;
  uploadedAt: Date;
}

export interface ScreeningResult {
  screeningId: string;
  score: number; // 0-100
  approved: boolean;
  identityVerified: boolean;
  incomeVerified: boolean;
  creditCheckPassed: boolean;
  referencesVerified: boolean;
  notes: string[];
  recommendations: string;
}

export interface LandlordProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName?: string;
  nif: string;
  screeningsCount: number;
  createdAt: Date;
}
