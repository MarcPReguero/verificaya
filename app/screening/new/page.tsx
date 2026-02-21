'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import DocumentUpload from '@/components/forms/DocumentUpload';
import { uploadScreeningDocument, type ScreeningDocumentType } from '@/components/forms/FileUpload';

type EmploymentStatus = 'employed' | 'self-employed' | 'student' | 'unemployed';
type ReferenceType = 'employer' | 'previous_landlord' | 'personal';
type ContractType = '' | 'indefinido' | 'temporal' | 'autonomo' | 'other';

// Mark this route as dynamic to prevent static generation errors
export const dynamic = 'force-dynamic';

function NewScreeningContent() {
  const [step, setStep] = useState(1);
  type PendingDocumentFiles = {
    identity?: File;
    payslip?: File;
    contract?: File;
  };
  type PendingOcrContext = {
    identity?: {
      type?: 'DNI' | 'NIE' | 'PASSPORT' | 'Unknown' | 'PASAPORTE';
      documentNumber?: string;
      fullName?: string;
      name?: string;
      surname?: string;
    };
    payslip?: {
      netIncome?: number;
      grossIncome?: number;
      employerName?: string;
      employeeName?: string;
    };
    contract?: {
      landlordName?: string;
      tenantName?: string;
      propertyAddress?: string;
      monthlyRent?: number;
      startDate?: string;
      duration?: string;
    };
  };

  const [pendingDocuments, setPendingDocuments] = useState<PendingDocumentFiles>({});
  const [ocrContext, setOcrContext] = useState<PendingOcrContext>({});
  const [formData, setFormData] = useState({
    // Tenant info
    tenantName: '',
    tenantEmail: '',
    tenantPhone: '',
    documentType: 'DNI',
    documentNumber: '',

    // Employment
    monthlyIncome: '',
    employmentStatus: 'employed' as EmploymentStatus,
    employmentYears: '',
    contractType: '' as '' | 'indefinido' | 'temporal' | 'autonomo' | 'other',
    employerName: '',

    // References
    references: [] as Array<{
      type: 'employer' | 'previous_landlord' | 'personal';
      name: string;
      phone: string;
      email?: string;
      relationship: string;
    }>,

    // Rental history
    previousAddress: '',
    previousLandlordName: '',
    previousLandlordPhone: '',

    // Property
    propertyAddress: '',
    monthlyRent: '',

    // Landlord
    landlordName: '',
    landlordEmail: '',
    landlordPhone: '',

    // Package
    packageType: 'complete' as 'basic' | 'complete',
    billingMode: 'payperuse' as 'payperuse' | 'subscription',
    subscriptionPlan: 'professional' as 'starter' | 'professional' | 'enterprise',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [useLocalOCR, setUseLocalOCR] = useState(false);

  const normalizeDocumentType = (documentType: string) => {
    const upper = documentType.trim().toUpperCase();
    if (upper === 'PASAPORTE' || upper === 'PASSPORT') {
      return 'PASSPORT';
    }
    if (upper === 'DNI' || upper === 'NIE') {
      return upper;
    }
    return documentType;
  };

  const toDbDocumentType = (sourceType: 'IDENTITY' | 'PAYSLIP' | 'CONTRACT'): ScreeningDocumentType => {
    if (sourceType === 'IDENTITY') return 'id-document';
    if (sourceType === 'PAYSLIP') return 'payslip';
    return 'employment-contract';
  };

  const uploadPendingDocuments = async (screeningId: string) => {
    const documentEntries: Array<{
      file: File | undefined;
      sourceType: 'IDENTITY' | 'PAYSLIP' | 'CONTRACT';
      label: string;
    }> = [
      { file: pendingDocuments.identity, sourceType: 'IDENTITY', label: 'Documento de identidad' },
      { file: pendingDocuments.payslip, sourceType: 'PAYSLIP', label: 'Nómina' },
      { file: pendingDocuments.contract, sourceType: 'CONTRACT', label: 'Contrato' },
    ];

    const uploadErrors: string[] = [];

    for (const { file, sourceType, label } of documentEntries) {
      if (!file) continue;

      try {
        await uploadScreeningDocument({
          screeningId,
          documentType: toDbDocumentType(sourceType),
          file,
        });
      } catch (uploadError) {
        uploadErrors.push(
          `${label}: ${(uploadError as Error).message || 'No se pudo subir el archivo'}`
        );
      }
    }

    return uploadErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const preparedOcrContext = {
        identity: ocrContext.identity,
        payslip: ocrContext.payslip,
        contract: ocrContext.contract,
      };
      // 1. Create screening
      const response = await fetch('/api/screenings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          monthlyIncome: parseFloat(formData.monthlyIncome),
          monthlyRent: parseFloat(formData.monthlyRent),
          employmentYears: formData.employmentYears ? parseFloat(formData.employmentYears) : undefined,
          // Mark all references as unverified initially
          references: formData.references.map(ref => ({
            ...ref,
            verified: false
          })),
          ocrContext: preparedOcrContext,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear verificación');
      }

      // 2. Upload documents with selected files (best effort)
      const uploadWarnings = await uploadPendingDocuments(data.screeningId);
      if (uploadWarnings.length > 0) {
        setError((prev) =>
          prev
            ? `${prev} ${uploadWarnings.join(' | ')}`
            : `Advertencia: no se pudieron subir algunos documentos (${uploadWarnings.join(' | ')})`
        );
      }

      // 3. Create Stripe checkout session
      const checkoutResponse = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screeningId: data.screeningId,
          packageType: formData.packageType,
          billingMode: formData.billingMode,
          subscriptionPlan: formData.subscriptionPlan,
          landlordEmail: formData.landlordEmail,
        }),
      });

      const checkoutData = await checkoutResponse.json();

      if (!checkoutResponse.ok) {
        throw new Error(checkoutData.error || 'Error al crear sesión de pago');
      }

      // 3. Redirect to Stripe Checkout
      if (checkoutData.url) {
        window.location.href = checkoutData.url;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear verificación');
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Volver
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Nueva Verificación de Inquilino</h1>
          <p className="text-gray-600 mt-2">Completa el formulario para iniciar el proceso</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                {s}
              </div>
              {s < 6 && <div className={`w-8 md:w-16 h-1 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-red-600 font-semibold">⚠</span>
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Step 1: Document Hub (NEW) */}
          {step === 1 && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Sube tus Documentos</h2>
                <p className="text-gray-600">
                  Para agilizar el proceso, sube tus documentos ahora y autocompletaremos el formulario por ti.
                </p>

                {/* OCR Provider Toggle */}
                <div className="mt-4 flex items-center justify-center gap-2">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useLocalOCR}
                      onChange={(e) => setUseLocalOCR(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span>Usar OCR local (LM Studio)</span>
                  </label>
                </div>
              </div>

              {/* 1. Identity Document (Required-ish) */}
              <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-100">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">🆔</span>
                  <h3 className="text-lg font-bold text-gray-900">Documento de Identidad</h3>
                </div>
                <DocumentUpload
                  documentType="IDENTITY"
                  useLocalOCR={useLocalOCR}
                  onFileSelected={(file) => setPendingDocuments((prev) => ({
                    ...prev,
                    identity: file,
                  }))}
                  onDataExtracted={(data) => {
                    const identityType = data.type === 'PASSPORT' || data.type === 'Pasaporte'
                      ? 'PASSPORT'
                      : data.type === 'DNI' || data.type === 'NIE'
                        ? data.type
                        : undefined;

                    setFormData(prev => ({
                      ...prev,
                      documentType: data.type === 'Unknown' ? 'DNI' : normalizeDocumentType(data.type),
                      documentNumber: data.documentNumber || prev.documentNumber,
                      tenantName: data.fullName || data.name || prev.tenantName,
                    }));
                    setOcrContext((prev) => ({
                      ...prev,
                      identity: {
                        type: identityType || prev.identity?.type,
                        documentNumber: data.documentNumber || prev.identity?.documentNumber,
                        fullName: data.fullName || prev.identity?.fullName,
                        name: data.name || prev.identity?.name,
                        surname: data.surname || prev.identity?.surname,
                      },
                    }));
                    setError('');
                  }}
                  onError={setError}
                />
              </div>

              {/* 2. Payslip (Optional) */}
              <div className="bg-green-50 rounded-xl p-6 border-2 border-green-100">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">📄</span>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Última Nómina</h3>
                    <p className="text-xs text-gray-500">Opcional, pero recomendado</p>
                  </div>
                </div>
                <DocumentUpload
                  documentType="PAYSLIP"
                  useLocalOCR={useLocalOCR}
                  onFileSelected={(file) => setPendingDocuments((prev) => ({
                    ...prev,
                    payslip: file,
                  }))}
                  onDataExtracted={(data) => {
                    setFormData(prev => ({
                      ...prev,
                      monthlyIncome: data.netIncome ? data.netIncome.toString() : prev.monthlyIncome,
                      employerName: data.employerName || prev.employerName,
                      employmentStatus: 'employed',
                    }));
                    setOcrContext((prev) => ({
                      ...prev,
                      payslip: {
                        netIncome: data.netIncome,
                        grossIncome: data.grossIncome,
                        employerName: data.employerName || prev.payslip?.employerName,
                        employeeName: data.employeeName || prev.payslip?.employeeName,
                      },
                    }));
                    setError('');
                  }}
                  onError={setError}
                />
              </div>

              {/* 3. Contract (Optional) */}
              <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-100">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">🏠</span>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Contrato de Alquiler Anterior</h3>
                    <p className="text-xs text-gray-500">Opcional, para referencias</p>
                  </div>
                </div>
                <DocumentUpload
                  documentType="CONTRACT"
                  useLocalOCR={useLocalOCR}
                  onFileSelected={(file) => setPendingDocuments((prev) => ({
                    ...prev,
                    contract: file,
                  }))}
                  onDataExtracted={(data) => {
                    setFormData(prev => ({
                      ...prev,
                      previousAddress: data.propertyAddress || prev.previousAddress,
                      previousLandlordName: data.landlordName || prev.previousLandlordName,
                    }));
                    setOcrContext((prev) => ({
                      ...prev,
                      contract: {
                        landlordName: data.landlordName || prev.contract?.landlordName,
                        tenantName: data.tenantName || prev.contract?.tenantName,
                        propertyAddress: data.propertyAddress || prev.contract?.propertyAddress,
                        monthlyRent: data.monthlyRent,
                        startDate: data.startDate || prev.contract?.startDate,
                        duration: data.duration || prev.contract?.duration,
                      },
                    }));
                    setError('');
                  }}
                  onError={setError}
                />
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-bold text-lg shadow-lg shadow-blue-200"
              >
                Continuar al Formulario →
              </button>
            </div>
          )}

          {/* Step 2: Tenant Info (Previously Step 1) */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Datos Personales</h2>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.tenantName}
                  onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder-gray-400"
                  placeholder="Juan García López"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.tenantEmail}
                    onChange={(e) => setFormData({ ...formData, tenantEmail: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder-gray-400"
                    placeholder="juan@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.tenantPhone}
                    onChange={(e) => setFormData({ ...formData, tenantPhone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder-gray-400"
                    placeholder="+34 600 000 000"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Tipo de Documento *
                  </label>
                  <select
                    required
                    value={formData.documentType}
                    onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 bg-white"
                  >
                    <option value="DNI">DNI</option>
                    <option value="NIE">NIE</option>
                    <option value="PASSPORT">PASSPORT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Número de Documento *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.documentNumber}
                    onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder-gray-400"
                    placeholder={
                      formData.documentType === 'DNI' ? '12345678A' :
                        formData.documentType === 'NIE' ? 'X1234567A' :
                          'ABC123456'
                    }
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Employment (Previously Step 2) */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Situación Laboral</h2>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Estado Laboral *
                </label>
                <select
                  required
                  value={formData.employmentStatus}
                  onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value as EmploymentStatus })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 bg-white"
                >
                  <option value="employed">Empleado por cuenta ajena</option>
                  <option value="self-employed">Autónomo</option>
                  <option value="student">Estudiante</option>
                  <option value="unemployed">Desempleado</option>
                </select>
              </div>

              {(formData.employmentStatus === 'employed' || formData.employmentStatus === 'self-employed') && (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Años en el empleo actual *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        max="50"
                        step="0.5"
                        value={formData.employmentYears}
                        onChange={(e) => setFormData({ ...formData, employmentYears: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder-gray-400"
                        placeholder="2.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Tipo de contrato *
                      </label>
                      <select
                        required
                        value={formData.contractType}
                        onChange={(e) => setFormData({ ...formData, contractType: e.target.value as ContractType })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 bg-white"
                      >
                        <option value="">Selecciona...</option>
                        <option value="indefinido">Indefinido</option>
                        <option value="temporal">Temporal</option>
                        <option value="autonomo">Autónomo</option>
                        <option value="other">Otro</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Nombre del empleador (opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.employerName}
                      onChange={(e) => setFormData({ ...formData, employerName: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder-gray-400"
                      placeholder="Empresa XYZ S.L."
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Ingresos Mensuales Netos (€) *
                </label>
                <input
                  type="number"
                  required
                  value={formData.monthlyIncome}
                  onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder-gray-400"
                  placeholder="2000"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}

          {/* Step 4: References & History (Previously Step 3) */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Referencias e Historial</h2>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Historial de Alquiler</h3>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Dirección anterior (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.previousAddress}
                    onChange={(e) => setFormData({ ...formData, previousAddress: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder-gray-400"
                    placeholder="Calle Example, 45, Barcelona"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Nombre del anterior casero (opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.previousLandlordName}
                      onChange={(e) => setFormData({ ...formData, previousLandlordName: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder-gray-400"
                      placeholder="José Martínez"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Teléfono del casero (opcional)
                    </label>
                    <input
                      type="tel"
                      value={formData.previousLandlordPhone}
                      onChange={(e) => setFormData({ ...formData, previousLandlordPhone: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder-gray-400"
                      placeholder="+34 600 000 000"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 mt-8">
                <h3 className="text-lg font-semibold text-gray-900">Referencias</h3>
                {formData.references.map((ref, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 mb-3 border border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-semibold text-gray-900">Referencia {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newRefs = formData.references.filter((_, i) => i !== index);
                          setFormData({ ...formData, references: newRefs });
                        }}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Eliminar
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Tipo de referencia
                        </label>
                        <select
                          value={ref.type}
                          onChange={(e) => {
                            const newRefs = [...formData.references];
                            newRefs[index] = { ...ref, type: e.target.value as ReferenceType };
                            setFormData({ ...formData, references: newRefs });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                        >
                          <option value="employer">Empleador</option>
                          <option value="previous_landlord">Anterior casero</option>
                          <option value="personal">Personal</option>
                        </select>
                      </div>

                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Nombre completo
                          </label>
                          <input
                            type="text"
                            value={ref.name}
                            onChange={(e) => {
                              const newRefs = [...formData.references];
                              newRefs[index] = { ...ref, name: e.target.value };
                              setFormData({ ...formData, references: newRefs });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                            placeholder="Nombre"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Teléfono
                          </label>
                          <input
                            type="tel"
                            value={ref.phone}
                            onChange={(e) => {
                              const newRefs = [...formData.references];
                              newRefs[index] = { ...ref, phone: e.target.value };
                              setFormData({ ...formData, references: newRefs });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                            placeholder="+34 600 000 000"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      references: [...formData.references, {
                        type: 'employer',
                        name: '',
                        phone: '',
                        email: '',
                        relationship: ''
                      }]
                    });
                  }}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition font-semibold"
                >
                  + Añadir Referencia
                </button>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Property (Previously Step 4) */}
          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Datos de la Propiedad</h2>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Dirección del Inmueble *
                </label>
                <input
                  type="text"
                  required
                  value={formData.propertyAddress}
                  onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder-gray-400"
                  placeholder="Calle Gran Vía, 123, Barcelona"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Renta Mensual (€) *
                </label>
                <input
                  type="number"
                  required
                  value={formData.monthlyRent}
                  onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder-gray-400"
                  placeholder="900"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setStep(6)}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}

          {/* Step 6: Landlord & Package (Previously Step 5) */}
          {step === 6 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Tus Datos y Paquete</h2>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Tu Nombre (Propietario) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.landlordName}
                  onChange={(e) => setFormData({ ...formData, landlordName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder-gray-400"
                  placeholder="María Pérez"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Tu Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.landlordEmail}
                    onChange={(e) => setFormData({ ...formData, landlordEmail: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder-gray-400"
                    placeholder="maria@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Tu Teléfono *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.landlordPhone}
                    onChange={(e) => setFormData({ ...formData, landlordPhone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder-gray-400"
                    placeholder="+34 600 000 000"
                  />
                </div>
              </div>

              {/* Billing Mode Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Modo de Pago *
                </label>
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div
                    onClick={() => setFormData({ ...formData, billingMode: 'payperuse' })}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition ${formData.billingMode === 'payperuse'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-900">Pago Único</span>
                      {formData.billingMode === 'payperuse' && <span className="text-blue-600">✓</span>}
                    </div>
                    <p className="text-sm text-gray-600">Paga solo por esta verificación.</p>
                  </div>

                  <div
                    onClick={() => setFormData({ ...formData, billingMode: 'subscription' })}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition ${formData.billingMode === 'subscription'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-900">Suscripción</span>
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Ahorra 20%</span>
                    </div>
                    <p className="text-sm text-gray-600">Ideal si verificas inquilinos frecuentemente.</p>
                  </div>
                </div>
              </div>

              {formData.billingMode === 'subscription' && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Plan de suscripción *
                  </label>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div
                      onClick={() => setFormData({ ...formData, subscriptionPlan: 'starter' })}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition ${formData.subscriptionPlan === 'starter'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-900">Starter</span>
                        {formData.subscriptionPlan === 'starter' && <span className="text-blue-600">✓</span>}
                      </div>
                      <p className="text-xs text-gray-600">3 verificaciones/mes</p>
                    </div>

                    <div
                      onClick={() => setFormData({ ...formData, subscriptionPlan: 'professional' })}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition ${formData.subscriptionPlan === 'professional'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-900">Professional</span>
                        {formData.subscriptionPlan === 'professional' && <span className="text-blue-600">✓</span>}
                      </div>
                      <p className="text-xs text-gray-600">10 verificaciones/mes</p>
                    </div>

                    <div
                      onClick={() => setFormData({ ...formData, subscriptionPlan: 'enterprise' })}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition ${formData.subscriptionPlan === 'enterprise'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-900">Enterprise</span>
                        {formData.subscriptionPlan === 'enterprise' && <span className="text-blue-600">✓</span>}
                      </div>
                      <p className="text-xs text-gray-600">30 verificaciones/mes</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold"
                >
                  Anterior
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold ${submitting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                  {submitting ? (
                    <>
                      <span className="animate-spin inline-block mr-2">⟳</span>
                      Procesando...
                    </>
                  ) : (
                    formData.billingMode === 'subscription' ? 'Suscribirme y Pagar' : 'Iniciar Verificación y Pagar'
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div >
    </main >
  );
}

export default function NewScreening() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando formulario...</p>
        </div>
      </div>
    }>
      <NewScreeningContent />
    </Suspense>
  );
}
