'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface FileUploadProps {
  screeningId: string;
  documentType: 'payslip' | 'employment-contract' | 'id-document' | 'bank-statement' | 'reference';
  label: string;
  onUploadComplete?: (url: string) => void;
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
      const fileExt = file.name.split('.').pop();
      const fileName = `${screeningId}/${documentType}-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      // Save document record to database
      const { error: dbError } = await supabase
        .from('screening_documents')
        .insert({
          screening_id: screeningId,
          document_type: documentType,
          file_url: urlData.publicUrl,
        });

      if (dbError) {
        throw dbError;
      }

      setFileName(file.name);
      onUploadComplete?.(urlData.publicUrl);
    } catch (error: any) {
      setError(error.message);
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
