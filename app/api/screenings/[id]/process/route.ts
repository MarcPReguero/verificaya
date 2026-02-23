import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { ScreeningService } from '@/lib/services/screening.service';
import { ReportService } from '@/lib/services/report.service';
import { AsnefService } from '@/lib/services/asnef.service';
import { TenantScreening } from '@/types';
import { extractOcrContext } from '@/lib/ocr/extract-ocr-context';
import { authenticateRequest, createUserSupabaseClient } from '@/lib/server/auth';
import { createSignedStorageUrl } from '@/lib/storage/signed-urls';

const INTERNAL_PROCESS_HEADER = 'x-internal-process-token';
const REPORT_URL_TTL_SECONDS = 60 * 15;
const EMAIL_REPORT_URL_TTL_SECONDS = 60 * 60 * 24 * 7;

const isSupabaseConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your_supabase_anon_key' &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your_service_role_key'
  );
};

const isInternalProcessingRequest = (request: NextRequest) => {
  const providedToken = request.headers.get(INTERNAL_PROCESS_HEADER);
  const expectedToken = process.env.STRIPE_WEBHOOK_SECRET;

  return !!(providedToken && expectedToken && providedToken === expectedToken);
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: screeningId } = await params;

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        message: 'Screening procesado exitosamente (MODO DEMO)',
        score: 85,
        demo: true,
        warning: 'Configure Supabase to process real screenings',
      });
    }

    const internalRequest = isInternalProcessingRequest(request);

    let ownerEmail: string | null = null;
    let supabase = null;

    if (internalRequest) {
      supabase = getServiceSupabase();
    } else {
      const auth = await authenticateRequest(request);
      if (!auth || !auth.user.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      ownerEmail = auth.user.email;
      supabase = createUserSupabaseClient(auth.accessToken);
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
    }

    let screeningQuery = supabase
      .from('screenings')
      .select('*')
      .eq('id', screeningId);

    if (ownerEmail) {
      screeningQuery = screeningQuery.eq('landlord_email', ownerEmail);
    }

    const { data: screening, error } = await screeningQuery.maybeSingle();

    if (error || !screening) {
      return NextResponse.json(
        { error: 'Screening not found' },
        { status: 404 }
      );
    }

    const signedExistingReportUrl = await createSignedStorageUrl(
      supabase,
      'reports',
      screening.report_url,
      REPORT_URL_TTL_SECONDS
    );

    if (screening.status === 'completed') {
      return NextResponse.json({
        success: true,
        message: 'Screening already processed',
        score: screening.score,
        reportUrl: signedExistingReportUrl,
      });
    }

    if (screening.status === 'processing') {
      return NextResponse.json({
        success: true,
        message: 'Screening is already being processed',
        status: screening.status,
      });
    }

    let claimQuery = supabase
      .from('screenings')
      .update({ status: 'processing' })
      .in('status', ['pending', 'failed'])
      .eq('id', screeningId);

    if (ownerEmail) {
      claimQuery = claimQuery.eq('landlord_email', ownerEmail);
    }

    const { data: claimedScreening, error: claimError } = await claimQuery
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
      let currentScreeningQuery = supabase
        .from('screenings')
        .select('status')
        .eq('id', screeningId);

      if (ownerEmail) {
        currentScreeningQuery = currentScreeningQuery.eq('landlord_email', ownerEmail);
      }

      const { data: currentScreening } = await currentScreeningQuery.maybeSingle();

      if (currentScreening?.status === 'completed') {
        return NextResponse.json({
          success: true,
          message: 'Screening already processed',
          score: screening.score,
          reportUrl: signedExistingReportUrl,
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
      let resetQuery = supabase
        .from('screenings')
        .update({ status: 'pending' })
        .eq('id', screeningId);

      if (ownerEmail) {
        resetQuery = resetQuery.eq('landlord_email', ownerEmail);
      }

      const { error: resetError } = await resetQuery;
      if (resetError) {
        console.error('Failed to reset processing status', resetError);
      }
    };

    try {
      const creditCheckResult = await (async () => {
        try {
          return await AsnefService.checkCredit({
            documentType: screening.document_type,
            documentNumber: screening.document_number,
            fullName: screening.tenant_name || '',
          });
        } catch (creditError) {
          console.error('ASNEF check failed, continuing without it:', creditError);
          return undefined;
        }
      })();

      const result = ScreeningService.calculateScore(
        {
          id: screening.id,
          tenantName: screening.tenant_name,
          monthlyIncome: screening.monthly_income,
          monthlyRent: screening.monthly_rent,
          employmentStatus: screening.employment_status,
          documentType: screening.document_type,
          documentNumber: screening.document_number,
          employmentYears: screening.employment_years,
          contractType: screening.contract_type,
          employerName: screening.employer_name,
          references: screening.references,
          previousAddress: screening.previous_address,
          previousLandlordName: screening.previous_landlord_name,
          previousLandlordPhone: screening.previous_landlord_phone,
        },
        creditCheckResult,
        extractOcrContext(screening.explanation)
      );

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
        false
      );

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

      const storedReportPath = fileName;
      const signedReportUrl = await createSignedStorageUrl(
        supabase,
        'reports',
        storedReportPath,
        REPORT_URL_TTL_SECONDS
      );
      const signedReportUrlForEmail = await createSignedStorageUrl(
        supabase,
        'reports',
        storedReportPath,
        EMAIL_REPORT_URL_TTL_SECONDS
      );

      let updateQuery = supabase
        .from('screenings')
        .update({
          status: 'completed',
          score: result.score,
          report_url: storedReportPath,
          completed_at: new Date().toISOString(),
          ...(creditCheckResult && { credit_checked_at: new Date().toISOString() }),
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

      if (ownerEmail) {
        updateQuery = updateQuery.eq('landlord_email', ownerEmail);
      }

      const { error: updateError } = await updateQuery;

      if (updateError) {
        console.error('Update error:', updateError);
        await resetToPending();
        return NextResponse.json(
          { error: 'Error updating screening' },
          { status: 500 }
        );
      }

      const { data: landlordData } = await supabase
        .from('landlords')
        .select('email, name')
        .eq('id', screening.landlord_id)
        .single();

      if (landlordData?.email) {
        try {
          const { sendEmail } = await import('@/lib/email');
          const ScreeningCompletedEmail = (await import('@/components/emails/ScreeningCompletedEmail')).default;
          const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://verificaya.es';
          const fallbackReportLink = `${appUrl}/dashboard`;

          await sendEmail({
            to: landlordData.email,
            subject: `Verificacion completada: ${screening.tenant_name}`,
            react: ScreeningCompletedEmail({
              landlordName: landlordData.name,
              tenantName: screening.tenant_name,
              score: result.score,
              reportUrl: signedReportUrlForEmail || fallbackReportLink,
              documentId: screening.id.substring(0, 8).toUpperCase(),
            }),
          });
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
        }
      }

      return NextResponse.json({
        success: true,
        result,
        reportUrl: signedReportUrl,
        emailSent: !!landlordData?.email,
      });
    } catch (processingError) {
      await resetToPending();
      console.error('Process error:', processingError);
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
