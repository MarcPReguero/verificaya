export interface TenantScreening {
  id: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  documentType: 'NIE' | 'DNI' | 'PASSPORT';
  documentNumber: string;
  monthlyIncome: number;
  employmentStatus: 'employed' | 'self-employed' | 'unemployed' | 'student';

  // NEW: Employment stability fields
  employmentYears?: number; // Years at current job
  contractType?: 'indefinido' | 'temporal' | 'autonomo' | 'other';
  employerName?: string;
  industrySector?: string;

  // NEW: Rental history
  previousAddress?: string;
  previousLandlordName?: string;
  previousLandlordPhone?: string;
  reasonForMoving?: string;
  yearsAtPreviousAddress?: number;

  // NEW: References
  references?: Reference[];

  landlordId: string;
  propertyAddress: string;
  monthlyRent: number;
  status: 'pending' | 'processing' | 'completed' | 'rejected' | 'failed';
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

  // NEW: Fraud detection
  fraudFlags: FraudFlag[];
  riskLevel: 'low' | 'medium' | 'high' | 'very_high';

  // NEW: GDPR-compliant explanations
  explanation: {
    topPositiveFactors: ScoringFactor[];
    topNegativeFactors: ScoringFactor[];
    improvementSuggestions: string[];
  };

  // NEW: GDPR Article 22 compliance
  humanReviewAvailable: boolean;
  dataProcessingConsent?: {
    asnefCheckConsented: boolean;
    consentedAt: string;
  };
}

export interface ScoringFactor {
  factor: string;
  points: number;
  description: string;
}

export interface FraudFlag {
  type: 'income_anomaly' | 'document_mismatch' | 'suspicious_ratio' | 'data_inconsistency';
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface Reference {
  id?: string;
  type: 'employer' | 'previous_landlord' | 'personal';
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  verified: boolean;
  verifiedAt?: Date;
  notes?: string;
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
