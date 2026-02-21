/**
 * Document Upload Component with OCR
 * Uploads identity document and auto-fills form with extracted data
 */

'use client';

import { useState, useRef } from 'react';

interface ParsedDocument {
  type: 'DNI' | 'NIE' | 'Pasaporte' | 'PASSPORT' | 'Unknown' | 'PAYSLIP' | 'CONTRACT';
  documentNumber?: string;
  name?: string;
  surname?: string;
  fullName?: string;
  birthDate?: string;
  expiryDate?: string;
  nationality?: string;
  sex?: string;
  // Payslip fields
  netIncome?: number;
  grossIncome?: number;
  employerName?: string;
  employeeName?: string;
  period?: string;
  seniorityDate?: string;
  // Contract fields
  landlordName?: string;
  tenantName?: string;
  propertyAddress?: string;
  monthlyRent?: number;
  startDate?: string;
  duration?: string;
}

interface OcrMetadata {
  confidence?: number;
  fileName?: string;
  fileSize?: number;
  model?: string;
  documentType?: string;
}

interface OcrValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface OcrAnalyzeResponse {
  success: boolean;
  document: ParsedDocument;
  validation?: OcrValidation;
  metadata?: OcrMetadata;
  demoMode?: boolean;
  error?: string;
  message?: string;
}

interface DocumentUploadProps {
  onDataExtracted: (data: ParsedDocument) => void;
  onError?: (error: string) => void;
  documentType?: 'IDENTITY' | 'PAYSLIP' | 'CONTRACT';
  useLocalOCR?: boolean;
  onFileSelected?: (file: File) => void;
}

export default function DocumentUpload({
  onDataExtracted,
  onError,
  documentType = 'IDENTITY',
  useLocalOCR = false,
  onFileSelected
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState('');
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<string>('');
  const [progress, setProgress] = useState<string>('');
  const [result, setResult] = useState<OcrAnalyzeResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputId = `document-upload-${documentType.toLowerCase()}`;

  const normalizeDocumentType = (type: ParsedDocument['type']): ParsedDocument['type'] => {
    if (type === 'Pasaporte' || type.toUpperCase() === 'PASAPORTE' || type === 'PASSPORT') {
      return 'PASSPORT';
    }
    return type;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      onError?.('Tipo de archivo inválido. Sube JPG, PNG, WEBP o PDF (máximo 10MB).');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      onError?.('Archivo muy grande. El tamaño máximo es 10MB');
      return;
    }

    setFileName(file.name);
    setFileType(file.type);
    onFileSelected?.(file);

    if (file.type === 'application/pdf') {
      setPreview('');
    } else {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }

    // Upload and analyze
    await analyzeDocument(file);
  };

  const analyzeDocument = async (file: File) => {
    try {
      setUploading(true);
      setProgress('Subiendo documento...');

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      formData.append('useLocalOCR', useLocalOCR.toString());

      // Call OCR API
      setProgress('Analizando documento con OCR...');
      const response = await fetch('/api/ocr/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = (await response.json()) as OcrAnalyzeResponse;

      if (!response.ok) {
        if (data.demoMode) {
          // OCR not configured - show demo message
          onError?.(
            '⚠️ OCR no configurado (modo demo). Por favor ingresa los datos manualmente. ' +
            'Para habilitar OCR automático, configura las credenciales de Google Cloud Vision.'
          );
        } else {
          throw new Error(data.error || 'Error al analizar documento');
        }
        return;
      }

      setProgress('Datos extraídos correctamente ✅');
      const normalizedDocument = {
        ...data.document,
        type: normalizeDocumentType(data.document.type),
      };
      const normalizedResult = {
        ...data,
        document: normalizedDocument,
      };

      setResult(normalizedResult);

      // Notify parent with extracted data
      if (data.success) {
        onDataExtracted(normalizedDocument);
      }

      // Show validation errors/warnings
      if (data.validation) {
        if (data.validation.errors.length > 0) {
          onError?.(
            '⚠️ Errores de validación:\n' + data.validation.errors.join('\n')
          );
        } else if (data.validation.warnings.length > 0) {
          console.warn('Advertencias:', data.validation.warnings);
        }
      }

    } catch (error: unknown) {
      console.error('OCR Error:', error);
      onError?.(error instanceof Error ? error.message : 'Error al procesar el documento');
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setPreview('');
    setFileName('');
    setFileType('');
    setProgress('');
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
          id={inputId}
        />
        <label
          htmlFor={inputId}
          className={`cursor-pointer flex flex-col items-center ${uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
        >
          {!preview && fileType !== 'application/pdf' ? (
            <>
              <svg
                className="w-12 h-12 text-gray-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-semibold text-blue-600">
                  Haz clic para subir
                </span>
                {' '}o arrastra tu documento aquí
              </p>
              <p className="text-xs text-gray-500">
                DNI, NIE o Pasaporte (JPG, PNG, WEBP, PDF - máx. 10MB)
              </p>
            </>
          ) : fileType === 'application/pdf' ? (
            <>
              <span className="text-5xl mb-2">ðŸ“„</span>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-semibold text-blue-600">PDF listo para procesar</span>
              </p>
              <p className="text-xs text-gray-500">
                El documento PDF se enviarÃ¡ a OCR para anÃ¡lisis
              </p>
            </>
          ) : (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="max-h-48 rounded-lg shadow-lg"
              />
              {!uploading && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleClear();
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  title="Eliminar"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
        </label>
      </div>

      {/* File Name */}
      {fileName && (
        <p className="text-sm text-gray-600 text-center">
          📄 {fileName}
        </p>
      )}

      {/* Progress */}
      {uploading && (
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600">{progress}</p>
        </div>
      )}

      {/* Results */}
      {result && result.success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-green-600 mt-0.5 mr-2 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-green-800 mb-1">
                ✅ Documento analizado correctamente
              </h4>
              <div className="text-sm text-green-700 space-y-1">
                <p>• Tipo: <strong>{result.document.type}</strong></p>
                <p>• Número: <strong>{result.document.documentNumber}</strong></p>
                {result.document.fullName && (
                  <p>• Nombre: <strong>{result.document.fullName}</strong></p>
                )}
                {result.metadata?.confidence && (
                  <p>
                    • Confianza:{' '}
                    <strong>{(result.metadata.confidence * 100).toFixed(0)}%</strong>
                  </p>
                )}
              </div>
              <p className="text-xs text-green-600 mt-2">
                Los campos del formulario se han completado automáticamente
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">
          💡 Consejos para mejor resultado:
        </h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>✓ Foto clara y enfocada del documento</li>
          <li>✓ Buena iluminación, sin sombras</li>
          <li>✓ Documento completo y plano</li>
          <li>✓ Evitar reflejos o brillos</li>
          <li>✓ Foto frontal (no en ángulo)</li>
        </ul>
      </div>
    </div>
  );
}
