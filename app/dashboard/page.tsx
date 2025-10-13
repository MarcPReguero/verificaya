'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

// Mock data - replace with real data from DB
const mockScreenings = [
  {
    id: '1',
    tenantName: 'Juan García López',
    propertyAddress: 'Calle Gran Vía, 123, Barcelona',
    status: 'completed',
    score: 85,
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
    status: 'pending',
    createdAt: new Date('2025-10-12'),
    isDemo: false,
  },
  {
    id: 'demo-1',
    tenantName: 'Ana Demo Usuario',
    propertyAddress: 'Rambla de Catalunya, 50, Barcelona',
    status: 'completed',
    score: 92,
    createdAt: new Date('2025-10-12'),
    completedAt: new Date('2025-10-12'),
    isDemo: true,
  },
];

export default function Dashboard() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);
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

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Verificaciones" value="4" />
          <StatCard title="Completadas" value="2" color="green" />
          <StatCard title="En Proceso" value="1" color="yellow" />
          <StatCard title="Pendientes" value="1" color="blue" />
        </div>

        {/* Screenings List */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">Verificaciones</h2>
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
                    Fecha
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mockScreenings.map((screening) => (
                  <tr key={screening.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-gray-900">{screening.tenantName}</div>
                        {screening.isDemo && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                            DEMO
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
                      {screening.score ? (
                        <div className="text-sm font-bold text-gray-900">
                          {screening.score}/100
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {screening.createdAt.toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {screening.status === 'completed' ? (
                        <button className="text-blue-600 hover:text-blue-800 font-semibold hover:underline">
                          Ver Informe
                        </button>
                      ) : (
                        <button className="text-gray-500 cursor-not-allowed">
                          En proceso
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {mockScreenings.length === 0 && (
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
