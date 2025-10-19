'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase';

// DEPRECATED: Mock data for demo/testing only
const mockScreeningsForDemo = [
  {
    id: '1',
    tenantName: 'Juan García López',
    propertyAddress: 'Calle Gran Vía, 123, Barcelona',
    status: 'completed',
    score: 85,
    riskLevel: 'low',
    fraudFlags: [],
    explanation: {
      topPositiveFactors: [
        { factor: 'Relación ingresos/alquiler', points: 25, description: 'Ingresos son 3.5x del alquiler mensual' },
        { factor: 'Historial crediticio', points: 30, description: 'Score crediticio excelente (850/1000)' },
        { factor: 'Estabilidad laboral', points: 8, description: '5 años en el empleo actual' },
      ],
      topNegativeFactors: [],
      improvementSuggestions: [],
    },
    createdAt: new Date('2025-10-10'),
    completedAt: new Date('2025-10-11'),
    isDemo: false,
  },
  {
    id: '2',
    tenantName: 'María Rodríguez',
    propertyAddress: 'Passeig de Gràcia, 45, Barcelona',
    status: 'processing',
    createdAt: new Date('2025-10-12'),
    isDemo: false,
  },
  {
    id: '3',
    tenantName: 'Carlos Martínez',
    propertyAddress: 'Carrer de Balmes, 200, Barcelona',
    status: 'completed',
    score: 58,
    riskLevel: 'high',
    fraudFlags: [
      { type: 'suspicious_ratio', severity: 'high', description: 'Alquiler supera el 50% de los ingresos' },
      { type: 'data_inconsistency', severity: 'high', description: 'Inclusión reciente en ASNEF (2 meses)' },
    ],
    explanation: {
      topPositiveFactors: [
        { factor: 'Verificación de identidad', points: 10, description: 'Documento DNI validado correctamente' },
      ],
      topNegativeFactors: [
        { factor: 'Relación ingresos/alquiler', points: -20, description: 'El alquiler representa más del 50% de los ingresos' },
        { factor: 'Historial crediticio ASNEF', points: -8, description: 'Deuda activa: €1,200 registrada hace 2 meses' },
        { factor: 'Referencias', points: -10, description: 'No se proporcionaron referencias' },
      ],
      improvementSuggestions: [
        'Buscar una propiedad con alquiler más bajo',
        'Resolver deudas pendientes en ASNEF',
        'Proporcionar al menos 2 referencias verificables',
      ],
    },
    createdAt: new Date('2025-10-12'),
    completedAt: new Date('2025-10-12'),
    isDemo: false,
  },
  {
    id: 'demo-1',
    tenantName: 'Ana Demo Usuario',
    propertyAddress: 'Rambla de Catalunya, 50, Barcelona',
    status: 'completed',
    score: 92,
    riskLevel: 'low',
    fraudFlags: [],
    explanation: {
      topPositiveFactors: [
        { factor: 'Relación ingresos/alquiler', points: 25, description: 'Ingresos son 4x del alquiler mensual' },
        { factor: 'Historial crediticio', points: 30, description: 'Score crediticio excelente (920/1000)' },
        { factor: 'Tipo de contrato', points: 5, description: 'Contrato indefinido - máxima seguridad laboral' },
      ],
      topNegativeFactors: [],
      improvementSuggestions: [],
    },
    createdAt: new Date('2025-10-12'),
    completedAt: new Date('2025-10-12'),
    isDemo: true,
  },
];

