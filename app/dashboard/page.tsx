'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase';

type ScreeningStatus = 'pending' | 'processing' | 'completed' | 'rejected' | 'failed';
type RiskLevel = 'low' | 'medium' | 'high' | 'very_high';
type FraudSeverity = 'low' | 'medium' | 'high';
type DashboardStatusFilter = ScreeningStatus | 'all';
type DashboardRiskFilter = RiskLevel | 'all';
type SortField = 'tenantName' | 'propertyAddress' | 'status' | 'score' | 'riskLevel' | 'createdAt';
type SortDirection = 'asc' | 'desc';

interface ScreeningFlag {
  severity: FraudSeverity;
  description: string;
}

interface ScoringFactor {
  factor: string;
  description: string;
  points: number;
}

interface ScreeningExplanation {
  topPositiveFactors: ScoringFactor[];
  topNegativeFactors: ScoringFactor[];
  improvementSuggestions: string[];
}

interface ScreeningSummary {
  id: string;
  tenantName: string;
  propertyAddress: string;
  status: ScreeningStatus;
  score: number | null;
  riskLevel: RiskLevel | null;
  fraudFlags: ScreeningFlag[];
  explanation: ScreeningExplanation;
  createdAt: Date;
  completedAt?: Date;
  reportUrl?: string;
}

type ScreeningDbRow = {
  id: string;
  tenant_name: string;
  property_address: string;
  status: string;
  score: number | null;
  risk_level: RiskLevel | null;
  fraud_flags: unknown;
  explanation: unknown;
  created_at: string;
  completed_at: string | null;
  report_url: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toScore(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return null;
}

function toStatus(value: unknown): ScreeningStatus {
  const allowed: ScreeningStatus[] = ['pending', 'processing', 'completed', 'rejected', 'failed'];
  return allowed.includes(value as ScreeningStatus) ? (value as ScreeningStatus) : 'pending';
}

function toRiskLevel(value: unknown): RiskLevel | null {
  const allowed: RiskLevel[] = ['low', 'medium', 'high', 'very_high'];
  return allowed.includes(value as RiskLevel) ? (value as RiskLevel) : null;
}

function parseFraudFlags(value: unknown): ScreeningFlag[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (!isRecord(entry)) return null;

      const severityValue = entry.severity;
      const isValidSeverity = severityValue === 'low' || severityValue === 'medium' || severityValue === 'high';
      const descriptionValue = entry.description;

      if (typeof descriptionValue !== 'string') return null;

      return {
        severity: isValidSeverity ? (severityValue as FraudSeverity) : 'low',
        description: descriptionValue,
      };
    })
    .filter((flag): flag is ScreeningFlag => Boolean(flag));
}

function parseScoringFactors(value: unknown): ScoringFactor[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (!isRecord(entry)) return null;

      const factor = entry.factor;
      const description = entry.description;
      const pointsValue = entry.points;

      if (typeof factor !== 'string' || typeof description !== 'string') return null;
      const points = typeof pointsValue === 'number' && Number.isFinite(pointsValue) ? pointsValue : 0;

      return {
        factor,
        description,
        points,
      };
    })
    .filter((factor): factor is ScoringFactor => Boolean(factor));
}

function parseExplanation(value: unknown): ScreeningExplanation {
  if (!isRecord(value)) {
    return {
      topPositiveFactors: [],
      topNegativeFactors: [],
      improvementSuggestions: [],
    };
  }

  const topPositive = parseScoringFactors(value.topPositiveFactors);
  const topNegative = parseScoringFactors(value.topNegativeFactors);
  const suggestions = Array.isArray(value.improvementSuggestions)
    ? value.improvementSuggestions.filter((entry): entry is string => typeof entry === 'string')
    : [];

  return {
    topPositiveFactors: topPositive,
    topNegativeFactors: topNegative,
    improvementSuggestions: suggestions,
  };
}

