# 🎯 ESTRATEGIA DE PRODUCTO - TENANT SCREENING

**Objetivo:** Crear un servicio de verificación de inquilinos que los propietarios **realmente quieran pagar**

---

## 💡 EL PROBLEMA REAL

### ¿Por qué los propietarios tienen miedo?

1. **Riesgo de impagos** (30-40% de consultas)
   - Pérdida promedio: €2,700-5,400 (3-6 meses de renta)
   - Proceso de desahucio: 6-12 meses
   - Costos legales: €1,500-3,000

2. **Inquilinos fraudulentos**
   - Documentos falsos (15% de casos)
   - Identidades robadas
   - Historial inventado

3. **Falta de información**
   - No saben cómo verificar
   - No tienen tiempo
   - No tienen acceso a bases de datos

4. **Miedo a discriminar**
   - Legislación antidiscriminación
   - Necesitan criterios objetivos
   - Documentación del proceso

---

## 💰 PROPUESTA DE VALOR

### ¿Por qué pagarían €59-99?

**Porque evitan perder €3,000-10,000** en:
- Impagos
- Desahucios
- Daños a la propiedad
- Costos legales
- Tiempo perdido

**ROI:** Si 1 de cada 10 verificaciones previene un mal inquilino:
- Costo: €99
- Ahorro: €5,000 promedio
- **ROI: 50x** 🎯

---

## 🔍 LO QUE REALMENTE NECESITAN

### Features que generan conversión (por orden de importancia):

#### 1. **VERIFICACIÓN DE IDENTIDAD** (Critical) ⭐⭐⭐⭐⭐
**Por qué pagan:** 15% de documentos son falsos

**Implementación:**
- **OCR de documento** (Google Vision API, AWS Textract)
  - Extrae datos automáticamente
  - Detecta manipulaciones
  - Verifica holograma/marca de agua
  - Costo: €0.001-0.005 por documento

- **Validación con bases oficiales**
  - API del Ministerio (si disponible)
  - Servicios privados (Veridas, Onfido)
  - Costo: €1-3 por verificación

- **Selfie + liveness detection**
  - Foto en vivo del inquilino
  - Comparación facial con documento
  - Previene suplantación
  - Costo: €0.50-1.50

**Valor percibido:** ⭐⭐⭐⭐⭐ (máximo)

---

#### 2. **HISTORIAL CREDITICIO** (Critical) ⭐⭐⭐⭐⭐
**Por qué pagan:** Predictor #1 de impagos

**Implementación:**
- **ASNEF** (España)
  - Base de datos de morosos
  - API disponible
  - Costo: €2-5 por consulta
  - https://www.asnef.com

- **Experian España**
  - Score crediticio completo
  - Historial de préstamos
  - Costo: €3-8 por consulta

- **Equifax España**
  - Alternativa a Experian
  - Datos similares
  - Costo: €3-8 por consulta

**Datos que obtienes:**
- Deudas actuales
- Historial de impagos
- Préstamos activos
- Score de 0-1000

**Valor percibido:** ⭐⭐⭐⭐⭐

---

#### 3. **VERIFICACIÓN DE INGRESOS** (High) ⭐⭐⭐⭐
**Por qué pagan:** Asegurar capacidad de pago

**Implementación:**

**Opción A - Automática (ideal):**
- Conexión bancaria API (Plaid, Tink, Fintonic)
  - Acceso con consentimiento
  - Últimos 3-6 meses de movimientos
  - Identifica ingresos recurrentes
  - Costo: €0.50-2 por conexión

**Opción B - Semi-automática:**
- Upload de nóminas PDF
- OCR para extraer datos
  - Empresa
  - Salario neto
  - Fecha de pago
  - Antigüedad
- Validación de formato oficial
- Costo: €0.01 por página

**Opción C - Manual (fallback):**
- Usuario sube documentos
- Tú revisas manualmente
- Cobras más (€99 vs €59)

