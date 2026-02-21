import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { ScreeningService } from '@/lib/services/screening.service';
import { ReportService } from '@/lib/services/report.service';
import { AsnefService } from '@/lib/services/asnef.service';
import { TenantScreening } from '@/types';
import { extractOcrContext } from '@/lib/ocr/extract-ocr-context';

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

    if (screening.status === 'completed') {
      return NextResponse.json({
        success: true,
        message: 'Screening already processed',
        score: screening.score,
        reportUrl: screening.report_url,
      });
    }

    if (screening.status === 'processing') {
      return NextResponse.json({
        success: true,
        message: 'Screening is already being processed',
        status: screening.status,
      });
    }

    const { data: claimedScreening, error: claimError } = await supabase
      .from('screenings')
      .update({ status: 'processing' })
      .in('status', ['pending', 'failed'])
      .eq('id', screeningId)
      .select('id')
      .maybeSingle();

    if (claimError) {
      console.error('Failed to claim screening before processing', claimError);
      return NextResponse.json(
        { error: 'Unable to start processing' },
        { status: 500 }
      );
    }

    if (!claimedScreening) {
      const { data: currentScreening } = await supabase
        .from('screenings')
        .select('status')
        .eq('id', screeningId)
        .single();

      if (currentScreening?.status === 'completed') {
        return NextResponse.json({
          success: true,
          message: 'Screening already processed',
          score: screening.score,
          reportUrl: screening.report_url,
        });
      }

      if (currentScreening?.status === 'processing') {
        return NextResponse.json({
          success: true,
          message: 'Screening is already being processed',
          status: currentScreening.status,
        });
      }

      return NextResponse.json(
        { error: `Cannot process screening in status ${currentScreening?.status || 'unknown'}` },
        { status: 409 }
      );
    }

    const resetToPending = async () => {
      const { error: resetError } = await supabase
        .from('screenings')
        .update({ status: 'pending' })
        .eq('id', screeningId);

      if (resetError) {
        console.error('Failed to reset processing status', resetError);
      }
    };

    // Optional credit check
    try {
      const creditCheckResult = await (async () => {
        try {
          return await AsnefService.checkCredit({
            documentType: screening.document_type,
            documentNumber: screening.document_number,
            fullName: screening.tenant_name || '',
          });
        } catch (error) {
          console.error('⚠️ ASNEF check failed, continuing without it:', error);
          return undefined;
        }
      })();

      // Calculate score with all new fields
      const result = ScreeningService.calculateScore({
        id: screening.id,
        tenantName: screening.tenant_name,
        monthlyIncome: screening.monthly_income,
        monthlyRent: screening.monthly_rent,
        employmentStatus: screening.employment_status,
        documentType: screening.document_type,
        documentNumber: screening.document_number,

        // NEW: Employment stability fields
        employmentYears: screening.employment_years,
        contractType: screening.contract_type,
        employerName: screening.employer_name,

        // NEW: References
        references: screening.references,

        // NEW: Rental history
        previousAddress: screening.previous_address,
        previousLandlordName: screening.previous_landlord_name,
        previousLandlordPhone: screening.previous_landlord_phone,
      }, creditCheckResult, extractOcrContext(screening.explanation));

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
        result,
        false // Not demo
      );

      // Upload PDF to Supabase Storage
      const fileName = `screening-${screeningId}-${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('reports')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf',
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        await resetToPending();
        return NextResponse.json(
          { error: 'Error uploading report' },
          { status: 500 }
        );
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('reports')
        .getPublicUrl(fileName);

      // Update screening with complete results
      const { error: updateError } = await supabase
        .from('screenings')
        .update({
          status: 'completed',
          score: result.score,
          report_url: urlData.publicUrl,
          completed_at: new Date().toISOString(),
          ...(creditCheckResult && { credit_checked_at: new Date().toISOString() }),

          // NEW: Save advanced scoring results
          risk_level: result.riskLevel,
          fraud_flags: result.fraudFlags,
          explanation: result.explanation,
          human_review_available: result.humanReviewAvailable,
          ...(creditCheckResult && {
            credit_score: creditCheckResult.creditScore,
            has_debts: creditCheckResult.hasActiveDebts,
            total_debt: creditCheckResult.totalDebt,
          }),
        })
        .eq('id', screeningId);

      if (updateError) {
        console.error('Update error:', updateError);
        await resetToPending();
        return NextResponse.json(
          { error: 'Error updating screening' },
          { status: 500 }
        );
      }

      // Get landlord details for email
      const { data: landlordData } = await supabase
        .from('landlords')
        .select('email, name')
        .eq('id', screening.landlord_id)
        .single();

      // Send email notification
      if (landlordData?.email) {
        try {
          const { sendEmail } = await import('@/lib/email');
          const ScreeningCompletedEmail = (await import('@/components/emails/ScreeningCompletedEmail')).default;

          await sendEmail({
            to: landlordData.email,
            subject: `✅ Verificación completada: ${screening.tenant_name}`,
            react: ScreeningCompletedEmail({
              landlordName: landlordData.name,
              tenantName: screening.tenant_name,
              score: result.score,
              reportUrl: urlData.publicUrl,
              documentId: screening.id.substring(0, 8).toUpperCase(),
            }),
          });
          console.log('📧 Email notification sent to:', landlordData.email);
        } catch (emailError) {
          console.error('⚠️ Failed to send email notification:', emailError);
          // Don't fail the request if email fails, just log it
        }
      }

      return NextResponse.json({
        success: true,
        result,
        reportUrl: urlData.publicUrl,
        emailSent: !!landlordData?.email
      });
    } catch (error) {
      await resetToPending();
      console.error('Process error:', error);
      return NextResponse.json(
        { error: 'Error processing screening' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Process error:', error);
    return NextResponse.json(
      { error: 'Error processing screening' },
      { status: 500 }
    );
  }
}