export default function Dashboard() {
  const router = useRouter();
  const { isAuthenticated, user, logout, loading: authLoading } = useAuth();
  const [expandedScreening, setExpandedScreening] = useState<string | null>(null);
  const [screenings, setScreenings] = useState<ScreeningSummary[]>([]);
  const [fetchingScreenings, setFetchingScreenings] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<DashboardStatusFilter>('all');
  const [riskFilter, setRiskFilter] = useState<DashboardRiskFilter>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const displayName = (user?.name?.trim() || user?.email || 'Usuario');
  const userInitial = displayName.trim() ? displayName.trim().charAt(0).toUpperCase() : 'U';

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch screenings from Supabase
  useEffect(() => {
    async function fetchScreenings() {
      if (!user?.email) return;

      try {
        setFetchingScreenings(true);
        setError(null);

        // Fetch screenings for authenticated users
        const { data, error: fetchError } = await supabase
          .from('screenings')
          .select('*')
          .eq('landlord_email', user.email)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        // Transform database data to match our component format
        const transformedScreenings = (data || []).map((screening) => {
          const row = screening as ScreeningDbRow;

          return {
            id: row.id,
            tenantName: row.tenant_name,
            propertyAddress: row.property_address,
            status: toStatus(row.status),
            score: toScore(row.score),
            riskLevel: toRiskLevel(row.risk_level),
            fraudFlags: parseFraudFlags(row.fraud_flags),
            explanation: parseExplanation(row.explanation),
            createdAt: new Date(row.created_at),
            completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
            reportUrl: row.report_url || undefined,
          };
        });

        setScreenings(transformedScreenings);
      } catch (err: unknown) {
        console.error('Error fetching screenings:', err);
        const message = err instanceof Error ? err.message : 'Error al cargar verificaciones';
        setError(message);
        // Fallback to empty array on error
        setScreenings([]);
      } finally {
        setFetchingScreenings(false);
      }
    }

    fetchScreenings();
  }, [user]);

  const filteredAndSortedScreenings = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const visible = screenings.filter((screening) => {
      const searchableText = `${screening.tenantName} ${screening.propertyAddress}`.toLowerCase();
      const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);
      const matchesStatus = statusFilter === 'all' ? true : screening.status === statusFilter;
      const matchesRisk = riskFilter === 'all' ? true : screening.riskLevel === riskFilter;
      return matchesSearch && matchesStatus && matchesRisk;
    });

    const sorted = [...visible].sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      if (sortField === 'createdAt') {
        return direction * (a.createdAt.getTime() - b.createdAt.getTime());
      }
      if (sortField === 'score') {
        return direction * ((a.score ?? -1) - (b.score ?? -1));
      }
      if (sortField === 'tenantName') {
        return direction * a.tenantName.localeCompare(b.tenantName, 'es');
      }
      if (sortField === 'propertyAddress') {
        return direction * a.propertyAddress.localeCompare(b.propertyAddress, 'es');
      }
      if (sortField === 'status') {
        return direction * a.status.localeCompare(b.status, 'es');
      }
      if (sortField === 'riskLevel') {
        return direction * ((a.riskLevel ?? '').localeCompare(b.riskLevel ?? '', 'es'));
      }
      return 0;
    });

    return sorted;
  }, [riskFilter, screenings, searchTerm, sortDirection, sortField, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedScreenings.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedScreenings = filteredAndSortedScreenings.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );
  const startRange = filteredAndSortedScreenings.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endRange = Math.min(safeCurrentPage * pageSize, filteredAndSortedScreenings.length);
  const visibleTotal = filteredAndSortedScreenings.length;
  const visibleCompleted = filteredAndSortedScreenings.filter((screening) => screening.status === 'completed').length;
  const visibleProcessing = filteredAndSortedScreenings.filter((screening) => screening.status === 'processing').length;
  const visiblePending = filteredAndSortedScreenings.filter((screening) => screening.status === 'pending').length;
  const visibleRejected = filteredAndSortedScreenings.filter((screening) => screening.status === 'rejected').length;
  const visibleFailed = filteredAndSortedScreenings.filter((screening) => screening.status === 'failed').length;
  const completionRate = visibleTotal === 0 ? 0 : Math.round((visibleCompleted / visibleTotal) * 100);
  const withScore = filteredAndSortedScreenings.filter((screening) => screening.score !== null && Number.isFinite(screening.score));
  const averageScore = withScore.length === 0 ? '—' : `${Math.round(withScore.reduce((sum, screening) => sum + (screening.score ?? 0), 0) / withScore.length)}`;
  const highRiskCount = filteredAndSortedScreenings.filter((screening) => screening.riskLevel === 'high' || screening.riskLevel === 'very_high').length;

  const exportScreeningsCsv = () => {
    const headers = ['ID', 'Fecha', 'Inquilino', 'Propiedad', 'Estado', 'Puntuación', 'Riesgo', 'Banderas Fraude', 'URL Informe'];
    const rows = filteredAndSortedScreenings.map((screening) => [
      screening.id,
      screening.createdAt.toISOString(),
      screening.tenantName,
      screening.propertyAddress,
      screening.status,
      screening.score ?? '',
      screening.riskLevel ?? '',
      screening.fraudFlags.length,
      screening.reportUrl ?? '',
    ]);

    const escapeCsv = (value: unknown) => `"${String(value).replace(/"/g, '""')}"`;
    const csv = [
      headers.map(escapeCsv).join(','),
      ...rows.map((row) => row.map(escapeCsv).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    link.href = URL.createObjectURL(blob);
    link.download = `verificaciones-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }, [totalPages]);

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setRiskFilter('all');
    setSortField('createdAt');
    setSortDirection('desc');
    setCurrentPage(1);
  };

  useEffect(() => {
    if (safeCurrentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, safeCurrentPage]);
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
                  <div className="text-sm font-semibold text-gray-900">{displayName}</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm sm:text-base">
                    {userInitial}
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
            <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
            <StatCard
              title="Total Verificaciones"
              value={fetchingScreenings ? '...' : visibleTotal.toString()}
            />
            <StatCard
              title="Completadas"
              value={fetchingScreenings ? '...' : visibleCompleted.toString()}
              color="green"
            />
            <StatCard
              title="En Proceso"
              value={fetchingScreenings ? '...' : visibleProcessing.toString()}
              color="yellow"
            />
            <StatCard
              title="Pendientes"
              value={fetchingScreenings ? '...' : visiblePending.toString()}
              color="blue"
            />
            <StatCard
              title="Rechazadas/Fallidas"
              value={fetchingScreenings ? '...' : `${visibleRejected}/${visibleFailed}`}
              color="red"
            />
            <StatCard
              title="Score medio"
              value={fetchingScreenings ? '...' : averageScore}
            />
            <StatCard
              title="Tasa de completado"
              value={fetchingScreenings ? '...' : `${completionRate}%`}
              color="green"
            />
            <StatCard title="Riesgo alto" value={fetchingScreenings ? '...' : highRiskCount.toString()} color="red" />
          </div>

        {/* Screenings List */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Verificaciones</h2>
              {fetchingScreenings && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-600 rounded-full border-t-transparent"></div>
                  Cargando...
                </div>
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-6">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Buscar por inquilino o propiedad"
              />
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as DashboardStatusFilter);
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="processing">En proceso</option>
                <option value="completed">Completado</option>
                <option value="rejected">Rechazado</option>
                <option value="failed">Fallido</option>
              </select>
              <select
                value={riskFilter}
                onChange={(event) => {
                  setRiskFilter(event.target.value as DashboardRiskFilter);
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="all">Todos los riesgos</option>
                <option value="low">Riesgo Bajo</option>
                <option value="medium">Riesgo Medio</option>
                <option value="high">Riesgo Alto</option>
                <option value="very_high">Riesgo Muy Alto</option>
              </select>
              <div className="flex gap-2">
                <select
                  value={sortField}
                  onChange={(event) => {
                    setSortField(event.target.value as SortField);
                    setCurrentPage(1);
                  }}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="createdAt">Ordenar por fecha</option>
                  <option value="tenantName">Ordenar por inquilino</option>
                  <option value="propertyAddress">Ordenar por propiedad</option>
                  <option value="status">Ordenar por estado</option>
                  <option value="riskLevel">Ordenar por riesgo</option>
                  <option value="score">Ordenar por puntuación</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  {sortDirection === 'asc' ? 'Ascendente' : 'Descendente'}
                </button>
              </div>
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={exportScreeningsCsv}
                disabled={filteredAndSortedScreenings.length === 0}
                className="rounded-lg bg-green-600 text-white px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Exportar CSV
              </button>
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
                {fetchingScreenings && filteredAndSortedScreenings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin h-8 w-8 border-3 border-blue-600 rounded-full border-t-transparent"></div>
                        <p className="text-gray-600">Cargando verificaciones...</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedScreenings.map((screening) => (
                  <>
                    <tr
                      key={screening.id}
                      className="hover:bg-gray-50 transition cursor-pointer"
                      onClick={() => setExpandedScreening(expandedScreening === screening.id ? null : screening.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold text-gray-900">{screening.tenantName}</div>
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
                        {screening.status === 'completed' && screening.reportUrl ? (
                          <a
                            href={screening.reportUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                          >
                            Ver Informe
                          </a>
                        ) : screening.status === 'completed' ? (
                          <button className="text-yellow-600 cursor-wait">
                            Generando...
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

          {!fetchingScreenings && filteredAndSortedScreenings.length > 0 && (
            <div className="px-6 py-4 border-t flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-600">
                Mostrando {startRange} - {endRange} de {filteredAndSortedScreenings.length}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => goToPage(safeCurrentPage - 1)}
                    disabled={safeCurrentPage <= 1}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  {pageNumbers.map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => goToPage(pageNumber)}
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        pageNumber === safeCurrentPage
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => goToPage(safeCurrentPage + 1)}
                    disabled={safeCurrentPage >= totalPages}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </div>
          )}

          {!fetchingScreenings && filteredAndSortedScreenings.length === 0 && (
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
    failed: 'bg-rose-100 text-rose-800',
  };

  const labels = {
    pending: 'Pendiente',
    processing: 'En proceso',
    completed: 'Completado',
    rejected: 'Rechazado',
    failed: 'Fallido',
  };
  const safeStatus = status as keyof typeof styles;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[safeStatus]}`}>
      {labels[safeStatus]}
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

function ScreeningDetails({ screening }: { screening: ScreeningSummary }) {
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
            {screening.fraudFlags.map((flag, idx: number) => (
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
                {screening.explanation.topPositiveFactors.map((factor, idx: number) => (
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
                {screening.explanation.topNegativeFactors.map((factor, idx: number) => (
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
