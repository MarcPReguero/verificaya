import { NextRequest, NextResponse } from 'next/server';
import { AsnefService } from '@/lib/services/asnef.service';
import { authenticateRequest } from '@/lib/server/auth';

const unauthorizedResponse = () =>
  NextResponse.json(
    {
      success: false,
      error: 'Unauthorized',
    },
    { status: 401 }
  );

const requireAuth = async (request: NextRequest) => {
  const auth = await authenticateRequest(request);
  if (!auth || !auth.user.email) {
    return null;
  }
  return auth;
};

/**
 * POST /api/credit-check
 *
 * Consulta historial crediticio en ASNEF
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    const body = await request.json();

    if (!body.documentNumber || !body.fullName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Faltan campos requeridos: documentNumber, fullName',
        },
        { status: 400 }
      );
    }

    const documentType =
      typeof body.documentType === 'string' && body.documentType.trim().toUpperCase() === 'PASAPORTE'
        ? 'PASSPORT'
        : typeof body.documentType === 'string'
          ? body.documentType.trim().toUpperCase()
          : 'DNI';
    const documentNumber = body.documentNumber.trim().toUpperCase();

    if (!isValidDocument(documentType, documentNumber)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Formato de documento invalido',
        },
        { status: 400 }
      );
    }

    const creditResult = await AsnefService.checkCredit({
      documentType,
      documentNumber,
      fullName: body.fullName,
      birthDate: body.birthDate,
    });

    console.log('Credit check completed:', {
      requestedBy: auth.user.id,
      document: documentNumber,
      score: creditResult.creditScore,
      risk: creditResult.riskLevel,
      hasDebts: creditResult.hasActiveDebts,
      demoMode: creditResult.demoMode,
    });

    return NextResponse.json(creditResult);
  } catch (error) {
    console.error('Error in credit check', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Error al realizar consulta crediticia',
        details: 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

function isValidDocument(type: string, number: string): boolean {
  switch (type) {
    case 'DNI':
    case 'NIE':
      return /^[0-9XYZ][0-9]{7}[A-Z]$/i.test(number);

    case 'PASAPORTE':
    case 'PASSPORT':
      return /^[A-Z]{3}[0-9]{6}$/i.test(number) || number.length >= 6;

    default:
      return false;
  }
}

/**
 * GET /api/credit-check?document=12345678A
 *
 * Ruta de soporte para testing interno, protegida por autenticacion.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth) {
    return unauthorizedResponse();
  }

  const searchParams = request.nextUrl.searchParams;
  const documentNumber = searchParams.get('document');

  if (!documentNumber) {
    return NextResponse.json(
      {
        success: false,
        error: 'Parametro requerido: document',
      },
      { status: 400 }
    );
  }

  try {
    const creditResult = await AsnefService.checkCredit({
      documentType: 'DNI',
      documentNumber: documentNumber.toUpperCase(),
      fullName: auth.user.email || 'Authenticated User',
    });

    return NextResponse.json(creditResult);
  } catch (error) {
    console.error('Error in GET credit check', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al realizar consulta',
      },
      { status: 500 }
    );
  }
}
