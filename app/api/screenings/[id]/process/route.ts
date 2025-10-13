import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { ScreeningService } from '@/lib/services/screening.service';
import { ReportService } from '@/lib/services/report.service';
import { TenantScreening } from '@/types';

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url' &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your_service_role_key'
  );
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: screeningId } = await params;

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase not configured - returning mock processing result');
      
      // Return mock processing result for demo
      return NextResponse.json({
        success: true,
        message: 'Screening procesado exitosamente (MODO DEMO)',
        score: 85,
        demo: true,
        warning: 'Configure Supabase to process real screenings'
      });
    }

    const supabase = getServiceSupabase();

    // Get screening data
    const { data: screening, error } = await supabase
      .from('screenings')
      .select('*')
      .eq('id', screeningId)
      .single();

    if (error || !screening) {
      return NextResponse.json(
        { error: 'Screening not found' },
        { status: 404 }
      );
    }

    // Calculate score
    const result = ScreeningService.calculateScore({
      id: screening.id,
      tenantName: screening.tenant_name,
      monthlyIncome: screening.monthly_income,
      monthlyRent: screening.monthly_rent,
      employmentStatus: screening.employment_status,
      documentType: screening.document_type,
      documentNumber: screening.document_number,
    });

    // Generate PDF report
    const pdfBlob = await ReportService.generatePDFReport(
      {
        id: screening.id,
        tenantName: screening.tenant_name,
        tenantEmail: screening.tenant_email,
        tenantPhone: screening.tenant_phone,
        documentType: screening.document_type,
        documentNumber: screening.document_number,
        monthlyIncome: screening.monthly_income,
        employmentStatus: screening.employment_status,
        landlordId: screening.landlord_id,
        propertyAddress: screening.property_address,
        monthlyRent: screening.monthly_rent,
        status: 'completed',
        score: result.score,
        createdAt: new Date(screening.created_at),
      } as TenantScreening,
      result
    );

    // Upload PDF to Supabase Storage
    const fileName = `screening-${screeningId}-${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('reports')
      .upload(fileName, pdfBlob, {
        contentType: 'application/pdf',
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Error uploading report' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('reports')
      .getPublicUrl(fileName);

    // Update screening with results
    const { error: updateError } = await supabase
      .from('screenings')
      .update({
        status: 'completed',
        score: result.score,
        report_url: urlData.publicUrl,
        completed_at: new Date().toISOString(),
      })
      .eq('id', screeningId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Error updating screening' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      result,
      reportUrl: urlData.publicUrl,
    });
  } catch (error) {
    console.error('Process error:', error);
    return NextResponse.json(
      { error: 'Error processing screening' },
      { status: 500 }
    );
  }
}