export default function Dashboard() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const [expandedScreening, setExpandedScreening] = useState<string | null>(null);
  const [screenings, setScreenings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  // Fetch screenings from Supabase
  useEffect(() => {
    async function fetchScreenings() {
      if (!user?.email) return;

      try {
        setLoading(true);
        setError(null);

        // For demo user, show mock data
        if (user.email === 'demo') {
          setScreenings(mockScreeningsForDemo);
          setLoading(false);
          return;
        }

        // Fetch real screenings for authenticated users
        const { data, error: fetchError } = await supabase
          .from('screenings')
          .select('*')
          .eq('landlord_email', user.email)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        // Transform database data to match our component format
        const transformedScreenings = (data || []).map((screening: any) => ({
          id: screening.id,
          tenantName: screening.tenant_name,
          propertyAddress: screening.property_address,
          status: screening.status,
          score: screening.score,
          riskLevel: screening.risk_level,
          fraudFlags: screening.fraud_flags || [],
          explanation: screening.explanation || {
            topPositiveFactors: [],
            topNegativeFactors: [],
            improvementSuggestions: [],
          },
          createdAt: new Date(screening.created_at),
          completedAt: screening.completed_at ? new Date(screening.completed_at) : undefined,
          isDemo: screening.is_demo || false,
        }));

        setScreenings(transformedScreenings);
      } catch (err: any) {
        console.error('Error fetching screenings:', err);
        setError(err.message);
        // Fallback to empty array on error
        setScreenings([]);
      } finally {
        setLoading(false);
      }
    }

    fetchScreenings();
  }, [user]);
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg sm:text-xl">TS</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-gray-800">TenantScreen</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link 
                href="/screening/new"
                className="px-3 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm sm:text-base"
              >
                <span className="hidden sm:inline">+ Nueva Verificación</span>
                <span className="sm:hidden">+ Nueva</span>
              </Link>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="text-right hidden md:block">
                  <div className="text-sm font-semibold text-gray-900">{user?.name}</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm sm:text-base">
                    {user?.name.charAt(0)}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                  title="Cerrar sesión"
                >
                  Salir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Demo User Info Banner */}
        {user?.email === 'demo' && (
          <div className="mb-6 p-5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <h3 className="font-bold text-lg mb-1">Panel Demo Activo</h3>
                <p className="text-green-50 text-sm">
                  Estás usando una cuenta demo. Puedes crear verificaciones ilimitadas 
                  <strong> sin ningún costo</strong> y explorar todas las funcionalidades del sistema.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 p-5 bg-red-50 border-2 border-red-200 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-bold text-red-900 text-lg mb-1">Error al cargar verificaciones</h3>
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-semibold"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Verificaciones"
            value={loading ? '...' : screenings.length.toString()}
          />
          <StatCard
            title="Completadas"
            value={loading ? '...' : screenings.filter(s => s.status === 'completed').length.toString()}
            color="green"
          />
          <StatCard
            title="En Proceso"
            value={loading ? '...' : screenings.filter(s => s.status === 'processing').length.toString()}
            color="yellow"
          />
          <StatCard
            title="Pendientes"
            value={loading ? '...' : screenings.filter(s => s.status === 'pending').length.toString()}
            color="blue"
          />
        </div>

        {/* Screenings List */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Verificaciones</h2>
              {loading && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-600 rounded-full border-t-transparent"></div>
                  Cargando...
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Inquilino
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Propiedad
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Puntuación
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Riesgo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && screenings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin h-8 w-8 border-3 border-blue-600 rounded-full border-t-transparent"></div>
                        <p className="text-gray-600">Cargando verificaciones...</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  screenings.map((screening) => (
                  <>
                    <tr
                      key={screening.id}
                      className="hover:bg-gray-50 transition cursor-pointer"
                      onClick={() => setExpandedScreening(expandedScreening === screening.id ? null : screening.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold text-gray-900">{screening.tenantName}</div>
                          {screening.isDemo && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                              DEMO
                            </span>
                          )}
                          {screening.fraudFlags && screening.fraudFlags.length > 0 && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded flex items-center gap-1">
                              ⚠ {screening.fraudFlags.length}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">{screening.propertyAddress}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={screening.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {screening.score !== undefined ? (
                          <div className="flex items-center gap-2">
                            <div className={`text-sm font-bold ${
                              screening.score >= 80 ? 'text-green-600' :
                              screening.score >= 60 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {screening.score}/100
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {screening.riskLevel && (
                          <RiskLevelBadge level={screening.riskLevel} />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {screening.createdAt.toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {screening.status === 'completed' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle PDF download
                            }}
                            className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                          >
                            Ver Informe
                          </button>
                        ) : (
                          <button className="text-gray-500 cursor-not-allowed">
                            En proceso
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Expanded Details */}
                    {expandedScreening === screening.id && screening.status === 'completed' && (
                      <tr>
                        <td colSpan={7} className="px-6 py-6 bg-gray-50">
                          <ScreeningDetails screening={screening} />
                        </td>
                      </tr>
                    )}
                  </>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && screenings.length === 0 && (
            <div className="p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No hay verificaciones todavía
              </h3>
              <p className="text-gray-600 mb-6">
                Inicia tu primera verificación de inquilino
              </p>
              <Link 
                href="/screening/new"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                Nueva Verificación
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function StatCard({ title, value, color = 'blue' }: { title: string; value: string; color?: string }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="text-sm text-gray-600 mb-2">{title}</div>
      <div className={`text-3xl font-bold ${colors[color as keyof typeof colors]}`}>
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: 'bg-blue-100 text-blue-800',
    processing: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  const labels = {
    pending: 'Pendiente',
    processing: 'En proceso',
    completed: 'Completado',
    rejected: 'Rechazado',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
      {labels[status as keyof typeof labels]}
    </span>
  );
}

function RiskLevelBadge({ level }: { level: string }) {
  const styles = {
    low: 'bg-green-100 text-green-800 border-green-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    very_high: 'bg-red-100 text-red-800 border-red-300',
  };

  const labels = {
    low: 'Bajo',
    medium: 'Medio',
    high: 'Alto',
    very_high: 'Muy Alto',
  };

  const icons = {
    low: '✓',
    medium: '⚠',
    high: '⚠',
    very_high: '✗',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[level as keyof typeof styles]}`}>
      {icons[level as keyof typeof icons]} {labels[level as keyof typeof labels]}
    </span>
  );
}

function ScreeningDetails({ screening }: { screening: any }) {
  return (
    <div className="space-y-6">
      {/* Fraud Flags */}
      {screening.fraudFlags && screening.fraudFlags.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-5">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-bold text-red-900 text-lg">Alertas de Fraude Detectadas</h3>
              <p className="text-sm text-red-700">Se requiere revisión manual antes de aprobar</p>
            </div>
          </div>
          <ul className="space-y-2">
            {screening.fraudFlags.map((flag: any, idx: number) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  flag.severity === 'high' ? 'bg-red-200 text-red-900' :
                  flag.severity === 'medium' ? 'bg-orange-200 text-orange-900' :
                  'bg-yellow-200 text-yellow-900'
                }`}>
                  {flag.severity.toUpperCase()}
                </span>
                <span className="text-red-800">{flag.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Explanation Section */}
      {screening.explanation && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Positive Factors */}
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-5">
            <h3 className="font-bold text-green-900 text-lg mb-4 flex items-center gap-2">
              <span className="text-2xl">✓</span>
              Factores Positivos
            </h3>
            {screening.explanation.topPositiveFactors.length > 0 ? (
              <ul className="space-y-3">
                {screening.explanation.topPositiveFactors.map((factor: any, idx: number) => (
                  <li key={idx} className="border-l-4 border-green-500 pl-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-green-900 text-sm">{factor.factor}</span>
                      <span className="text-green-700 font-bold text-sm">+{factor.points} pts</span>
                    </div>
                    <p className="text-xs text-green-700">{factor.description}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-green-700">No hay factores positivos destacados</p>
            )}
          </div>

          {/* Negative Factors */}
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-5">
            <h3 className="font-bold text-red-900 text-lg mb-4 flex items-center gap-2">
              <span className="text-2xl">✗</span>
              Factores Negativos
            </h3>
            {screening.explanation.topNegativeFactors.length > 0 ? (
              <ul className="space-y-3">
                {screening.explanation.topNegativeFactors.map((factor: any, idx: number) => (
                  <li key={idx} className="border-l-4 border-red-500 pl-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-red-900 text-sm">{factor.factor}</span>
                      <span className="text-red-700 font-bold text-sm">{factor.points} pts</span>
                    </div>
                    <p className="text-xs text-red-700">{factor.description}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-red-700">Sin observaciones negativas</p>
            )}
          </div>
        </div>
      )}

      {/* Improvement Suggestions */}
      {screening.explanation && screening.explanation.improvementSuggestions.length > 0 && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-5">
          <h3 className="font-bold text-blue-900 text-lg mb-3 flex items-center gap-2">
            <span className="text-2xl">💡</span>
            Sugerencias de Mejora (GDPR Art. 22)
          </h3>
          <ul className="space-y-2">
            {screening.explanation.improvementSuggestions.map((suggestion: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-blue-800">
                <span className="text-blue-600 font-bold">•</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Request Human Review Button */}
      <div className="flex gap-4 justify-end">
        <button className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold">
          Solicitar Revisión Manual
        </button>
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold">
          Descargar Informe PDF
        </button>
      </div>
    </div>
  );
}