**Datos clave:**
- Ingresos mensuales netos
- Estabilidad (6+ meses)
- Descuentos (embargos)
- Bonos/extras

**Valor percibido:** ⭐⭐⭐⭐

---

#### 4. **REFERENCIAS DE ANTIGUOS PROPIETARIOS** (Medium) ⭐⭐⭐
**Por qué pagan:** Comportamiento pasado predice futuro

**Implementación:**

**Automática:**
- Email/SMS al propietario anterior
- Formulario con 10 preguntas:
  - ¿Pagaba puntualmente? (1-5)
  - ¿Dejó la propiedad en buen estado? (1-5)
  - ¿Avisó con antelación? (Sí/No)
  - ¿Hubo quejas de vecinos? (Sí/No)
  - ¿Volvería a alquilarle? (Sí/No)
- Verificación de identidad del propietario
- Autenticación de respuesta

**Puntuación:**
- 5/5 en todo: +20 puntos
- Respuestas negativas: -5 a -20 puntos

**Valor percibido:** ⭐⭐⭐

---

#### 5. **VERIFICACIÓN LABORAL** (Medium) ⭐⭐⭐
**Por qué pagan:** Estabilidad = capacidad de pago

**Implementación:**

**Opción A - Con consentimiento:**
- Llamada/email a RRHH de empresa
- Verifican:
  - Antigüedad
  - Puesto
  - Rango salarial (opcional)
  - Contrato (temporal/indefinido)

**Opción B - Documentación:**
- Upload de contrato laboral
- Verificación de formato
- Búsqueda de empresa en registros oficiales
- Check de que empresa existe

**Datos clave:**
- Tipo de contrato
- Antigüedad
- Sector (estable vs volátil)
- Tamaño empresa

**Valor percibido:** ⭐⭐⭐

---

#### 6. **BÚSQUEDA EN REDES/INTERNET** (Low-Medium) ⭐⭐
**Por qué pagan:** Red flags públicas

**Implementación:**
- Google search del nombre
- LinkedIn (verificar empleo)
- Redes sociales públicas
- Noticias/artículos
- Registros judiciales públicos

**Red flags:**
- Denuncias públicas
- Artículos negativos
- Inconsistencias en LinkedIn vs CV

**Valor percibido:** ⭐⭐

---

## 📊 ALGORITMO DE SCORING MEJORADO

### Puntuación de 0-100 puntos

```javascript
const calculateScore = (data) => {
  let score = 0;
  
  // 1. IDENTIDAD (25 puntos) ⭐⭐⭐⭐⭐
  if (data.identity.verified) score += 15;
  if (data.identity.photoMatch) score += 10;
  // Si falla: -50 puntos (descalifica)
  
  // 2. CRÉDITO (25 puntos) ⭐⭐⭐⭐⭐
  if (data.credit.score >= 800) score += 25;
  else if (data.credit.score >= 600) score += 15;
  else if (data.credit.score >= 400) score += 5;
  if (data.credit.hasDebt) score -= 20;
  
  // 3. INGRESOS (20 puntos) ⭐⭐⭐⭐
  const ratio = data.income / data.rent;
  if (ratio >= 4) score += 20;        // Ideal
  else if (ratio >= 3) score += 15;   // Bueno
  else if (ratio >= 2.5) score += 10; // Aceptable
  else if (ratio >= 2) score += 5;    // Justo
  else score -= 10;                    // Riesgo alto
  
  // 4. EMPLEO (15 puntos) ⭐⭐⭐
  if (data.employment.verified) score += 10;
  if (data.employment.permanent) score += 5;
  if (data.employment.seniority >= 12) score += 5;
  else if (data.employment.seniority >= 6) score += 3;
  
  // 5. REFERENCIAS (10 puntos) ⭐⭐⭐
  if (data.references.avgRating >= 4.5) score += 10;
  else if (data.references.avgRating >= 3.5) score += 5;
  if (data.references.complaints) score -= 15;
  
  // 6. BÚSQUEDA PÚBLICA (5 puntos) ⭐⭐
  if (data.background.clean) score += 5;
  if (data.background.redFlags) score -= 20;
  
  return Math.max(0, Math.min(100, score));
};
```

