'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function ScreeningSuccess({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const screeningId = resolvedParams.id;
  
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const isDemo = searchParams.get('demo') === 'true';
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Trigger screening processing
    if (screeningId && (sessionId || isDemo)) {
      processScreening();
    }
  }, [screeningId, sessionId, isDemo]);

  const processScreening = async () => {
    try {
      setProcessing(true);
      const response = await fetch(`/api/screenings/${screeningId}/process`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Error al procesar verificación');
      }

      setProcessing(false);
    } catch (err: any) {
      setError(err.message);
      setProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {isDemo ? '¡Verificación Demo Iniciada!' : '¡Pago Confirmado!'}
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            {isDemo 
              ? 'Explorando el proceso completo de verificación'
              : 'Tu verificación de inquilino ha sido iniciada'
            }
          </p>

          {/* Demo Banner */}
          {isDemo && (
            <div className="mb-8 p-5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✨</span>
                <div className="text-left">
                  <h3 className="font-bold text-lg mb-1">Modo Demo</h3>
                  <p className="text-green-50 text-sm">
                    Esta es una verificación demo sin cargo. Puedes ver el informe completo 
                    y explorar todas las funcionalidades del sistema.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {isDemo ? 'Modo demo activado' : 'Pago procesado'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {isDemo 
                      ? 'Acceso completo sin necesidad de pago'
                      : 'Tu pago se ha confirmado correctamente'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 ${processing ? 'bg-blue-100' : 'bg-green-100'} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  {processing ? (
                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 rounded-full border-t-transparent"></div>
                  ) : (
                    <span className="text-green-600 text-sm">✓</span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Verificación iniciada</h3>
                  <p className="text-sm text-gray-600">
                    {processing ? 'Procesando...' : 'Análisis en curso'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-gray-400 text-sm">⏱</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Informe generado</h3>
                  <p className="text-sm text-gray-600">
                    Recibirás el informe en 24-48 horas laborables
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-2">
              {isDemo ? '🎯 Demo Completado' : '📧 Próximos pasos'}
            </h3>
            {isDemo ? (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Has explorado el flujo completo. En una verificación real:
                </p>
                <ul className="text-sm text-gray-600 space-y-2 text-left">
                  <li>• Se procesaría el pago con Stripe (€49 o €99)</li>
                  <li>• Se realizaría consulta ASNEF real</li>
                  <li>• Se verificarían documentos con OCR</li>
                  <li>• Se enviarían emails al inquilino y propietario</li>
                  <li>• El informe PDF sería válido legalmente</li>
                </ul>
                <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded text-sm text-green-800">
                  <strong>💡 ¿Listo para empezar?</strong> Crea tu primera verificación real sin el modo demo
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Hemos enviado un email de confirmación a tu bandeja de entrada con:
                </p>
                <ul className="text-sm text-gray-600 space-y-2 text-left">
                  <li>• ID de verificación: <span className="font-mono font-semibold">{screeningId.substring(0, 8)}</span></li>
                  <li>• Instrucciones para el inquilino</li>
                  <li>• Enlace para seguimiento en tiempo real</li>
                </ul>
              </>
            )}
          </div>

          <div className="flex gap-4 justify-center">
            <Link
              href="/dashboard"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Ir al Dashboard
            </Link>
            <Link
              href={isDemo ? "/screening/new" : "/screening/new"}
              className="px-8 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
            >
              {isDemo ? 'Crear Verificación Real' : 'Nueva Verificación'}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
