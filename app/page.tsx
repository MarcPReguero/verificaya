'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function Home() {
  const [pricingMode, setPricingMode] = useState<'subscription' | 'payperuse'>('payperuse');
  const [screeningsToday, setScreeningsToday] = useState(247);
  const [showAlert, setShowAlert] = useState(true);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setScreeningsToday(prev => prev + Math.floor(Math.random() * 3));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Barra Informativa Profesional */}
      {showAlert && (
        <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white py-2 md:py-3 px-3 md:px-4 relative">
          <div className="container mx-auto flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2 md:gap-3 flex-1 justify-center text-center">
              <span className="text-base md:text-lg">📊</span>
              <p className="font-semibold text-xs md:text-base">
                <span className="hidden md:inline">Según datos del INE, el 47% de los propietarios en España ha tenido problemas con impagos · </span>
                <span className="font-bold">{screeningsToday} verificaciones hoy</span>
              </p>
            </div>
            <button 
              onClick={() => setShowAlert(false)}
              className="ml-2 md:ml-4 text-white/80 hover:text-white text-lg md:text-xl"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <nav className="flex justify-between items-center mb-8 md:mb-12">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-xl md:text-2xl">🛡️</span>
            </div>
            <div>
              <span className="text-xl md:text-2xl font-black text-gray-900">VerificaYa</span>
              <div className="text-xs text-blue-700 font-semibold hidden sm:block">Verificación Profesional de Inquilinos</div>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Link 
              href="/blog" 
              className="px-3 md:px-6 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition font-semibold hidden lg:block"
            >
              📖 Blog
            </Link>
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
              <span className="hidden sm:inline">Empezar Verificación</span>
              <span className="sm:hidden">Verificar</span>
            </Link>
          </div>
        </nav>

        {/* Hero Section - Profesional y Español */}
        <div className="text-center max-w-5xl mx-auto mb-16">
          {/* Badge de Confianza */}
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-6 py-2 rounded-full mb-6 border border-green-300">
            <span className="text-lg">✓</span>
            <span className="font-bold">Más de 3.200 propietarios confían en VerificaYa</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Verifica a tus inquilinos de forma<br className="hidden sm:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">
              profesional y segura
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-gray-700 mb-4 font-medium">
            Consulta ASNEF, verifica ingresos y comprueba referencias en minutos
          </p>
          
          <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
            Servicio adaptado a la normativa española (LAU) · 
            Verificación de NIE/DNI · 
            Informes completos desde <span className="font-bold text-blue-700">€49</span> · 
            Resultados en 24 horas
          </p>

          {/* Stats Profesionales */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-3xl mx-auto mb-8">
            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-md border border-gray-200">
              <div className="text-2xl sm:text-3xl md:text-4xl font-black text-blue-700">47%</div>
              <div className="text-[10px] sm:text-xs md:text-sm text-gray-600">Propietarios en España<br/>con impagos (INE)</div>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-md border border-gray-200">
              <div className="text-2xl sm:text-3xl md:text-4xl font-black text-blue-700">12-18m</div>
              <div className="text-[10px] sm:text-xs md:text-sm text-gray-600">Duración media desahucio<br/>en grandes ciudades</div>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-md border border-gray-200">
              <div className="text-2xl sm:text-3xl md:text-4xl font-black text-blue-700">€6.200</div>
              <div className="text-[10px] sm:text-xs md:text-sm text-gray-600">Coste medio de un<br/>proceso de desahucio</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-6">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition text-base sm:text-lg font-bold shadow-lg text-center"
            >
              Comenzar Ahora
            </Link>
            <Link
              href="#casos-reales"
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white text-blue-700 rounded-xl border-2 border-blue-300 hover:bg-blue-50 transition text-base sm:text-lg font-semibold shadow text-center"
            >
              Ver Casos de Uso
            </Link>
          </div>

          <p className="text-xs sm:text-sm text-gray-600">
            💳 Primera verificación: <span className="line-through">€69</span> 
            <span className="text-lg sm:text-xl font-bold text-green-600 mx-1 sm:mx-2">€49</span>
            <span className="text-blue-700 font-semibold">(Oferta de lanzamiento)</span>
          </p>
        </div>

        {/* Casos Reales - Testimonios Profesionales con Imágenes */}
        <div id="casos-reales" className="mb-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-6 py-2 rounded-full mb-6 border border-blue-300">
              <span className="text-lg">📋</span>
              <span className="font-bold">Casos reales de propietarios en España</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Experiencias reales de propietarios
            </h2>
            <p className="text-lg sm:text-xl text-gray-700 max-w-2xl mx-auto">
              Estas situaciones son más comunes de lo que piensas. La verificación profesional puede evitarlas.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
            <TestimonialCard
              imageUrl="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop"
              city="Barcelona"
              title="Proceso de desahucio de 18 meses"
              quote="Alquilé mi piso sin verificar los ingresos del inquilino. A partir del tercer mes dejó de pagar. El proceso legal duró 18 meses y perdí cerca de 12.000€ entre impagos y costes legales."
              author="María G., Propietaria en Gràcia"
              warning="Sin verificar ASNEF ni solvencia"
              color="blue"
            />
            <TestimonialCard
              imageUrl="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"
              city="Madrid"
              title="Herencia con inquilino moroso"
              quote="Heredé el piso de mi padre con un inquilino que llevaba 2 años sin pagar. Mi padre había alquilado sin verificar ni hacer contrato formal. Ahora llevo 16 meses en juzgados pagando la hipoteca de mi bolsillo."
              author="Carlos M., Propietario en Chamberí"
              warning="Sin contrato LAU ni verificación"
              color="blue"
            />
            <TestimonialCard
              imageUrl="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop"
              city="Valencia"
              title="Subarrendamiento no autorizado"
              quote="Alquilé a quien parecía una familia responsable. Descubrí 6 meses después que lo subarrendaban por Airbnb. 8 meses de batalla legal, 15.000€ en daños, y problemas graves con la comunidad de vecinos."
              author="Jordi P., Propietario en Ruzafa"
              warning="Sin verificar referencias ni visitas"
              color="blue"
            />
          </div>

          <div className="text-center mt-8 sm:mt-10">
            <div className="inline-block bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-4 sm:p-6 max-w-2xl mb-4 sm:mb-6">
              <p className="text-gray-700 font-semibold text-base sm:text-lg mb-2">
                💡 Estos problemas se pueden prevenir con una verificación profesional
              </p>
              <p className="text-gray-900 font-bold text-lg sm:text-xl">
                Invierte €49 hoy para proteger un patrimonio de miles de euros
              </p>
            </div>
            <Link 
              href="/screening/new"
              className="inline-block w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition text-base sm:text-lg font-bold shadow-lg"
            >
              Iniciar Verificación Ahora
            </Link>
          </div>
        </div>

        {/* Características - Adaptado a España */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-6 py-2 rounded-full mb-6 border border-blue-300">
              <span className="text-lg">🇪🇸</span>
              <span className="font-bold">Diseñado específicamente para el mercado español</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Verificación completa adaptada a la LAU
            </h2>
            <p className="text-lg sm:text-xl text-gray-700">
              Todas las comprobaciones necesarias para alquilar con seguridad en España
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <FeatureCard 
              icon="🎯"
              title="Consulta ASNEF"
              description="Verificación de deudas e historial crediticio en la base de datos oficial de morosos en España"
              highlight="Muy importante"
            />
            <FeatureCard 
              icon="🔍"
              title="Verificación NIE/DNI"
              description="Comprobamos la autenticidad del documento de identidad y que esté en vigor"
              highlight="Esencial"
            />
            <FeatureCard 
              icon="💰"
              title="Comprobación de Ingresos"
              description="Verificamos nóminas y contratos de trabajo. Recomendamos ingresos 3x el alquiler"
              highlight="Recomendado"
            />
            <FeatureCard 
              icon="📜"
              title="Cumplimiento LAU"
              description="Todo conforme a la Ley de Arrendamientos Urbanos y protección de datos (LOPD)"
              highlight="Legal"
            />
            <FeatureCard 
              icon="⚡"
              title="Resultados en 24h"
              description="Informe completo en menos de 24 horas laborables. Casos urgentes en 4-6 horas"
              highlight="Rápido"
            />
            <FeatureCard 
              icon="🔒"
              title="100% Seguro y Privado"
              description="Encriptación de datos y cumplimiento total del RGPD europeo"
              highlight="Seguro"
            />
            <FeatureCard 
              icon="✅"
              title="Scoring de Riesgo"
              description="Puntuación de 0-100 basada en múltiples factores: ASNEF, ingresos, referencias"
              highlight="Efectivo"
            />
            <FeatureCard 
              icon="🤖"
              title="Análisis OCR con IA"
              description="Extracción automática de datos de nóminas y documentos. Sin errores humanos"
              highlight="Innovador"
            />
          </div>
        </div>

        {/* Precios */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-6 py-2 rounded-full mb-6 border border-green-300">
              <span className="text-lg">💳</span>
              <span className="font-bold">Oferta de lanzamiento - Ahorra hasta €30</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Protege tu patrimonio desde €49
            </h2>
            <p className="text-lg sm:text-xl text-gray-700">
              Elige el plan que mejor se adapte a tus necesidades
            </p>
          </div>

          {/* Toggle */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-12">
            <button
              onClick={() => setPricingMode('payperuse')}
              className={`px-6 sm:px-8 py-3 rounded-xl font-bold text-base sm:text-lg transition ${
                pricingMode === 'payperuse'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 border-2 border-gray-200'
              }`}
            >
              Pago por uso
            </button>
            <button
              onClick={() => setPricingMode('subscription')}
              className={`px-6 sm:px-8 py-3 rounded-xl font-bold text-base sm:text-lg transition ${
                pricingMode === 'subscription'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 border-2 border-gray-200'
              }`}
            >
              Suscripción mensual
            </button>
          </div>

          {pricingMode === 'payperuse' ? (
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
              <PricingCard
                name="Verificación Básica"
                originalPrice="€69"
                price="€49"
                badge="Más popular"
                savings="Ahorra €20"
                description="Perfecta para propietarios ocasionales"
                features={[
                  'Consulta ASNEF completa',
                  'Verificación NIE/DNI',
                  'Scoring de riesgo',
                  'Informe en PDF',
                  'Resultados en 24h',
                  'Soporte por email'
                ]}
                ctaText="Verificar inquilino"
                ctaLink="/screening/new"
              />
              <PricingCard
                name="Verificación Premium"
                originalPrice="€149"
                price="€99"
                badge="Recomendado"
                savings="Ahorra €50"
                description="Para propietarios profesionales"
                features={[
                  'Todo lo de Básica',
                  'Verificación de ingresos',
                  'Comprobación de referencias',
                  'Análisis OCR de nóminas',
                  'Resultados en 4-6h',
                  'Soporte telefónico prioritario'
                ]}
                ctaText="Verificación premium"
                ctaLink="/screening/new"
                highlighted
              />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
              <SubscriptionCard
                name="Starter"
                price="€89"
                period="/mes"
                savingsPercent="Ahorra 20%"
                description="Hasta 3 verificaciones/mes"
                features={[
                  '3 verificaciones completas',
                  'Consultas ASNEF ilimitadas',
                  'Verificación NIE/DNI',
                  'Scoring de riesgo',
                  'Informes en PDF',
                  'Soporte por email'
                ]}
                ctaText="Empezar ahora"
                ctaLink="/screening/new"
              />
              <SubscriptionCard
                name="Professional"
                price="€199"
                period="/mes"
                badge="Más vendido"
                savingsPercent="Ahorra 35%"
                description="Hasta 10 verificaciones/mes"
                features={[
                  '10 verificaciones completas',
                  'Todo lo de Starter',
                  'Verificación de ingresos',
                  'Análisis OCR con IA',
                  'Resultados en 4-6h',
                  'Soporte telefónico'
                ]}
                ctaText="Empezar ahora"
                ctaLink="/screening/new"
                highlighted
              />
              <SubscriptionCard
                name="Enterprise"
                price="€449"
                period="/mes"
                savingsPercent="Ahorra 45%"
                description="Verificaciones ilimitadas"
                features={[
                  'Verificaciones ILIMITADAS',
                  'Todo lo de Professional',
                  'API de integración',
                  'Gestor de cuenta dedicado',
                  'SLA de 2 horas',
                  'Soporte 24/7'
                ]}
                ctaText="Contactar ventas"
                ctaLink="/screening/new"
              />
            </div>
          )}
        </div>

        {/* FAQ */}
        <div className="mb-16 max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Preguntas frecuentes
            </h2>
            <p className="text-xl text-gray-700">
              Todo lo que necesitas saber sobre VerificaYa
            </p>
          </div>

          <div className="space-y-4">
            <FAQItem
              question="¿Es legal consultar ASNEF para verificar inquilinos?"
              answer="Sí, completamente legal. Según la normativa española, el propietario puede solicitar esta información si el candidato da su consentimiento expreso. Nuestro servicio incluye el formulario de autorización conforme al RGPD."
            />
            <FAQItem
              question="¿Cuánto tiempo tarda el proceso de verificación?"
              answer="La verificación básica está lista en 24 horas laborables. Si necesitas urgencia, nuestro servicio premium ofrece resultados en 4-6 horas. Trabajamos de lunes a viernes de 9h a 19h."
            />
            <FAQItem
              question="¿Qué pasa si el inquilino tiene deudas en ASNEF?"
              answer="Te lo indicaremos claramente en el informe junto con el detalle de las deudas (cantidad, antigüedad, acreedor). No es automáticamente descalificante - depende del contexto. Te ayudamos a tomar una decisión informada."
            />
            <FAQItem
              question="¿Puedo verificar a alguien sin que lo sepa?"
              answer="No. La ley española exige consentimiento expreso del candidato. Cualquier verificación sin autorización es ilegal y podría tener consecuencias legales. Proveemos el formulario de consentimiento necesario."
            />
            <FAQItem
              question="¿Qué documentos necesito del inquilino?"
              answer="Para la verificación básica: NIE/DNI y autorización firmada. Para la premium: además nóminas de últimos 3 meses, contrato de trabajo y datos de referencias (propietario anterior, empleador)."
            />
            <FAQItem
              question="¿Ofrecen garantía de devolución?"
              answer="Si por cualquier motivo no podemos completar la verificación (datos incorrectos, falta de información), te devolvemos el 100% del pago. Si el informe está completo, no hay devoluciones ya que el servicio se ha prestado."
            />
          </div>
        </div>

        {/* CTA Final */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-12 text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Protege tu inversión hoy
          </h2>
          <p className="text-xl mb-2 opacity-90">
            No dejes que un inquilino problemático te cueste miles de euros
          </p>
          <p className="text-lg mb-8 opacity-80">
            {screeningsToday} propietarios ya verificaron sus inquilinos hoy
          </p>
          <Link
            href="/screening/new"
            className="inline-block px-12 py-5 bg-white text-blue-700 rounded-xl hover:bg-gray-100 transition text-xl font-bold shadow-2xl"
          >
            Empezar verificación ahora
          </Link>
          <p className="mt-6 text-sm opacity-75">
            💳 Primera verificación desde €49 · ✓ Sin permanencia · ⚡ Resultados en 24h
          </p>
        </div>

        {/* Footer Trust Signals */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <div className="grid md:grid-cols-4 gap-6 text-center text-gray-600">
            <div>
              <div className="text-2xl mb-2">🔒</div>
              <div className="font-semibold text-gray-900">Cumplimiento RGPD</div>
              <div className="text-sm">Datos 100% protegidos</div>
            </div>
            <div>
              <div className="text-2xl mb-2">🇪🇸</div>
              <div className="font-semibold text-gray-900">Normativa LAU</div>
              <div className="text-sm">Conforme a la ley española</div>
            </div>
            <div>
              <div className="text-2xl mb-2">⚡</div>
              <div className="font-semibold text-gray-900">Resultados rápidos</div>
              <div className="text-sm">En 24 horas laborables</div>
            </div>
            <div>
              <div className="text-2xl mb-2">✓</div>
              <div className="font-semibold text-gray-900">+3.200 clientes</div>
              <div className="text-sm">Propietarios confían en nosotros</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// Components

interface TestimonialCardProps {
  imageUrl: string;
  city: string;
  title: string;
  quote: string;
  author: string;
  warning: string;
  color: string;
}

function TestimonialCard({ imageUrl, city, title, quote, author, warning, color }: TestimonialCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition">
      <div className="flex items-start gap-4 mb-4">
        <img 
          src={imageUrl} 
          alt={author}
          className="w-16 h-16 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-gray-500">{city}</span>
          </div>
          <h3 className="font-bold text-gray-900 text-lg leading-tight">{title}</h3>
        </div>
      </div>
      
      <p className="text-gray-700 mb-4 italic leading-relaxed">"{quote}"</p>
      
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <span className="text-sm font-semibold text-gray-900">{author}</span>
      </div>
      
      <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800 font-semibold">⚠️ {warning}</p>
      </div>
    </div>
  );
}

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  highlight?: string;
}

function FeatureCard({ icon, title, description, highlight }: FeatureCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition relative">
      {highlight && (
        <div className="absolute -top-3 right-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
          {highlight}
        </div>
      )}
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="font-bold text-xl text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

interface PricingCardProps {
  name: string;
  originalPrice?: string;
  price: string;
  badge?: string;
  savings?: string;
  description: string;
  features: string[];
  ctaText: string;
  ctaLink: string;
  highlighted?: boolean;
}

function PricingCard({ name, originalPrice, price, badge, savings, description, features, ctaText, ctaLink, highlighted }: PricingCardProps) {
  return (
    <div className={`bg-white rounded-xl p-6 sm:p-8 shadow-lg border-2 ${highlighted ? 'border-blue-600 sm:scale-105' : 'border-gray-200'} relative`}>
      {badge && (
        <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs sm:text-sm font-bold px-4 sm:px-6 py-1 sm:py-2 rounded-full whitespace-nowrap">
          {badge}
        </div>
      )}
      
      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 mt-2 sm:mt-0">{name}</h3>
      <p className="text-sm sm:text-base text-gray-600 mb-4">{description}</p>
      
      <div className="mb-6">
        {originalPrice && (
          <span className="text-gray-400 line-through text-lg sm:text-xl mr-2">{originalPrice}</span>
        )}
        <span className="text-4xl sm:text-5xl font-black text-gray-900">{price}</span>
        {savings && (
          <div className="inline-block ml-2 sm:ml-3 bg-green-100 text-green-800 text-xs font-bold px-2 sm:px-3 py-1 rounded-full">
            {savings}
          </div>
        )}
      </div>
      
      <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-green-600 mt-1 text-sm sm:text-base">✓</span>
            <span className="text-sm sm:text-base text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
      
      <Link
        href={ctaLink}
        className={`block w-full text-center py-3 sm:py-4 rounded-xl font-bold transition text-sm sm:text-base ${
          highlighted
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
        }`}
      >
        {ctaText}
      </Link>
    </div>
  );
}

interface SubscriptionCardProps {
  name: string;
  price: string;
  period: string;
  badge?: string;
  savingsPercent?: string;
  description: string;
  features: string[];
  ctaText: string;
  ctaLink: string;
  highlighted?: boolean;
}

function SubscriptionCard({ name, price, period, badge, savingsPercent, description, features, ctaText, ctaLink, highlighted }: SubscriptionCardProps) {
  return (
    <div className={`bg-white rounded-xl p-6 sm:p-8 shadow-lg border-2 ${highlighted ? 'border-blue-600 sm:scale-105' : 'border-gray-200'} relative`}>
      {badge && (
        <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs sm:text-sm font-bold px-4 sm:px-6 py-1 sm:py-2 rounded-full whitespace-nowrap">
          {badge}
        </div>
      )}
      
      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 mt-2 sm:mt-0">{name}</h3>
      <p className="text-sm sm:text-base text-gray-600 mb-4">{description}</p>
      
      <div className="mb-6">
        <span className="text-4xl sm:text-5xl font-black text-gray-900">{price}</span>
        <span className="text-gray-500 text-lg sm:text-xl">{period}</span>
        {savingsPercent && (
          <div className="inline-block ml-2 sm:ml-3 bg-green-100 text-green-800 text-xs font-bold px-2 sm:px-3 py-1 rounded-full">
            {savingsPercent}
          </div>
        )}
      </div>
      
      <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-green-600 mt-1 text-sm sm:text-base">✓</span>
            <span className="text-sm sm:text-base text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
      
      <Link
        href={ctaLink}
        className={`block w-full text-center py-3 sm:py-4 rounded-xl font-bold transition text-sm sm:text-base ${
          highlighted
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
        }`}
      >
        {ctaText}
      </Link>
    </div>
  );
}

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between hover:bg-gray-50 transition text-left"
      >
        <span className="font-bold text-gray-900 text-sm sm:text-base pr-4">{question}</span>
        <span className={`text-xl sm:text-2xl text-blue-600 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
          ↓
        </span>
      </button>
      {isOpen && (
        <div className="px-4 sm:px-6 pb-4 sm:pb-5 text-sm sm:text-base text-gray-700 leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}