### Interpretación:

- **80-100:** ✅ **APROBADO** - Riesgo bajo
  - Identidad verificada
  - Sin deudas
  - Ingresos 3x+ renta
  - Empleo estable
  - Referencias excelentes

- **60-79:** ⚠️ **APROBADO CON RESERVAS** - Riesgo medio
  - Algún factor débil
  - Considerar fianza mayor
  - Avalista recomendado

- **0-59:** ❌ **NO APROBADO** - Riesgo alto
  - Factores críticos fallados
  - Historial crediticio malo
  - Ingresos insuficientes

---

## 📄 INFORME PDF PROFESIONAL

### Estructura del reporte:

```
┌─────────────────────────────────────────┐
│  INFORME DE VERIFICACIÓN DE INQUILINO   │
│  TenantScreen                            │
└─────────────────────────────────────────┘

DATOS DEL INQUILINO
─────────────────────────────────────
Nombre: Juan Pérez Martínez
DNI: 12345678A ✅ VERIFICADO
Fecha: 13/10/2025

PUNTUACIÓN GLOBAL: 85/100 ✅ APROBADO
─────────────────────────────────────
┌─────────────────────────────────────┐
│         [Círculo verde 85]          │
│                                     │
│        RIESGO BAJO                  │
└─────────────────────────────────────┘

DESGLOSE DE VERIFICACIONES
─────────────────────────────────────

1. IDENTIDAD (25/25) ✅
   • Documento verificado: DNI 12345678A
   • Autenticidad: CONFIRMADA
   • Coincidencia facial: 98%
   • Estado: VÁLIDO

2. HISTORIAL CREDITICIO (20/25) ⚠️
   • Score: 720/1000
   • Deudas actuales: €0
   • Impagos históricos: 0
   • Recomendación: APROBAR

3. INGRESOS (18/20) ✅
   • Ingresos netos: €2,500/mes
   • Renta solicitada: €900/mes
   • Ratio: 2.78x (BUENO)
   • Estabilidad: 6+ meses

4. SITUACIÓN LABORAL (15/15) ✅
   • Empresa: Acme Corp SL
   • Contrato: INDEFINIDO
   • Antigüedad: 2 años
   • Verificado: SÍ

5. REFERENCIAS (8/10) ✅
   • Propietario anterior: María García
   • Calificación: 4.5/5
   • Comentario: "Excelente inquilino"
   • Verificado: SÍ

6. BÚSQUEDA PÚBLICA (5/5) ✅
   • Registros judiciales: LIMPIOS
   • Redes sociales: CONSISTENTE
   • Empleador verificado: SÍ

─────────────────────────────────────
ANÁLISIS DE RIESGO
─────────────────────────────────────

FACTORES POSITIVOS:
✅ Identidad 100% verificada
✅ Sin historial de impagos
✅ Ingresos estables 2.78x renta
✅ Contrato indefinido
✅ Referencias excelentes

FACTORES DE ATENCIÓN:
⚠️ Score crediticio medio (720)
   Recomendación: Solicitar fianza estándar

FACTORES NEGATIVOS:
❌ Ninguno detectado

─────────────────────────────────────
RECOMENDACIÓN FINAL
─────────────────────────────────────

✅ APROBAR SOLICITUD

Este inquilino cumple con todos los criterios
de verificación y presenta un perfil de 
RIESGO BAJO.

Condiciones sugeridas:
• Fianza: 2 meses (estándar)
• Duración contrato: 1+ año
• Aval: No necesario

─────────────────────────────────────
VALIDEZ Y CERTIFICACIÓN
─────────────────────────────────────

Informe ID: 13853065-a374-46c5
Fecha: 13 de Octubre 2025, 21:00h
Válido por: 30 días

Verificaciones realizadas:
✅ Identidad (API oficial)
✅ Crédito (ASNEF)
✅ Ingresos (Documentación)
✅ Empleo (Verificado)
✅ Referencias (Contactadas)

─────────────────────────────────────

DISCLAIMER:
Este informe se basa en la información 
proporcionada y las bases de datos consultadas
en la fecha indicada. TenantScreen no se hace
responsable de información falsa proporcionada
por el solicitante.

© 2025 TenantScreen - tenantscreen.com
```

