import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { ScreeningService } from '@/lib/services/screening.service';

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url' &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your_service_role_key'
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
    const rawOcrContext = body?.ocrContext;
    const ocrContext =
      rawOcrContext && typeof rawOcrContext === 'object' ? rawOcrContext : null;
    
    // Debug logging
    console.log('📝 Received screening request:', {
      documentType,
      documentNumber: body.documentNumber,
      hasDocumentType: !!body.documentType,
      hasDocumentNumber: !!body.documentNumber
    });

    // Validate document format
    const isValidDocument = ScreeningService.validateSpanishDocument(
      documentType,
      body.documentNumber
    );

    if (!isValidDocument) {
      console.error('❌ Document validation failed:', {
        type: documentType,
        number: body.documentNumber
      });
      
      return NextResponse.json(
        { 
          error: 'Formato de documento inválido',
          details: `Tipo: ${documentType}, Número: ${body.documentNumber}`,
          expectedFormats: {
            DNI: '12345678A (8 dígitos + letra)',
            NIE: 'X1234567A (X/Y/Z + 7 dígitos + letra)',
            PASSPORT: 'ABC123456 (3 letras + 6 dígitos)'
          }
        },
        { status: 400 }
      );
    }

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase not configured - returning mock response');
      
      // Return mock success response for demo/development
      const mockScreeningId = `mock-${Date.now()}`;
      
      return NextResponse.json({ 
        success: true, 
        screeningId: mockScreeningId,
        message: 'Verificación creada exitosamente (MODO DEMO - Supabase no configurado)',
        warning: 'This is a mock response. Configure Supabase to save real data.',
        demo: true
      });
    }

    const supabase = getServiceSupabase();

    // Create or get landlord
    const { data: landlord, error: landlordError } = await supabase
      .from('landlords')
      .upsert({
        email: body.landlordEmail,
        name: body.landlordName,
        phone: body.landlordPhone,
      }, {
        onConflict: 'email',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (landlordError) {
      console.error('Landlord error:', landlordError);
      return NextResponse.json(
        { error: 'Error al crear propietario' },
        { status: 500 }
      );
    }

    // Create screening with new fields
    const { data: screening, error: screeningError } = await supabase
      .from('screenings')
      .insert({
        landlord_id: landlord.id,
        landlord_email: body.landlordEmail, // Add for easier querying
        tenant_name: body.tenantName,
        tenant_email: body.tenantEmail,
        tenant_phone: body.tenantPhone,
        document_type: documentType,
        document_number: body.documentNumber,
        monthly_income: body.monthlyIncome,
        employment_status: body.employmentStatus,

        // NEW: Employment stability fields
        employment_years: body.employmentYears || null,
        contract_type: body.contractType || null,
        employer_name: body.employerName || null,

        // NEW: References (JSONB array)
        references: body.references || null,

        // NEW: Rental history
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
        { error: 'Error al crear verificación' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      screeningId: screening.id,
      status: 'pending',
      message: 'Verificación creada exitosamente. Pendiente de pago.',
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
    const landlordEmail = searchParams.get('landlordEmail');
    const screeningId = searchParams.get('id');
    
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase not configured - returning mock data');
      
      // Return mock screenings for demo
      const mockScreenings = [
        {
          id: 'demo-1',
          tenant_name: 'Ana Demo Usuario',
          tenant_email: 'ana@demo.com',
          property_address: 'Rambla de Catalunya, 50, Barcelona',
          status: 'completed',
          score: 92,
          created_at: new Date().toISOString(),
          demo: true
        }
      ];
      
      return NextResponse.json({ 
        success: true, 
        data: mockScreenings,
        warning: 'Mock data - Configure Supabase for real data',
        demo: true
      });
    }

    const supabase = getServiceSupabase();

    if (screeningId) {
      // Get single screening
      const { data: screening, error } = await supabase
        .from('screenings')
        .select('*')
        .eq('id', screeningId)
        .single();

      if (error) {
        return NextResponse.json({ error: 'Screening not found' }, { status: 404 });
      }

      return NextResponse.json(screening);
    }

    if (landlordEmail) {
      // Get landlord's screenings
      const { data: landlord } = await supabase
        .from('landlords')
        .select('id')
        .eq('email', landlordEmail)
        .single();

      if (!landlord) {
        return NextResponse.json({ screenings: [] });
      }

      const { data: screenings, error } = await supabase
        .from('screenings')
        .select('*')
        .eq('landlord_id', landlord.id)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: 'Error fetching screenings' }, { status: 500 });
      }

      return NextResponse.json({ screenings });
    }

    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
