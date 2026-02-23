import { NextRequest, NextResponse } from 'next/server';
import { ScreeningService } from '@/lib/services/screening.service';
import { authenticateRequest, createUserSupabaseClient } from '@/lib/server/auth';
import { createSignedStorageUrl } from '@/lib/storage/signed-urls';

const REPORT_URL_TTL_SECONDS = 60 * 15;

const isSupabaseConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your_supabase_anon_key'
  );
};

const normalizeDocumentType = (documentType: unknown) => {
  const value = typeof documentType === 'string' ? documentType.trim() : '';
  const upper = value.toUpperCase();

  if (!value) return value;
  if (upper === 'PASAPORTE' || upper === 'PASSPORT') {
    return 'PASSPORT';
  }
  if (upper === 'DNI' || upper === 'NIE') {
    return upper;
  }

  return value;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const documentType = normalizeDocumentType(body.documentType);
    const normalizedDocumentNumber =
      typeof body.documentNumber === 'string' ? body.documentNumber.trim() : '';
    const rawOcrContext = body?.ocrContext;
    const ocrContext =
      rawOcrContext && typeof rawOcrContext === 'object' ? rawOcrContext : null;

    const isValidDocument = ScreeningService.validateSpanishDocument(
      documentType,
      normalizedDocumentNumber
    );

    if (!isValidDocument) {
      return NextResponse.json(
        {
          error: 'Formato de documento invalido',
          details: `Tipo: ${documentType}, Numero: ${normalizedDocumentNumber}`,
          expectedFormats: {
            DNI: '12345678A (8 digitos + letra)',
            NIE: 'X1234567A (X/Y/Z + 7 digitos + letra)',
            PASSPORT: 'ABC123456 (3 letras + 6 digitos)',
          },
        },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      const mockScreeningId = `mock-${Date.now()}`;
      return NextResponse.json({
        success: true,
        screeningId: mockScreeningId,
        message: 'Verificacion creada exitosamente (MODO DEMO - Supabase no configurado)',
        warning: 'This is a mock response. Configure Supabase to save real data.',
        demo: true,
      });
    }

    const auth = await authenticateRequest(request);
    if (!auth || !auth.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createUserSupabaseClient(auth.accessToken);
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
    }

    const landlordEmail = auth.user.email;
    const landlordName =
      typeof body.landlordName === 'string' && body.landlordName.trim()
        ? body.landlordName.trim()
        : typeof auth.user.user_metadata?.name === 'string' &&
            auth.user.user_metadata.name.trim()
          ? auth.user.user_metadata.name.trim()
          : landlordEmail;
    const landlordPhone =
      typeof body.landlordPhone === 'string' && body.landlordPhone.trim()
        ? body.landlordPhone.trim()
        : null;

    const { error: landlordError } = await supabase
      .from('landlords')
      .upsert(
        {
          id: auth.user.id,
          email: landlordEmail,
          name: landlordName,
          phone: landlordPhone,
        },
        {
          onConflict: 'id',
          ignoreDuplicates: false,
        }
      );

    if (landlordError) {
      console.error('Landlord error:', landlordError);
      return NextResponse.json(
        { error: 'Error al crear propietario' },
        { status: 500 }
      );
    }

    const { data: screening, error: screeningError } = await supabase
      .from('screenings')
      .insert({
        landlord_id: auth.user.id,
        landlord_email: landlordEmail,
        tenant_name: body.tenantName,
        tenant_email: body.tenantEmail,
        tenant_phone: body.tenantPhone,
        document_type: documentType,
        document_number: normalizedDocumentNumber,
        monthly_income: body.monthlyIncome,
        employment_status: body.employmentStatus,
        employment_years: body.employmentYears || null,
        contract_type: body.contractType || null,
        employer_name: body.employerName || null,
        references: body.references || null,
        previous_address: body.previousAddress || null,
        previous_landlord_name: body.previousLandlordName || null,
        previous_landlord_phone: body.previousLandlordPhone || null,
        property_address: body.propertyAddress,
        monthly_rent: body.monthlyRent,
        package_type: body.packageType,
        explanation: ocrContext ? { ocrContext } : null,
        status: 'pending',
      })
      .select()
      .single();

    if (screeningError) {
      console.error('Screening error:', screeningError);
      return NextResponse.json(
        { error: 'Error al crear verificacion' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      screeningId: screening.id,
      status: 'pending',
      message: 'Verificacion creada exitosamente. Pendiente de pago.',
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const landlordEmailParam = searchParams.get('landlordEmail');
    const screeningId = searchParams.get('id');

    if (!isSupabaseConfigured()) {
      const mockScreenings = [
        {
          id: 'demo-1',
          tenant_name: 'Ana Demo Usuario',
          tenant_email: 'ana@demo.com',
          property_address: 'Rambla de Catalunya, 50, Barcelona',
          status: 'completed',
          score: 92,
          created_at: new Date().toISOString(),
          demo: true,
        },
      ];

      return NextResponse.json({
        success: true,
        screenings: mockScreenings,
        data: mockScreenings,
        warning: 'Mock data - Configure Supabase for real data',
        demo: true,
      });
    }

    const auth = await authenticateRequest(request);
    if (!auth || !auth.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authenticatedEmail = auth.user.email;
    const normalizedAuthenticatedEmail = authenticatedEmail.toLowerCase();

    if (
      landlordEmailParam &&
      landlordEmailParam.trim().toLowerCase() !== normalizedAuthenticatedEmail
    ) {
      return NextResponse.json(
        { error: 'Forbidden: landlordEmail does not match authenticated user' },
        { status: 403 }
      );
    }

    const supabase = createUserSupabaseClient(auth.accessToken);
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
    }

    if (screeningId) {
      const { data: screening, error } = await supabase
        .from('screenings')
        .select('*')
        .eq('id', screeningId)
        .eq('landlord_email', authenticatedEmail)
        .maybeSingle();

      if (error || !screening) {
        return NextResponse.json({ error: 'Screening not found' }, { status: 404 });
      }

      const signedReportUrl = await createSignedStorageUrl(
        supabase,
        'reports',
        screening.report_url,
        REPORT_URL_TTL_SECONDS
      );

      return NextResponse.json({
        ...screening,
        report_url: signedReportUrl,
      });
    }

    const { data: screenings, error } = await supabase
      .from('screenings')
      .select('*')
      .eq('landlord_email', authenticatedEmail)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Error fetching screenings' }, { status: 500 });
    }

    const rows = screenings || [];
    const withSignedUrls = await Promise.all(
      rows.map(async (screening) => {
        const signedReportUrl = await createSignedStorageUrl(
          supabase,
          'reports',
          screening.report_url,
          REPORT_URL_TTL_SECONDS
        );

        return {
          ...screening,
          report_url: signedReportUrl,
        };
      })
    );

    return NextResponse.json({ screenings: withSignedUrls });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
