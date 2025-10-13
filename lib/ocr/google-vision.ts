/**
 * Google Cloud Vision API Client
 * Extracts text and data from identity documents
 */

import vision, { ImageAnnotatorClient, protos } from '@google-cloud/vision';

// Initialize Google Cloud Vision client
let visionClient: ImageAnnotatorClient | null = null;

/**
 * Get or create Vision API client
 */
function getVisionClient(): ImageAnnotatorClient {
  if (visionClient) {
    return visionClient;
  }

  // Check if credentials are configured
  if (!process.env.GOOGLE_CLOUD_PROJECT_ID || 
      !process.env.GOOGLE_CLOUD_PRIVATE_KEY || 
      !process.env.GOOGLE_CLOUD_CLIENT_EMAIL) {
    throw new Error('Google Cloud credentials not configured. Please set GOOGLE_CLOUD_* environment variables.');
  }

  // Create client with credentials from environment variables
  visionClient = new vision.ImageAnnotatorClient({
    credentials: {
      client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  });

  return visionClient;
}

/**
 * OCR Result interface
 */
export interface OCRResult {
  success: boolean;
  text: string;
  confidence: number;
  blocks: TextBlock[];
  faces?: FaceInfo[];
  labels?: string[];
  error?: string;
}

export interface TextBlock {
  text: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface FaceInfo {
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Analyze document image with OCR
 * @param imageBuffer - Image file buffer
 * @param options - Analysis options
 */
export async function analyzeDocument(
  imageBuffer: Buffer,
  options: {
    detectFaces?: boolean;
    detectLabels?: boolean;
  } = {}
): Promise<OCRResult> {
  try {
    const client = getVisionClient();

    // Prepare features to detect
    const features: protos.google.cloud.vision.v1.IFeature[] = [
      { type: 'DOCUMENT_TEXT_DETECTION' }, // Enhanced OCR for documents
    ];

    if (options.detectFaces) {
      features.push({ type: 'FACE_DETECTION' });
    }

    if (options.detectLabels) {
      features.push({ type: 'LABEL_DETECTION' });
    }

    // Call Vision API
    const [result] = await client.annotateImage({
      image: { content: imageBuffer },
      features,
    });

    // Extract text
    const fullTextAnnotation = result.fullTextAnnotation;
    const text = fullTextAnnotation?.text || '';
    
    // Calculate average confidence
    const pages = fullTextAnnotation?.pages || [];
    let totalConfidence = 0;
    let blockCount = 0;

    const blocks: TextBlock[] = [];

    for (const page of pages) {
      for (const block of page.blocks || []) {
        if (block.confidence) {
          totalConfidence += block.confidence;
          blockCount++;
        }

        // Extract text from block
        const blockText = block.paragraphs
          ?.flatMap((p: any) => p.words?.map((w: any) => 
            w.symbols?.map((s: any) => s.text).join('') || ''
          ) || [])
          .join(' ') || '';

        // Get bounding box
        const vertices = block.boundingBox?.vertices || [];
        if (vertices.length >= 2) {
          blocks.push({
            text: blockText,
            confidence: block.confidence || 0,
            boundingBox: {
              x: vertices[0]?.x || 0,
              y: vertices[0]?.y || 0,
              width: (vertices[1]?.x || 0) - (vertices[0]?.x || 0),
              height: (vertices[2]?.y || 0) - (vertices[0]?.y || 0),
            },
          });
        }
      }
    }

    const confidence = blockCount > 0 ? totalConfidence / blockCount : 0;

    // Extract faces if requested
    let faces: FaceInfo[] | undefined;
    if (options.detectFaces && result.faceAnnotations) {
      faces = result.faceAnnotations.map((face: any) => ({
        confidence: face.detectionConfidence || 0,
        boundingBox: {
          x: face.boundingPoly?.vertices?.[0]?.x || 0,
          y: face.boundingPoly?.vertices?.[0]?.y || 0,
          width: (face.boundingPoly?.vertices?.[1]?.x || 0) - (face.boundingPoly?.vertices?.[0]?.x || 0),
          height: (face.boundingPoly?.vertices?.[2]?.y || 0) - (face.boundingPoly?.vertices?.[0]?.y || 0),
        },
      }));
    }

    // Extract labels if requested
    let labels: string[] | undefined;
    if (options.detectLabels && result.labelAnnotations) {
      labels = result.labelAnnotations
        .filter((label: any) => (label.score || 0) > 0.7)
        .map((label: any) => label.description || '')
        .filter(Boolean);
    }

    return {
      success: true,
      text,
      confidence,
      blocks,
      faces,
      labels,
    };
  } catch (error: any) {
    console.error('OCR Error:', error);
    return {
      success: false,
      text: '',
      confidence: 0,
      blocks: [],
      error: error.message || 'OCR analysis failed',
    };
  }
}

/**
 * Check if Google Cloud Vision is configured
 */
export function isVisionConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLOUD_PROJECT_ID &&
    process.env.GOOGLE_CLOUD_PRIVATE_KEY &&
    process.env.GOOGLE_CLOUD_CLIENT_EMAIL
  );
}