---

## 💰 MODELO DE PRICING OPTIMIZADO

### Paquetes ajustados al valor real:

#### **BÁSICO - €79** (aumentar de €59)
**Tiempo:** 24-48h
- ✅ Verificación de identidad (OCR + validación)
- ✅ Consulta ASNEF (historial de impagos)
- ✅ Ratio ingresos/renta
- ✅ Informe PDF básico
- ✅ Score 0-100

**Para:** Propietarios individuales, rentas <€1,000

---

#### **COMPLETO - €149** (aumentar de €99)
**Tiempo:** 48-72h
- ✅ Todo lo del Básico +
- ✅ Verificación de empleo
- ✅ Referencias antiguo propietario
- ✅ Búsqueda en registros públicos
- ✅ Score crediticio completo (Experian)
- ✅ Informe PDF detallado (10+ páginas)
- ✅ Soporte prioritario

**Para:** Propietarios profesionales, rentas >€1,000

---

#### **PREMIUM - €249**
**Tiempo:** 24-48h (express)
- ✅ Todo lo del Completo +
- ✅ Verificación bancaria (6 meses)
- ✅ Entrevista telefónica con inquilino
- ✅ Verificación de referencias laborales
- ✅ Análisis de redes sociales
- ✅ Garantía de satisfacción
- ✅ Revisión por experto humano
- ✅ Soporte 24/7

**Para:** Propiedades de lujo, rentas >€2,000

---

### Suscripciones para inmobiliarias:

#### **PROFESSIONAL - €199/mes**
- 5 verificaciones completas
- €119 adicionales (40% descuento)
- Dashboard con histórico
- Exportación a Excel
- API básica

**Para:** Inmobiliarias pequeñas (10-50 propiedades)

---

#### **BUSINESS - €449/mes**
- 15 verificaciones completas
- €99 adicionales (50% descuento)
- Todo lo de Professional +
- White label (tu marca)
- Integración CRM
- Gestor de cuenta

**Para:** Inmobiliarias medianas (50-200 propiedades)

---

#### **ENTERPRISE - €999/mes**
- 50 verificaciones completas
- €79 adicionales (60% descuento)
- Todo lo de Business +
- API completa
- Webhooks
- SLA 99.9%
- Soporte dedicado
- Customización

**Para:** Grandes inmobiliarias/portales (200+ propiedades)

---

## 🎯 ROADMAP DE IMPLEMENTACIÓN

### FASE 1 - MVP MEJORADO (2-3 semanas) 🚀
**Objetivo:** Versión pagable mínima

✅ **Ya tienes:**
- Formulario funcional
- Base de datos
- PDFs básicos
- Scoring simple

🔨 **Necesitas agregar:**

1. **OCR de documentos** (1 semana)
   - Integrar Google Vision API
   - Extraer datos de DNI/NIE/Pasaporte
   - Validar formato
   - Detectar manipulaciones básicas

2. **Consulta ASNEF** (3 días)
   - Crear cuenta en ASNEF
   - Integrar API
   - Mostrar deudas en informe

3. **Informe PDF profesional** (3 días)
   - Diseño con branding
   - Logo + colores corporativos
   - Gráficos (círculo de score)
   - Secciones detalladas
   - Disclaimer legal

4. **Stripe funcionando** (2 días)
   - Productos configurados
   - Checkout pages
   - Webhooks
   - Test mode completo

**Resultado:** Producto vendible €79-149

---

