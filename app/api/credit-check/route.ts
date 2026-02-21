import { NextRequest, NextResponse } from 'next/server';
import { AsnefService } from '@/lib/services/asnef.service';

/**
 * POST /api/credit-check
 * 
 * Consulta historial crediticio en ASNEF
 * 
 * Body:
 * {
 *   documentType: 'DNI' | 'NIE' | 'PASSPORT',
 *   documentNumber: string,
 *   fullName: string,
 *   birthDate?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validación
    if (!body.documentNumber || !body.fullName) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Faltan campos requeridos: documentNumber, fullName' 
        },
        { status: 400 }
      );
    }
    
    // Validar formato de documento
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
          error: 'Formato de documento inválido' 
        },
        { status: 400 }
      );
    }
    
    // Realizar consulta ASNEF
    const creditResult = await AsnefService.checkCredit({
      documentType,
      documentNumber,
      fullName: body.fullName,
      birthDate: body.birthDate,
    });
    
    // Log para debugging (remover en producción)
    console.log('✅ Credit check completed:', {
      document: documentNumber,
      score: creditResult.creditScore,
      risk: creditResult.riskLevel,
      hasDebts: creditResult.hasActiveDebts,
      demoMode: creditResult.demoMode,
    });
    
    return NextResponse.json(creditResult);
    
  } catch (error) {
    console.error('❌ Error in credit check', error);
    
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

/**
 * Valida formato de documento español
 */
function isValidDocument(type: string, number: string): boolean {
  switch (type) {
    case 'DNI':
    case 'NIE':
      // 8 dígitos + letra o X/Y/Z + 7 dígitos + letra
      return /^[0-9XYZ][0-9]{7}[A-Z]$/i.test(number);
    
    case 'PASAPORTE':
    case 'PASSPORT':
      // 3 letras + 6 dígitos (español) o formato internacional
      return /^[A-Z]{3}[0-9]{6}$/i.test(number) || number.length >= 6;
    
    default:
      return false;
  }
}

/**
 * GET /api/credit-check?document=12345678A
 * 
 * Consulta rápida por documento (para testing)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const documentNumber = searchParams.get('document');
  
  if (!documentNumber) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Parámetro requerido: document' 
      },
      { status: 400 }
    );
  }
  
  try {
    const creditResult = await AsnefService.checkCredit({
      documentType: 'DNI',
      documentNumber: documentNumber.toUpperCase(),
      fullName: 'Test User',
    });
    
    return NextResponse.json(creditResult);
    
  } catch (error) {
    console.error('❌ Error in GET credit check', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al realizar consulta',
      },
      { status: 500 }
    );
  }
}

