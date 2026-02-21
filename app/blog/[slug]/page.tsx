'use client';

import Link from 'next/link';
import { use } from 'react';
import { blogPosts } from '@/lib/data/blogPosts';
import ReactMarkdown from 'react-markdown';

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const post = blogPosts.find(p => p.slug === slug);

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Artículo no encontrado</h1>
          <Link href="/blog" className="text-blue-700 hover:underline">
            ← Volver al blog
          </Link>
        </div>
      </div>
    );
  }

  const postsSimilares = blogPosts
    .filter(p => p.id !== post.id && (
      p.ciudad === post.ciudad || 
      p.categoria === post.categoria ||
      p.tags.some(t => post.tags.includes(t))
    ))
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <nav className="flex justify-between items-center mb-6 sm:mb-8">
          <Link href="/" className="flex items-center gap-2 md:gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-xl md:text-2xl">🛡️</span>
            </div>
            <span className="text-xl md:text-2xl font-black text-gray-900">VerificaYa</span>
          </Link>
          <Link href="/blog" className="text-blue-700 hover:underline font-semibold text-sm sm:text-base">
            ← Volver al blog
          </Link>
        </nav>

        {/* Hero del post */}
        <article className="max-w-4xl mx-auto">
          {/* Imagen destacada */}
          <div className="relative h-64 sm:h-80 md:h-96 rounded-2xl sm:rounded-3xl overflow-hidden mb-6 sm:mb-8 shadow-2xl">
            <img 
              src={post.imagen}
              alt={post.titulo}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
              <div className="p-4 sm:p-6 md:p-8 text-white w-full">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
                  <span className="px-3 sm:px-4 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs sm:text-sm font-bold border border-white/30">
                    {post.categoria}
                  </span>
                  <span className="text-xs sm:text-base">📍 {post.ciudad}</span>
                  <span className="text-xs sm:text-base">⏱️ {post.tiempo_lectura} min</span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-black mb-2 sm:mb-3 leading-tight">
                  {post.titulo}
                </h1>
                <p className="text-base sm:text-lg md:text-xl opacity-90">
                  {post.subtitulo}
                </p>
              </div>
            </div>
          </div>

          {/* Meta info */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-md border border-gray-200 mb-6 sm:mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              {/* Autor/Testimonial */}
              {post.testimonial && (
                <div className="flex items-center gap-3 sm:gap-4">
                  <img 
                    src={post.testimonial.foto}
                    alt={post.testimonial.nombre}
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-bold text-gray-900 text-base sm:text-lg">{post.testimonial.nombre}</div>
                    <div className="text-sm sm:text-base text-gray-600">{post.testimonial.profesion}</div>
                    <div className="text-xs sm:text-sm text-gray-500">{post.testimonial.edad} años</div>
                  </div>
                </div>
              )}

              {/* Métricas */}
              <div className="flex gap-4 sm:gap-6">
                {post.metricas.perdida_economica && (
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-black text-red-600">
                      €{(post.metricas.perdida_economica / 1000).toFixed(1)}k
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-600">Pérdida total</div>
                  </div>
                )}
                {post.metricas.duracion_proceso && (
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-black text-orange-600">
                      {post.metricas.duracion_proceso}
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-600">Duración</div>
                  </div>
                )}
                <div className="text-center">
                  <div className={`text-xl sm:text-2xl font-black ${
                    post.metricas.resultado === 'Positivo' ? 'text-green-600' :
                    post.metricas.resultado === 'Negativo' ? 'text-red-600' :
                    'text-orange-600'
                  }`}>
                    {post.metricas.resultado === 'Positivo' ? '✅' :
                     post.metricas.resultado === 'Negativo' ? '❌' : '⏳'}
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-600">{post.metricas.resultado}</div>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
              {post.tags.map((tag, i) => (
                <span key={i} className="px-2 sm:px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs sm:text-sm font-semibold border border-blue-200">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Contenido del post */}
          <div className="bg-white rounded-xl p-4 sm:p-8 md:p-12 shadow-md border border-gray-200 mb-6 sm:mb-8">
            <div className="prose prose-lg sm:prose-xl max-w-none 
              prose-headings:font-black prose-headings:tracking-tight
              prose-h1:text-5xl prose-h1:mb-8 prose-h1:mt-12 prose-h1:text-gray-900 prose-h1:leading-tight
              prose-h2:text-4xl prose-h2:mb-6 prose-h2:mt-12 prose-h2:text-gray-900 prose-h2:leading-tight prose-h2:border-b-4 prose-h2:border-blue-600 prose-h2:pb-3
              prose-h3:text-2xl prose-h3:mb-4 prose-h3:mt-8 prose-h3:text-gray-800 prose-h3:font-bold
              prose-h4:text-xl prose-h4:mb-3 prose-h4:mt-6 prose-h4:text-gray-700 prose-h4:font-semibold
              prose-p:text-gray-900 prose-p:mb-5 prose-p:leading-relaxed prose-p:text-lg
              prose-ul:list-none prose-ul:pl-0 prose-ul:mb-6 prose-ul:space-y-3
              prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-6 prose-ol:space-y-3
              prose-li:text-gray-900 prose-li:text-lg prose-li:pl-2
              prose-blockquote:border-l-4 prose-blockquote:border-blue-600 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-800 prose-blockquote:my-6 prose-blockquote:bg-blue-50 prose-blockquote:py-4 prose-blockquote:rounded-r-lg
              prose-strong:font-bold prose-strong:text-gray-900
              prose-em:italic prose-em:text-gray-800
              prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:text-gray-900
              prose-pre:bg-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:mb-6
              prose-a:text-blue-600 prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
              prose-hr:border-gray-300 prose-hr:my-10 prose-hr:border-t-2
              prose-img:rounded-2xl prose-img:shadow-xl prose-img:my-8
            ">
              <ReactMarkdown>
                {post.contenido}
              </ReactMarkdown>
            </div>
          </div>

          {/* CTA en el post */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white text-center mb-8 sm:mb-12">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3">
              ¿Quieres evitar esta situación?
            </h3>
            <p className="text-base sm:text-lg mb-4 sm:mb-6 opacity-90">
              Verifica a tus inquilinos profesionalmente desde €59
            </p>
            <Link
              href="/screening/new"
              className="inline-block w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 bg-white text-blue-700 rounded-xl hover:bg-gray-100 transition text-base sm:text-lg font-bold shadow-2xl"
            >
              Verificar Inquilino Ahora
            </Link>
          </div>

          {/* Posts similares */}
          {postsSimilares.length > 0 && (
            <div className="mb-8 sm:mb-12">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
                También te puede interesar
              </h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {postsSimilares.map((p) => (
                  <Link key={p.id} href={`/blog/${p.slug}`}>
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition group">
                      <div className="relative h-40 overflow-hidden">
                        <img 
                          src={p.imagen}
                          alt={p.titulo}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-700 transition">
                          {p.titulo}
                        </h4>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {p.subtitulo}
                        </p>
                        <div className="mt-3 text-blue-700 text-sm font-semibold">
                          Leer más →
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    </main>
  );
}