### FASE 2 - VERIFICACIONES AVANZADAS (3-4 semanas)
**Objetivo:** Aumentar conversión y precio

1. **Verificación de empleo** (1 semana)
   - Email automático a RRHH
   - Formulario de verificación
   - Upload de contrato laboral
   - OCR de contrato

2. **Referencias de propietarios** (1 semana)
   - Email/SMS automatizado
   - Formulario con preguntas
   - Validación de identidad
   - Integración en informe

3. **Score crediticio completo** (1 semana)
   - Integrar Experian API
   - Mostrar score 0-1000
   - Desglose de factores
   - Historial de préstamos

4. **Verificación facial** (3 días)
   - Selfie en vivo
   - Comparación con documento
   - Liveness detection
   - Integrar Onfido o similar

**Resultado:** Paquete Completo €149 justificado

---

### FASE 3 - AUTOMATIZACIÓN (2-3 semanas)
**Objetivo:** Escalar sin costos proporcionales

1. **Open Banking** (1 semana)
   - Integrar Plaid/Tink
   - Verificación de ingresos automática
   - Análisis de movimientos
   - Patrones de gasto

2. **Verificación laboral automática** (1 semana)
   - APIs de empresas grandes
   - LinkedIn verification
   - Registro mercantil

3. **Background check** (3 días)
   - Scraping de registros públicos
   - Google search automation
   - Social media analysis

4. **Email notifications** (2 días)
   - Resend integration
   - Templates profesionales
   - Updates automáticos

**Resultado:** Proceso 80% automático

---

### FASE 4 - ESCALA (1 mes)
**Objetivo:** Captar inmobiliarias

1. **Dashboard para inmobiliarias**
   - Vista de todos los screenings
   - Filtros y búsqueda
   - Exportar a Excel
   - Métricas y estadísticas

2. **API para partners**
   - REST API completa
   - Webhooks
   - Documentación
   - SDKs (JS, Python)

3. **White label**
   - Personalizar branding
   - Custom domain
   - Email desde su dominio

4. **Integraciones**
   - Zapier
   - CRMs inmobiliarios
   - Portales (Idealista, Fotocasa)

**Resultado:** Suscripciones €199-999/mes

---

## 📈 PROYECCIONES FINANCIERAS

### Escenario Conservador (Año 1):

**Mes 1-3 (MVP):**
- 10 screenings/mes × €79 = €790/mes
- Costos APIs: €30/mes
- **Profit: €760/mes**

**Mes 4-6 (Verificaciones avanzadas):**
- 30 screenings/mes × €120 promedio = €3,600/mes
- Costos APIs: €150/mes
- **Profit: €3,450/mes**

**Mes 7-9 (Primera inmobiliaria):**
- 50 screenings/mes × €120 = €6,000/mes
- 1 suscripción Professional = €199/mes
- Costos APIs: €300/mes
- **Profit: €5,899/mes**

**Mes 10-12 (Tracción):**
- 100 screenings/mes × €120 = €12,000/mes
- 3 suscripciones (€199+€449+€199) = €847/mes
- Costos APIs: €600/mes
- **Profit: €12,247/mes**

**Total Año 1:** €73,482 profit

---

### Escenario Optimista (Año 2):

**Con 5 inmobiliarias + tráfico orgánico:**
- 300 screenings/mes × €130 = €39,000/mes
- 5 suscripciones = €2,245/mes
- Costos APIs: €1,800/mes
- **Profit: €39,445/mes = €473,340/año**

---

## 🎯 ESTRATEGIA GO-TO-MARKET

### 1. **PRIMEROS 10 CLIENTES** (validación)

**Cómo conseguirlos:**
- Facebook grupos de propietarios
- Idealista foros
- LinkedIn propietarios
- Cold email inmobiliarias pequeñas

**Oferta irresistible:**
- Primer screening: **GRATIS**
- Siguiente: 50% descuento
- A cambio: Testimonial + feedback

**Objetivo:** Validar producto y obtener casos de éxito

