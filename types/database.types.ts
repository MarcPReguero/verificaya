// Database types based on Supabase schema
type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];
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
          landlord_email: string | null;
          tenant_name: string;
          tenant_email: string;
          tenant_phone: string | null;
          document_type: 'NIE' | 'DNI' | 'PASSPORT';
          document_number: string;
          monthly_income: number;
          employment_status: 'employed' | 'self-employed' | 'student' | 'unemployed';
          employment_years: number | null;
          contract_type: string | null;
          employer_name: string | null;
          references: JsonValue | null;
          previous_address: string | null;
          previous_landlord_name: string | null;
          previous_landlord_phone: string | null;
          property_address: string;
          monthly_rent: number;
          package_type: 'basic' | 'complete';
          status: 'pending' | 'processing' | 'completed' | 'rejected' | 'failed';
          risk_level: 'low' | 'medium' | 'high' | 'very_high' | null;
          fraud_flags: JsonValue[] | null;
          explanation: Record<string, JsonValue> | null;
          human_review_available: boolean | null;
          credit_score: number | null;
          has_debts: boolean | null;
          total_debt: number | null;
          credit_checked_at: string | null;
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
          landlord_email?: string | null;
          tenant_name: string;
          tenant_email: string;
          tenant_phone?: string | null;
          document_type: 'NIE' | 'DNI' | 'PASSPORT';
          document_number: string;
          monthly_income: number;
          employment_status: 'employed' | 'self-employed' | 'student' | 'unemployed';
          employment_years?: number | null;
          contract_type?: string | null;
          employer_name?: string | null;
          references?: JsonValue | null;
          previous_address?: string | null;
          previous_landlord_name?: string | null;
          previous_landlord_phone?: string | null;
          property_address: string;
          monthly_rent: number;
          package_type: 'basic' | 'complete';
          status?: 'pending' | 'processing' | 'completed' | 'rejected' | 'failed';
          risk_level?: 'low' | 'medium' | 'high' | 'very_high' | null;
          fraud_flags?: JsonValue[] | null;
          explanation?: Record<string, JsonValue> | null;
          human_review_available?: boolean | null;
          credit_score?: number | null;
          has_debts?: boolean | null;
          total_debt?: number | null;
          credit_checked_at?: string | null;
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
          landlord_email?: string | null;
          tenant_name?: string;
          tenant_email?: string;
          tenant_phone?: string | null;
          document_type?: 'NIE' | 'DNI' | 'PASSPORT';
          document_number?: string;
          monthly_income?: number;
          employment_status?: 'employed' | 'self-employed' | 'student' | 'unemployed';
          employment_years?: number | null;
          contract_type?: string | null;
          employer_name?: string | null;
          references?: JsonValue | null;
          previous_address?: string | null;
          previous_landlord_name?: string | null;
          previous_landlord_phone?: string | null;
          property_address?: string;
          monthly_rent?: number;
          package_type?: 'basic' | 'complete';
          status?: 'pending' | 'processing' | 'completed' | 'rejected' | 'failed';
          risk_level?: 'low' | 'medium' | 'high' | 'very_high' | null;
          fraud_flags?: JsonValue[] | null;
          explanation?: Record<string, JsonValue> | null;
          human_review_available?: boolean | null;
          credit_score?: number | null;
          has_debts?: boolean | null;
          total_debt?: number | null;
          credit_checked_at?: string | null;
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
