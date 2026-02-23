'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface FileUploadProps {
  screeningId: string;
  documentType: 'payslip' | 'employment-contract' | 'id-document' | 'bank-statement' | 'reference';
  label: string;
  onUploadComplete?: (url: string) => void;
}

export type ScreeningDocumentType = 'payslip' | 'employment-contract' | 'id-document' | 'bank-statement' | 'reference';

export async function uploadScreeningDocument(params: {
  screeningId: string;
  documentType: ScreeningDocumentType;
  file: File;
}): Promise<string> {
  const { screeningId, documentType, file } = params;
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user?.id) {
    throw new Error('Debes iniciar sesion para subir documentos');
  }

  const ownerId = authData.user.id;

  const fileExt = file.name.split('.').pop() || 'bin';
  const objectPath = `${ownerId}/${screeningId}/${documentType}-${Date.now()}.${fileExt}`;

  const { data: uploadedData, error: uploadError } = await supabase.storage
    .from('documents')
    .upload(objectPath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  if (!uploadedData?.path) {
    throw new Error('Upload response did not include path');
  }

  const { error: dbError } = await supabase
    .from('screening_documents')
    .insert({
      screening_id: screeningId,
      document_type: documentType,
      file_url: objectPath,
    });

  if (dbError) {
    throw dbError;
  }

  return objectPath;
}

export default function FileUpload({ 
  screeningId, 
  documentType, 
  label,
  onUploadComplete 
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  try {
      setUploading(true);
      setError('');

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Debes seleccionar un archivo');
      }

      const file = event.target.files[0];
      const uploadUrl = await uploadScreeningDocument({
        screeningId,
        documentType,
        file,
      });

      setFileName(file.name);
      onUploadComplete?.(uploadUrl);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'No se pudo subir el archivo');
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      <div className="relative">
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleUpload}
          disabled={uploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
            disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 rounded-full border-t-transparent"></div>
          <span>Subiendo archivo...</span>
        </div>
      )}

      {fileName && !uploading && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <span>✓</span>
          <span>{fileName} subido correctamente</span>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600">
          ⚠ {error}
        </div>
      )}

      <p className="text-xs text-gray-500">
        Formatos aceptados: PDF, JPG, PNG (máx. 10MB)
      </p>
    </div>
  );
}
