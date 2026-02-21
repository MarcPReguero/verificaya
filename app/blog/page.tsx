'use client';

import Link from 'next/link';
import { useState } from 'react';
import { blogPosts, blogStats } from '@/lib/data/blogPosts';

export default function BlogPage() {
  const [filtroCategoria, setFiltroCategoria] = useState<string>('Todas');

  const postsFiltrados = filtroCategoria === 'Todas' 
    ? blogPosts 
    : blogPosts.filter(p => p.categoria === filtroCategoria);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <nav className="flex justify-between items-center mb-8 md:mb-12">
          <Link href="/" className="flex items-center gap-2 md:gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-xl md:text-2xl">🛡️</span>
            </div>
            <div>
              <span className="text-xl md:text-2xl font-black text-gray-900">VerificaYa</span>
              <div className="text-xs text-blue-700 font-semibold hidden sm:block">Blog de Experiencias</div>
            </div>
          </Link>
          <div className="flex items-center gap-2 md:gap-3">
            <Link 
              href="/login" 
              className="px-3 md:px-6 py-2 border-2 border-blue-600 text-blue-700 rounded-lg hover:bg-blue-50 transition font-semibold text-sm md:text-base hidden sm:block"
            >
              Acceder
            </Link>
            <Link 
              href="/screening/new" 
              className="px-3 md:px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition font-bold shadow-lg text-sm md:text-base"
            >
              <span className="hidden sm:inline">Verificar Inquilino</span>
              <span className="sm:hidden">Verificar</span>
            </Link>
          </div>
        </nav>

        {/* Hero del Blog */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 px-6 py-2 rounded-full mb-6 border border-orange-300">
            <span className="text-lg">📖</span>
            <span className="font-bold">Experiencias reales de propietarios en España</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Blog de VerificaYa
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-700 mb-8">
            Historias reales, consejos prácticos y análisis del mercado de alquiler español. 
            Aprende de las experiencias de otros propietarios para proteger tu patrimonio.
          </p>

          {/* Stats del blog */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto">
            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-md border border-gray-200">
              <div className="text-2xl sm:text-3xl font-black text-blue-700">{blogStats.total_posts}</div>
              <div className="text-xs sm:text-sm text-gray-600">Artículos</div>
            </div>
            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-md border border-gray-200">
              <div className="text-2xl sm:text-3xl font-black text-red-600">€{(blogStats.perdida_total_documentada / 1000).toFixed(0)}k</div>
              <div className="text-xs sm:text-sm text-gray-600">Pérdidas documentadas</div>
            </div>
            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-md border border-gray-200">
              <div className="text-2xl sm:text-3xl font-black text-green-600">{blogStats.experiencias}</div>
              <div className="text-xs sm:text-sm text-gray-600">Casos reales</div>
            </div>
            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-md border border-gray-200">
              <div className="text-2xl sm:text-3xl font-black text-purple-600">{blogStats.ciudades_cubiertas}</div>
              <div className="text-xs sm:text-sm text-gray-600">Ciudades</div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="max-w-6xl mx-auto mb-12">
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-md border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-gray-700 font-semibold text-sm sm:text-base">Filtrar por:</span>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {['Todas', 'Experiencia', 'Consejo', 'Análisis', 'Legal', 'Caso de éxito'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFiltroCategoria(cat)}
                  className={`px-4 sm:px-6 py-2 rounded-lg font-semibold transition text-sm sm:text-base ${
                    filtroCategoria === cat
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                  {cat !== 'Todas' && (
                    <span className="ml-2 text-xs sm:text-sm opacity-75">
                      ({cat === 'Todas' ? blogPosts.length : blogPosts.filter(p => p.categoria === cat).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid de posts */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {postsFiltrados.map((post) => (
              <BlogPostCard key={post.id} post={post} />
            ))}
          </div>

          {postsFiltrados.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No hay artículos en esta categoría todavía.</p>
            </div>
          )}
        </div>

        {/* CTA Final */}
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-white">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            No cometas los mismos errores
          </h2>
          <p className="text-base sm:text-xl mb-6 sm:mb-8 opacity-90">
            Verifica a tus inquilinos profesionalmente y evita historias como estas
          </p>
          <Link
            href="/screening/new"
            className="inline-block w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 bg-white text-blue-700 rounded-xl hover:bg-gray-100 transition text-lg sm:text-xl font-bold shadow-2xl"
          >
            Verificar Inquilino Ahora
          </Link>
          <p className="mt-4 sm:mt-6 text-xs sm:text-sm opacity-75">
            💳 Desde €59 · ✓ Resultados en 24h · 🛡️ Protege tu patrimonio
          </p>
        </div>
      </div>
    </main>
  );
}

interface BlogPostCardProps {
  post: typeof blogPosts[0];
}

function BlogPostCard({ post }: BlogPostCardProps) {
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Experiencia': return 'bg-red-100 text-red-800 border-red-300';
      case 'Consejo': return 'bg-green-100 text-green-800 border-green-300';
      case 'Análisis': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Legal': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Caso de éxito': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <Link href={`/blog/${post.slug}`}>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-2xl transition group">
        {/* Imagen */}
        <div className="relative h-48 overflow-hidden">
          <img 
            src={post.imagen} 
            alt={post.titulo}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute top-4 left-4">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getCategoryColor(post.categoria)}`}>
              {post.categoria}
            </span>
          </div>
          {post.metricas.perdida_economica && (
            <div className="absolute bottom-4 right-4 bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-bold">
              -€{(post.metricas.perdida_economica / 1000).toFixed(1)}k
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
            <span>📍 {post.ciudad}</span>
            <span>•</span>
            <span>⏱️ {post.tiempo_lectura} min</span>
            <span>•</span>
            <span>📅 {new Date(post.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition line-clamp-2">
            {post.titulo}
          </h3>

          <p className="text-gray-600 mb-4 line-clamp-2">
            {post.subtitulo}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                {tag}
              </span>
            ))}
          </div>

          {/* Métricas */}
          {post.metricas.duracion_proceso && (
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Duración:</span>
                <span className="font-bold text-gray-900">{post.metricas.duracion_proceso}</span>
              </div>
            </div>
          )}

          {/* Testimonial preview */}
          {post.testimonial && (
            <div className="border-t border-gray-200 pt-4 mt-4 flex items-center gap-3">
              <img 
                src={post.testimonial.foto}
                alt={post.testimonial.nombre}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <div className="font-semibold text-sm text-gray-900">{post.testimonial.nombre}</div>
                <div className="text-xs text-gray-600">{post.testimonial.profesion}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <div className="text-blue-700 font-semibold text-sm group-hover:text-blue-800 flex items-center gap-2">
            Leer experiencia completa 
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
