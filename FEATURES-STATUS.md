# Estado de Funcionalidades - TenantScreen

**Fecha:** 22 de Febrero 2026
**Versión:** 0.1.0 (MVP)
**Estado:** Desarrollo - Casi Produccion

---

## NO IMPLEMENTADAS (pendientes)

### 1. Autenticacion y gestion de usuarios
- Magic link y OAuth no estan activados
- Verificacion de email no esta integrada
- Recuperacion de password no implementada
- Roles y permisos avanzados (team/permission scopes) no implementados

**Impacto:** MEDIO

### 2. Suscripciones recurrentes
- Persistencia de suscripciones en BD (`subscriptions`) no implementada
- Trial periods, upgrades/downgrades y cancelaciones no estan implementados
- Billing portal / facturacion recurrente no existente

**Impacto:** ALTO

### 3. Analitica y mejoras de dashboard
- Paginacion, ordenamiento y filtros avanzados parcialmente implementados en dashboard
- Export CSV implementado (desde tabla); export Excel pendiente
- Reportes ejecutivos y graficos avanzados no implementados
- Métricas rápidas agregadas en vista principal (completado, tasa de completado, score medio, riesgo alto), pero no hay panel ejecutivo consolidado

**Impacto:** BAJO-MEDIO

### 4. Automatizacion y verificacion externa completa
- ASNEF/score crediticio real no conectado (simulacion actual)
- Verificacion de identidad, empleo e ingresos por APIs oficiales no implementada
- Check de referencias automatizado no existe
- OCR formal de terceros (OCR oficial) no estandarizado para produccion

**Impacto:** ALTO

### 5. Emails y notificaciones transaccionales
- Facturas y avisos automatizados no implementados
- Notificaciones de pago, reminder y reset de password no existen
- Invitaciones de tenant no existentes

**Impacto:** MEDIO

### 6. Rendimiento, seguridad y operativa
- Rate limiting y anti-abuso no implementado
- Caching general y logs de auditoria detallados no implementados
- Multi-tenancy enterprise y team management no implementados

**Impacto:** BAJO

---

## PARCIALMENTE IMPLEMENTADAS

### 1. Base de autenticacion actual
- Signup/login con email+password usando Supabase Auth
- Sesion persistente y logout funcionales
- No existe onboarding/flujo avanzado ni SSO

### 2. Pagos con Stripe
- `create-checkout` implementado (pay-per-use y subscription mode)
- Webhook con verificacion de firma (`stripe.webhooks.constructEvent`) funcionando
- Procesamiento automatico de pagos en `POST /api/screenings/[id]/process` implementado
- Falta lifecycle completo de suscripciones y facturacion recurrente

### 3. Dashboard y datos reales
- Dashboard lee `screenings` desde Supabase por `landlord_email`
- Se muestra estado, score, risk y acciones basicas
- Se incorporó paginación, filtros y ordenamiento en la tabla principal
- Falta analítica ejecutiva y export (Excel y consolidado)

### 4. Procesamiento y reportes
- Pipeline completo de scoring + generacion PDF + subida a Storage + `report_url`
- Guardado de resultados de credito simulado dentro de screening
- Envio de email de completion si Resend esta configurado

### 5. Carga de documentos (OCR)
- `DocumentUpload` analiza imagenes/pdf con proveedor OCR
- Validaciones de tipo/tamano y feedback basico implementadas
- Falta integracion final del flujo de subida/persistencia en el flujo principal del wizard

### 6. API y backoffice
- Endpoints de screening, webhook y credit-check con manejo de errores y logs
- Modo mock cuando no hay config de Supabase
- Falta limpieza de campos legacy y endurecimiento de validaciones

---

## RESUMEN EJECUTIVO

### Cobertura actual (aproximada)

| Categoria | Completado | Parcial | No implementado |
|-----------|------------|---------|-----------------|
| Frontend UI | 8 | 0 | 0 |
| Autenticacion | 2 | 3 | 4 |
| Backend API | 5 | 1 | 0 |
| Base de Datos | 2 | 2 | 1 |
| Pagos | 3 | 2 | 4 |
| Scoring | 4 | 0 | 0 |
| Notificaciones | 1 | 2 | 4 |
| Integraciones externas | 1 | 2 | 5 |

**Lectura rapida:** MVP tecnico funcional, pero faltan componentes de produccion
**Cobertura global estimada:** ~62%

---

## QUE FUNCIONA SIN CONFIGURACION ADICIONAL

1. Landing, formulario multistep y flujo de pago base
2. Pantalla dashboard con datos de Supabase
3. Pipeline de scoring + PDF + guardado en storage
4. Webhook de Stripe con verificacion de firma
5. OCR de documentos con fallback y mensaje de modo demo

---

## QUE AUN REQUIERE CONFIGURACION/DEPLOY

1. Entorno con claves reales de Stripe (checkout + webhook)
2. Configuracion de Resend para emails transaccionales
3. Flujos de suscripcion completa y gestion de ciclo de vida
4. Conectores externos reales (ASNEF y APIs oficiales) en vez de simulacion
5. Limpieza de dashboard (analytics y export Excel)

---

## PRIORIDADES RECOMENDADAS

### 1) CRITICO (bloqueante para produccion)
1. Asegurar claves y webhooks reales de Stripe + prueba end-to-end de pago
2. Ajustar `NEXT_PUBLIC_APP_URL` y dominio definitivo de webhook
3. Verificar migraciones de BD nuevas ejecutadas en entorno final
4. Definir estrategia de emails con provider y probar envio transaccional

### 2) IMPORTANTE (siguiente iteracion)
1. Completar suscripciones (tabla `subscriptions`, uso mensual, cancelaciones)
2. Integrar subida de documentos persistente en el wizard
3. Implementar recuperacion de password y verificacion email
4. Mejorar export de dashboard (Excel) y analítica ejecutiva

### 3) MEJORA
1. Roles avanzados/team management
2. Integraciones externas oficiales
3. Caching y rate limiting
4. Auditoria operativa y logs estructurados

---

## RESUMEN DE PRUEBAS EJECUTADAS

- `npm run verify-setup`: 32/32 checks passed
- `npm run lint`: 0 errors, 86 warnings (mainly `any`-typed values and unused variables)
- No se ejecutaron tests de carga o e2e porque no hay suite de pruebas automatizada dedicada en este repo

## ACTUALIZACION RECIENTE (22 de Febrero 2026)

- Se resolvió el bloqueo por error de TypeScript en `app/api/ocr/analyze/route.ts` (tipado correcto de `standardizedDocument` y normalización de `docData`).
- Se corrigió el fallo de lint/types al finalizar `npm run build`.
- Se actualizó `netlify.toml` para `NODE_VERSION=20.19.0`.
- Se actualizó dependencias de runtime para mitigar bloqueo de seguridad en deploy:
  - `next`: `15.5.4` -> `15.5.9`
  - `eslint-config-next`: `15.5.4` -> `15.5.9`
  - `react`: `19.1.0` -> `19.2.1`
  - `react-dom`: `19.1.0` -> `19.2.1`
- Commit con estos cambios: `1f74d0b`.
- Estado Netlify: el bloqueo por CVE de Next.js quedó corregido en el código/deps; se recomienda redeploy para validar que ya no rechaza subida de función.
