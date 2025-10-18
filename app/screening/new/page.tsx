'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import DocumentUpload from '@/components/forms/DocumentUpload';

// Mark this route as dynamic to prevent static generation errors
export const dynamic = 'force-dynamic';

function NewScreeningContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);
  const [isDemo, setIsDemo] = useState(false);
  const [formData, setFormData] = useState({
    // Tenant info
    tenantName: '',
    tenantEmail: '',
    tenantPhone: '',
    documentType: 'DNI',
    documentNumber: '',

    // Employment
    monthlyIncome: '',
    employmentStatus: 'employed' as const,
    employmentYears: '',       // NEW
    contractType: '' as '' | 'indefinido' | 'temporal' | 'autonomo' | 'other', // NEW
    employerName: '',          // NEW

    // References - NEW
    references: [] as Array<{
      type: 'employer' | 'previous_landlord' | 'personal';
      name: string;
      phone: string;
      email?: string;
      relationship: string;
    }>,

    // Rental history - NEW
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

  // Check if demo mode is enabled from URL
  useEffect(() => {
    const demoParam = searchParams.get('demo');
    if (demoParam === 'true') {
      setIsDemo(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Check if in demo mode or demo user
      const isDemoMode = isDemo || (isAuthenticated && user?.email === 'demo');

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
          isDemo: isDemoMode, // Flag to skip payment and mark as demo
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear verificación');
      }

      // 2. For demo mode, skip payment and go directly to success page
      if (isDemoMode) {
        // Simulate immediate processing for demo
        router.push(`/screening/${data.screeningId}/success?demo=true`);
        return;
      }

      // 3. For regular users, create Stripe checkout session
      const checkoutResponse = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screeningId: data.screeningId,
          packageType: formData.packageType,
          landlordEmail: formData.landlordEmail,
        }),
      });

      const checkoutData = await checkoutResponse.json();

      if (!checkoutResponse.ok) {
        throw new Error(checkoutData.error || 'Error al crear sesión de pago');
      }

      // 4. Redirect to Stripe Checkout
      if (checkoutData.url) {
        window.location.href = checkoutData.url;
      }
    } catch (err: any) {
      setError(err.message);
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

        {/* Demo User Banner */}
        {(isDemo || (isAuthenticated && user?.email === 'demo')) && (
          <div className="mb-6 p-5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg border-2 border-green-300">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <h3 className="font-bold text-lg mb-1">Modo Demo Activo - Prueba Gratuita</h3>
                <p className="text-green-50 text-sm">
                  Estás probando VerificaYa <strong>sin pagar</strong>. 
                  Completa el formulario y verás un informe de muestra con marca de agua "DEMO". 
                  El proceso se completará automáticamente para que explores todas las funcionalidades.
                </p>
                <p className="text-green-100 text-xs mt-2 font-semibold">
                  ℹ️ Los informes demo NO son válidos para uso legal. Para verificaciones reales, usa el modo estándar.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Legacy Demo User Banner (kept for backward compatibility) */}
        {isAuthenticated && user?.email === 'demo' && !isDemo && (
          <div className="mb-6 p-5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✨</span>
              <div>
                <h3 className="font-bold text-lg mb-1">Modo Demo Activo</h3>
                <p className="text-green-50 text-sm">
                  Como usuario demo, puedes crear verificaciones <strong>sin pagar</strong>. 
                  El proceso se completará automáticamente para que puedas explorar todas las funcionalidades.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {s}
              </div>
              {s < 5 && <div className={`w-16 h-1 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
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

          {/* Step 1: Tenant Info */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Datos del Inquilino</h2>
              
              {/* OCR Document Upload */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">✨</span>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      Auto-completa con tu documento
                    </h3>
                    <p className="text-sm text-gray-600">
                      Sube una foto de tu DNI, NIE o Pasaporte y llenaremos los campos automáticamente
                    </p>
                  </div>
                </div>
                
                <DocumentUpload
                  onDataExtracted={(data) => {
                    // Auto-complete form fields
                    setFormData({
                      ...formData,
                      documentType: data.type === 'Unknown' ? 'DNI' : data.type,
                      documentNumber: data.documentNumber || formData.documentNumber,
                      tenantName: data.fullName || data.name || formData.tenantName,
                    });
                    setError(''); // Clear any previous errors
                  }}
                  onError={(error) => {
                    setError(error);
                  }}
                />
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">
                    O ingresa los datos manualmente
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.tenantName}
                  onChange={(e) => setFormData({...formData, tenantName: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, tenantEmail: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, tenantPhone: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, documentType: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 bg-white"
                  >
                    <option value="DNI">DNI</option>
                    <option value="NIE">NIE</option>
                    <option value="Pasaporte">Pasaporte</option>
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
                    onChange={(e) => setFormData({...formData, documentNumber: e.target.value.toUpperCase()})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder-gray-400"
                    placeholder={
                      formData.documentType === 'DNI' ? '12345678A' :
                      formData.documentType === 'NIE' ? 'X1234567A' :
                      'ABC123456'
                    }
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.documentType === 'DNI' && 'Formato: 8 dígitos + letra'}
                    {formData.documentType === 'NIE' && 'Formato: X/Y/Z + 7 dígitos + letra'}
                    {formData.documentType === 'Pasaporte' && 'Formato: 3 letras + 6 dígitos'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                Siguiente
              </button>
            </div>
          )}

          {/* Step 2: Employment */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Situación Laboral</h2>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Estado Laboral *
                </label>
                <select
                  required
                  value={formData.employmentStatus}
                  onChange={(e) => setFormData({...formData, employmentStatus: e.target.value as any})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 bg-white"
                >
                  <option value="employed">Empleado por cuenta ajena</option>
                  <option value="self-employed">Autónomo</option>
                  <option value="student">Estudiante</option>
                  <option value="unemployed">Desempleado</option>
                </select>
              </div>

              {/* NEW: Employment Stability Fields */}
              {(formData.employmentStatus === 'employed' || formData.employmentStatus === 'self-employed') && (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Años en el empleo actual *
                        <span className="ml-2 text-xs text-blue-600 font-normal">
                          Mejora tu puntuación
                        </span>
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        max="50"
                        step="0.5"
                        value={formData.employmentYears}
                        onChange={(e) => setFormData({...formData, employmentYears: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder-gray-400"
                        placeholder="2.5"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Ejemplo: 2.5 para 2 años y medio
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Tipo de contrato *
                        <span className="ml-2 text-xs text-blue-600 font-normal">
                          +5 pts si indefinido
                        </span>
                      </label>
                      <select
                        required
                        value={formData.contractType}
                        onChange={(e) => setFormData({...formData, contractType: e.target.value as any})}
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
                      onChange={(e) => setFormData({...formData, employerName: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, monthlyIncome: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder-gray-400"
                  placeholder="2000"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Tus ingresos netos mensuales (después de impuestos)
                </p>
              </div>

              {/* Info box about scoring */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 text-xl">💡</span>
                  <div className="text-sm text-gray-700">
                    <strong className="text-blue-900">Tip:</strong> Proporcionar detalles sobre tu estabilidad laboral
                    puede mejorar tu puntuación hasta en 13 puntos. Un contrato indefinido y 3+ años de antigüedad
                    son los mejor valorados.
                  </div>
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

          {/* Step 3: References & Rental History - NEW! */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Referencias e Historial</h2>

              {/* Rental History */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                <div className="flex items-start gap-2 mb-4">
                  <span className="text-2xl">🏠</span>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Historial de Alquiler</h3>
                    <p className="text-sm text-gray-600">
                      Opcional pero recomendado - ayuda a mejorar tu puntuación
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Dirección anterior (opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.previousAddress}
                      onChange={(e) => setFormData({...formData, previousAddress: e.target.value})}
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
                        onChange={(e) => setFormData({...formData, previousLandlordName: e.target.value})}
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
                        onChange={(e) => setFormData({...formData, previousLandlordPhone: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder-gray-400"
                        placeholder="+34 600 000 000"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* References */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                <div className="flex items-start gap-2 mb-4">
                  <span className="text-2xl">👥</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      Referencias
                      <span className="ml-2 text-xs bg-purple-600 text-white px-2 py-1 rounded-full">
                        +10 puntos
                      </span>
                    </h3>
                    <p className="text-sm text-gray-600">
                      Proporciona al menos 2 referencias para maximizar tu puntuación
                    </p>
                  </div>
                </div>

                {formData.references.map((ref, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 mb-3 border border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-semibold text-gray-900">Referencia {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newRefs = formData.references.filter((_, i) => i !== index);
                          setFormData({...formData, references: newRefs});
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
                            newRefs[index] = {...ref, type: e.target.value as any};
                            setFormData({...formData, references: newRefs});
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
                              newRefs[index] = {...ref, name: e.target.value};
                              setFormData({...formData, references: newRefs});
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
                              newRefs[index] = {...ref, phone: e.target.value};
                              setFormData({...formData, references: newRefs});
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                            placeholder="+34 600 000 000"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Relación/Empresa
                        </label>
                        <input
                          type="text"
                          value={ref.relationship}
                          onChange={(e) => {
                            const newRefs = [...formData.references];
                            newRefs[index] = {...ref, relationship: e.target.value};
                            setFormData({...formData, references: newRefs});
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                          placeholder="Ej: Jefe directo en Tech Corp SL"
                        />
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
                  className="w-full py-3 border-2 border-dashed border-purple-300 rounded-lg text-purple-700 hover:bg-purple-50 transition font-semibold"
                >
                  + Añadir Referencia
                </button>
              </div>

              {/* Skip option */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Nota:</strong> Puedes omitir este paso, pero proporcionar referencias verificables
                  mejora significativamente tu puntuación (+10 puntos por 2 referencias).
                </p>
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

          {/* Step 4: Property */}
          {step === 4 && (
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
                  onChange={(e) => setFormData({...formData, propertyAddress: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, monthlyRent: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder-gray-400"
                  placeholder="900"
                />
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

          {/* Step 5: Landlord & Package */}
          {step === 5 && (
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
                  onChange={(e) => setFormData({...formData, landlordName: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, landlordEmail: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, landlordPhone: e.target.value})}
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
                    onClick={() => setFormData({...formData, billingMode: 'payperuse'})}
                    className={`p-6 border-2 rounded-lg cursor-pointer transition ${
                      formData.billingMode === 'payperuse' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-bold text-lg text-gray-900">💳 Pago por Informe</div>
                    <div className="text-sm text-gray-700 mt-2">Sin compromiso, paga solo cuando lo necesites</div>
                    <div className="text-xs text-gray-600 mt-2">Ideal para uso ocasional</div>
                  </div>
                  <div 
                    onClick={() => setFormData({...formData, billingMode: 'subscription'})}
                    className={`p-6 border-2 rounded-lg cursor-pointer transition ${
                      formData.billingMode === 'subscription' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-bold text-lg text-gray-900">📅 Suscripción Mensual</div>
                    <div className="text-sm text-gray-700 mt-2">Ahorra hasta 70% con planes mensuales</div>
                    <div className="text-xs text-green-600 mt-2 font-semibold">⚡ Mejor valor</div>
                  </div>
                </div>
              </div>

              {/* Pay Per Use Options */}
              {formData.billingMode === 'payperuse' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Selecciona Paquete *
                  </label>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div 
                      onClick={() => setFormData({...formData, packageType: 'basic'})}
                      className={`p-6 border-2 rounded-lg cursor-pointer transition ${
                        formData.packageType === 'basic' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-bold text-xl text-gray-900">Básica</div>
                      <div className="text-3xl font-bold text-blue-600 my-2">€59</div>
                      <div className="text-sm text-gray-700">Verificación esencial</div>
                      <ul className="mt-3 space-y-1 text-xs text-gray-600">
                        <li>✓ Identidad + Ingresos</li>
                        <li>✓ Informe en 24h</li>
                      </ul>
                    </div>
                    <div 
                      onClick={() => setFormData({...formData, packageType: 'complete'})}
                      className={`p-6 border-2 rounded-lg cursor-pointer transition relative ${
                        formData.packageType === 'complete' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <span className="absolute -top-3 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        RECOMENDADO
                      </span>
                      <div className="font-bold text-xl text-gray-900">Completa</div>
                      <div className="text-3xl font-bold text-blue-600 my-2">€99</div>
                      <div className="text-sm text-gray-700">Análisis exhaustivo</div>
                      <ul className="mt-3 space-y-1 text-xs text-gray-600">
                        <li>✓ Todo lo básico +</li>
                        <li>✓ Solvencia + Referencias</li>
                        <li>✓ Informe en 12h</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Subscription Options */}
              {formData.billingMode === 'subscription' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Selecciona Plan de Suscripción *
                  </label>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div 
                      onClick={() => setFormData({...formData, subscriptionPlan: 'starter'})}
                      className={`p-5 border-2 rounded-lg cursor-pointer transition ${
                        formData.subscriptionPlan === 'starter' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-bold text-lg text-gray-900">Starter</div>
                      <div className="text-2xl font-bold text-blue-600 my-2">€49<span className="text-sm text-gray-600">/mes</span></div>
                      <div className="text-sm text-gray-700 mb-2">3 verificaciones/mes</div>
                      <div className="text-xs text-green-600 font-semibold">Ahorra €148/mes</div>
                    </div>
                    <div 
                      onClick={() => setFormData({...formData, subscriptionPlan: 'professional'})}
                      className={`p-5 border-2 rounded-lg cursor-pointer transition relative ${
                        formData.subscriptionPlan === 'professional' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <span className="absolute -top-3 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                        POPULAR
                      </span>
                      <div className="font-bold text-lg text-gray-900">Professional</div>
                      <div className="text-2xl font-bold text-blue-600 my-2">€129<span className="text-sm text-gray-600">/mes</span></div>
                      <div className="text-sm text-gray-700 mb-2">10 verificaciones/mes</div>
                      <div className="text-xs text-green-600 font-semibold">Ahorra €861/mes</div>
                    </div>
                    <div 
                      onClick={() => setFormData({...formData, subscriptionPlan: 'enterprise'})}
                      className={`p-5 border-2 rounded-lg cursor-pointer transition ${
                        formData.subscriptionPlan === 'enterprise' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-bold text-lg text-gray-900">Enterprise</div>
                      <div className="text-2xl font-bold text-blue-600 my-2">€299<span className="text-sm text-gray-600">/mes</span></div>
                      <div className="text-sm text-gray-700 mb-2">30 verificaciones/mes</div>
                      <div className="text-xs text-green-600 font-semibold">Ahorra €2,671/mes</div>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✨ <strong>7 días de prueba gratuita</strong> - Cancela en cualquier momento
                    </p>
                  </div>
                </div>
              )}

              {/* Price Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border-2 border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900 text-lg">
                    {formData.billingMode === 'payperuse' ? 'Total a pagar:' : 'Primer mes:'}
                  </span>
                  <span className="text-3xl font-bold text-blue-600">
                    {formData.billingMode === 'payperuse' 
                      ? `€${formData.packageType === 'basic' ? '59' : '99'}`
                      : formData.subscriptionPlan === 'starter' ? '€0'
                      : formData.subscriptionPlan === 'professional' ? '€0'
                      : '€0'
                    }
                  </span>
                </div>
                {formData.billingMode === 'subscription' && (
                  <p className="text-sm text-gray-700 mt-2">
                    Luego €{formData.subscriptionPlan === 'starter' ? '49' : formData.subscriptionPlan === 'professional' ? '129' : '299'}/mes
                  </p>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  disabled={submitting}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div>
                      <span>Procesando...</span>
                    </>
                  ) : (
                    formData.billingMode === 'subscription' ? 'Comenzar Prueba Gratuita' : 'Iniciar Verificación y Pagar'
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </main>
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
