/**
 * OCR Analysis API Endpoint
 * POST /api/ocr/analyze
 * Analyzes uploaded identity document and extracts data
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeDocumentWithOpenRouter, isOpenRouterConfigured } from '@/lib/ocr/openrouter-vision';
import { analyzeDocumentWithLMStudio, isLMStudioConfigured } from '@/lib/ocr/lmstudio-vision';

export async function POST(request: NextRequest) {
  try {
    console.log('[OCR API] Request received');

    // Get form data early to check which provider to use
    const formData = await request.formData();
    const useLocalOCR = formData.get('useLocalOCR') === 'true';
    const provider = useLocalOCR ? 'LM Studio' : 'OpenRouter';

    console.log(`[OCR API] Using provider: ${provider}`);

    // Check if the selected provider is configured
    if (useLocalOCR) {
      if (!isLMStudioConfigured()) {
        return NextResponse.json(
          {
            error: 'LM Studio not configured',
            message: 'LM Studio is not running or not accessible. Please start LM Studio and load a vision model.',
            demoMode: true,
          },
          { status: 503 }
        );
      }
    } else {
      if (!isOpenRouterConfigured()) {
        return NextResponse.json(
          {
            error: 'OCR service not configured',
            message: 'OpenRouter API key is missing. Please configure OPENROUTER_API_KEY environment variable.',
            demoMode: true,
          },
          { status: 503 }
        );
      }
    }

    console.log('[OCR API] Provider is configured');

    console.log('[OCR API] FormData retrieved');

    const file = formData.get('file') as File;
    const documentType = (formData.get('documentType') as 'IDENTITY' | 'PAYSLIP' | 'CONTRACT') || 'IDENTITY';
    console.log(`[OCR API] File: ${file?.name}, Type: ${documentType}, Use Local: ${useLocalOCR}`);

    if (!file) {
      console.log('[OCR API] No file provided');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    console.log(`[OCR API] File mime type: ${file.type}`);
    if (!allowedTypes.includes(file.type)) {
      console.log(`[OCR API] Invalid file type: ${file.type}`);
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image (JPG, PNG, WEBP) or PDF' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.log(`[OCR API] File too large: ${file.size} bytes`);
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    console.log('[OCR API] Converting file to buffer...');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`[OCR API] Buffer created: ${buffer.length} bytes`);

    // Analyze document with OpenRouter or LM Studio
    console.log(`[OCR API] Calling ${provider} OCR service...`);
    const ocrResult = useLocalOCR
      ? await analyzeDocumentWithLMStudio(buffer, file.type, documentType)
      : await analyzeDocumentWithOpenRouter(buffer, file.type, documentType);
    console.log(`[OCR API] OCR Result: success=${ocrResult.success}`);

    if (!ocrResult.success) {
      console.error(`[OCR API] OCR failed: ${ocrResult.error}`);
      // Log raw text if available for debugging
      if (ocrResult.text) {
        console.error(`[OCR API] Raw text from failed attempt: ${ocrResult.text.substring(0, 500)}...`);
      }
      return NextResponse.json(
        {
          error: 'OCR analysis failed',
          message: ocrResult.error || 'Could not extract text from document',
        },
        { status: 500 }
      );
    }

    const docData = ocrResult.data as Record<string, unknown> | null | undefined;
  type StandardizedDocument = {
    type: string;
    [key: string]: string | number | boolean | null | undefined;
  };
  type StandardizedDocumentValue = string | number | boolean | null | undefined;

  const toStandardizedValue = (value: unknown): StandardizedDocumentValue => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }
    return String(value);
  };

  const toNumber = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const normalized = value.replace(',', '.').replace(/[^0-9.-]/g, '');
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  const normalizeIdentityType = (type: unknown) => {
    const safeType = toStandardizedValue(type);

    if (!safeType || typeof safeType !== 'string') {
      return 'Unknown';
    }
    const upper = safeType.toUpperCase();
    if (upper === 'PASAPORTE' || upper === 'PASSPORT') {
      return 'PASSPORT';
    }
    return safeType;
  };

    if (!docData) {
      return NextResponse.json(
        {
          error: 'OCR parsing failed',
          message: 'Could not parse document data from AI response',
          rawText: ocrResult.text
        },
        { status: 422 }
      );
    }

    // Return results based on document type
    let standardizedDocument: StandardizedDocument | undefined;

    if (documentType === 'PAYSLIP') {
      standardizedDocument = {
        type: 'PAYSLIP',
        employerName: toStandardizedValue(docData.employerName),
        employeeName: toStandardizedValue(docData.employeeName),
        netIncome: toNumber(docData.netIncome),
        grossIncome: toNumber(docData.grossIncome),
        period: toStandardizedValue(docData.period),
        seniorityDate: toStandardizedValue(docData.seniorityDate),
      };
    } else if (documentType === 'CONTRACT') {
      standardizedDocument = {
        type: 'CONTRACT',
        landlordName: toStandardizedValue(docData.landlordName),
        tenantName: toStandardizedValue(docData.tenantName),
        propertyAddress: toStandardizedValue(docData.propertyAddress),
        monthlyRent: toNumber(docData.monthlyRent),
        startDate: toStandardizedValue(docData.startDate),
        duration: toStandardizedValue(docData.duration),
      };
    } else {
      // IDENTITY
      standardizedDocument = {
        type: normalizeIdentityType(docData.type),
        documentNumber: toStandardizedValue(docData.documentNumber) || '',
        name: toStandardizedValue(docData.name) || '',
        surname: toStandardizedValue(docData.surname) || '',
        fullName:
          toStandardizedValue(docData.fullName)
          || `${toStandardizedValue(docData.name) || ''} ${toStandardizedValue(docData.surname) || ''}`.trim(),
        birthDate: toStandardizedValue(docData.birthDate),
        expiryDate: toStandardizedValue(docData.expiryDate),
        nationality: toStandardizedValue(docData.nationality),
        sex: toStandardizedValue(docData.sex),
      };
    }

    if (!standardizedDocument) {
      return NextResponse.json(
        {
          error: 'Document standardization failed',
          message: `Unsupported document type: ${documentType}`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      document: standardizedDocument,
      validation: {
        valid: true,
        errors: [],
        warnings: [],
      },
      metadata: {
        confidence: 0.9,
        fileName: file.name,
        fileSize: file.size,
        model: useLocalOCR ? 'lmstudio/local' : 'openrouter/vision',
        documentType: documentType
      },
      // Include raw text for debugging (only in development)
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          rawText: ocrResult.text,
        },
      }),
    });

  } catch (error: unknown) {
    console.error('OCR API Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