---

### 2. **PRIMERAS 3 INMOBILIARIAS** (recurring revenue)

**Target:**
- 20-100 propiedades
- Sin sistema actual
- Tuvieron mal inquilino reciente

**Oferta:**
- Mes 1: GRATIS (5 screenings)
- Mes 2-3: 50% descuento
- Setup personalizado
- Training incluido

**Pitch:**
"Tuviste un impago de €4,000 el año pasado.
Por €199/mes puedes prevenirlo. ROI 20x."

---

### 3. **ESCALAR** (SEO + Partnerships)

**SEO:**
- Blog: "Cómo verificar inquilino España"
- Guías: "Evitar impagos alquiler"
- Calculadora: "Ratio ingresos recomendado"

**Partnerships:**
- Portales inmobiliarios (Idealista, Fotocasa)
- Seguros de impago (complementarios)
- Software de gestión (integración)

---

## ✅ CHECKLIST DE FEATURES CRÍTICAS

### Para cobrar €79 (Básico):
- [ ] OCR documento de identidad
- [ ] Consulta ASNEF
- [ ] Cálculo ratio ingresos/renta
- [ ] Informe PDF profesional
- [ ] Score 0-100
- [ ] Stripe checkout funcional
- [ ] Landing page con casos de uso

### Para cobrar €149 (Completo):
- [ ] Todo lo anterior +
- [ ] Verificación de empleo
- [ ] Referencias propietario anterior
- [ ] Score crediticio Experian
- [ ] Búsqueda registros públicos
- [ ] Informe PDF extendido (10+ páginas)
- [ ] Garantía satisfacción

### Para suscripciones €199+:
- [ ] Dashboard multi-usuario
- [ ] API básica
- [ ] Exportar a Excel
- [ ] Histórico de screenings
- [ ] Gestión de equipo

---

## 🚨 ERRORES A EVITAR

### ❌ NO HACER:

1. **Cobrar antes de tener valor real**
   - Mínimo: OCR + ASNEF + PDF profesional
   - Sin eso, es solo un formulario

2. **Competir en precio**
   - €59 es muy barato
   - Enfócate en valor: "Evita perder €5,000"

3. **Intentar automatizar TODO desde día 1**
   - Empieza semi-manual
   - Escala progresivamente

4. **Ignorar el aspecto legal**
   - GDPR compliance
   - Consentimiento explícito
   - Políticas de privacidad
   - Terms & Conditions

5. **No validar con usuarios reales**
   - Habla con 20+ propietarios
   - Pregunta: "¿Pagarías €X por esto?"
   - Ajusta según feedback

---

## 🎯 RESUMEN EJECUTIVO

### Para que paguen, necesitas:

**MÍNIMO VIABLE (€79):**
1. ✅ Documento verificado (OCR)
2. ✅ Historial de impagos (ASNEF)
3. ✅ Informe PDF profesional
4. ✅ Proceso rápido (<48h)

**VALOR PREMIUM (€149):**
5. ✅ Score crediticio completo
6. ✅ Verificación de empleo
7. ✅ Referencias verificadas
8. ✅ Garantía de exactitud

**ESCALA (€199-999/mes):**
9. ✅ Dashboard corporativo
10. ✅ Múltiples usuarios
11. ✅ API/Integraciones
12. ✅ Soporte dedicado

---

## 📞 SIGUIENTE ACCIÓN INMEDIATA

**Para empezar a generar ingresos en 2-3 semanas:**

1. **Integra OCR** (Google Vision - 3 días)
2. **Conecta ASNEF** (2 días)
3. **Mejora PDF** (2 días)
4. **Configura Stripe** (1 día)
5. **Crea landing page** con precio real (2 días)
6. **Consigue 3 clientes beta** GRATIS (1 semana)
7. **Cobra €79 al cliente #4** 🎉

---

**¿Por dónde quieres empezar? ¿OCR, ASNEF, o mejorar el PDF?** 🚀
