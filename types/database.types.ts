// Database types based on Supabase schema
export interface Database {
  public: {
    Tables: {
      landlords: {
        Row: {
          id: string;
          email: string;
          name: string;
          phone: string | null;
          company_name: string | null;
          nif: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          phone?: string | null;
          company_name?: string | null;
          nif?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          phone?: string | null;
          company_name?: string | null;
          nif?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      screenings: {
        Row: {
          id: string;
          landlord_id: string;
          tenant_name: string;
          tenant_email: string;
          tenant_phone: string | null;
          document_type: 'NIE' | 'DNI' | 'PASSPORT';
          document_number: string;
          monthly_income: number;
          employment_status: 'employed' | 'self-employed' | 'student' | 'unemployed';
          property_address: string;
          monthly_rent: number;
          package_type: 'basic' | 'complete';
          status: 'pending' | 'processing' | 'completed' | 'rejected';
          score: number | null;
          report_url: string | null;
          payment_id: string | null;
          created_at: string;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          landlord_id: string;
          tenant_name: string;
          tenant_email: string;
          tenant_phone?: string | null;
          document_type: 'NIE' | 'DNI' | 'PASSPORT';
          document_number: string;
          monthly_income: number;
          employment_status: 'employed' | 'self-employed' | 'student' | 'unemployed';
          property_address: string;
          monthly_rent: number;
          package_type: 'basic' | 'complete';
          status?: 'pending' | 'processing' | 'completed' | 'rejected';
          score?: number | null;
          report_url?: string | null;
          payment_id?: string | null;
          created_at?: string;
          completed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          landlord_id?: string;
          tenant_name?: string;
          tenant_email?: string;
          tenant_phone?: string | null;
          document_type?: 'NIE' | 'DNI' | 'PASSPORT';
          document_number?: string;
          monthly_income?: number;
          employment_status?: 'employed' | 'self-employed' | 'student' | 'unemployed';
          property_address?: string;
          monthly_rent?: number;
          package_type?: 'basic' | 'complete';
          status?: 'pending' | 'processing' | 'completed' | 'rejected';
          score?: number | null;
          report_url?: string | null;
          payment_id?: string | null;
          created_at?: string;
          completed_at?: string | null;
          updated_at?: string;
        };
      };
      screening_documents: {
        Row: {
          id: string;
          screening_id: string;
          document_type: 'payslip' | 'employment-contract' | 'id-document' | 'bank-statement' | 'reference';
          file_url: string;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          screening_id: string;
          document_type: 'payslip' | 'employment-contract' | 'id-document' | 'bank-statement' | 'reference';
          file_url: string;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          screening_id?: string;
          document_type?: 'payslip' | 'employment-contract' | 'id-document' | 'bank-statement' | 'reference';
          file_url?: string;
          uploaded_at?: string;
        };
      };
    };
  };
}
