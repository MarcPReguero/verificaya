/**
 * OCR Analysis API Endpoint
 * POST /api/ocr/analyze
 * Analyzes uploaded identity document and extracts data
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeDocument, isVisionConfigured } from '@/lib/ocr/google-vision';
import { parseDocument, validateDocument } from '@/lib/ocr/document-parser';

export async function POST(request: NextRequest) {
  try {
    // Check if Google Vision is configured
    if (!isVisionConfigured()) {
      return NextResponse.json(
        { 
          error: 'OCR service not configured',
          message: 'Google Cloud Vision API credentials are missing. Please configure GOOGLE_CLOUD_* environment variables.',
          demoMode: true,
        },
        { status: 503 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image (JPG, PNG, WEBP)' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Analyze document with OCR
    console.log(`Analyzing document: ${file.name} (${file.size} bytes)`);
    const ocrResult = await analyzeDocument(buffer, {
      detectFaces: true,
      detectLabels: true,
    });

    if (!ocrResult.success) {
      return NextResponse.json(
        { 
          error: 'OCR analysis failed',
          message: ocrResult.error || 'Could not extract text from document',
        },
        { status: 500 }
      );
    }

    // Parse document data
    const parsedDocument = parseDocument(ocrResult);

    // Validate document
    const validation = validateDocument(parsedDocument);

    // Return results
    return NextResponse.json({
      success: true,
      document: {
        type: parsedDocument.type,
        documentNumber: parsedDocument.documentNumber,
        name: parsedDocument.name,
        surname: parsedDocument.surname,
        fullName: parsedDocument.fullName,
        birthDate: parsedDocument.birthDate,
        expiryDate: parsedDocument.expiryDate,
        nationality: parsedDocument.nationality,
        sex: parsedDocument.sex,
      },
      validation: {
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings,
      },
      metadata: {
        confidence: parsedDocument.confidence,
        hasFace: (ocrResult.faces?.length || 0) > 0,
        labels: ocrResult.labels,
        fileName: file.name,
        fileSize: file.size,
      },
      // Include raw text for debugging (only in development)
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          rawText: parsedDocument.rawText,
          blocks: ocrResult.blocks.length,
        },
      }),
    });

  } catch (error: any) {
    console.error('OCR API Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
