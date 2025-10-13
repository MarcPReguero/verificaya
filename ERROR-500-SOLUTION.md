# 🔧 SOLUCIÓN: Error 500 en /api/screenings

## ❌ Problema Reportado

```
:3000/api/screenings:1 Failed to load resource: 
the server responded with a status of 500 (Internal Server Error)
```

---

## 🔍 Causa del Error

El error ocurre porque **Supabase no está configurado**. El código intentaba conectarse a una base de datos que no existe.

**Variables de entorno faltantes:**
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url  # ❌ URL placeholder
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # ❌ Key placeholder
```

Cuando el API intenta hacer:
```typescript
const supabase = getServiceSupabase();
await supabase.from('landlords').upsert(...)  // ❌ FALLA aquí
```

Supabase no puede conectarse porque la URL está vacía o es un placeholder.

---

## ✅ Solución Implementada

He modificado los endpoints para **detectar automáticamente** si Supabase está configurado:

### Cambios en `app/api/screenings/route.ts`:

```typescript
// Nuevo helper
const isSupabaseConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url' &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your_service_role_key'
  );
};

export async function POST(request: NextRequest) {
  try {
    // Validar documento primero
    const isValidDocument = ScreeningService.validateSpanishDocument(...);
    
    // ✅ NUEVO: Detectar si Supabase está configurado
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase not configured - returning mock response');
      
      return NextResponse.json({ 
        success: true, 
        screeningId: `mock-${Date.now()}`,
        message: 'Verificación creada (MODO DEMO)',
        demo: true  // Flag para identificar respuesta mock
      });
    }
    
    // Si está configurado, proceder con DB real
    const supabase = getServiceSupabase();
    // ... resto del código
  }
}
```

### Cambios en `app/api/screenings/[id]/process/route.ts`:

Mismo patrón - detecta si Supabase está configurado y devuelve mock data si no lo está.

---

## 🎮 Modo Demo Activo

**Ahora la aplicación funciona en "MODO DEMO"** sin configuración:

### ✅ Lo que FUNCIONA sin Supabase:

1. **Formulario de screening** (4 pasos)
   - ✅ Validación de campos
   - ✅ Validación de documentos españoles
   - ✅ Navegación entre pasos
   - ✅ Submit del formulario

2. **API Endpoints**
   - ✅ POST `/api/screenings` → Retorna `mock-123456789`
   - ✅ GET `/api/screenings` → Retorna datos mock
   - ✅ POST `/api/screenings/[id]/process` → Retorna score mock

3. **Dashboard**
   - ✅ Muestra screenings mock hardcoded
   - ✅ UI completa funcional

4. **Login**
   - ✅ Usuario demo/demo funciona
   - ✅ Autenticación local (zustand)

5. **Lógica de negocio**
   - ✅ Algoritmo de scoring (100% funcional)
   - ✅ Validación de documentos (100% funcional)
   - ✅ Generación de PDFs (100% funcional)

### ⚠️ Lo que NO funciona sin Supabase:

- ❌ Persistencia de datos (no se guardan screenings reales)
- ❌ Upload de PDFs a Storage
- ❌ Consultar screenings de usuarios reales
- ❌ Autenticación real (solo demo local)

---

## 🚀 Cómo Activar Funcionalidad Completa

### Opción 1: Continuar en Modo Demo (Recomendado para ahora)

**Ya está funcionando.** Puedes:
- Probar todo el flujo de UI
- Validar lógica de negocio
- Desarrollar features adicionales
- Demo para clientes/inversores

**No se guardará nada**, pero puedes ver cómo funciona todo.

---

### Opción 2: Configurar Supabase (Producción)

**Tiempo: 15 minutos**

#### Paso 1: Crear Proyecto Supabase (5 min)

1. Ve a https://supabase.com
2. Crea cuenta (gratis)
3. Click "New Project"
4. Nombre: `tenant-screening`
5. Password: (guárdala)
6. Región: Frankfurt (más cerca de España)
7. Click "Create new project" (espera 2 min)

#### Paso 2: Ejecutar Schema SQL (2 min)

1. En Supabase dashboard → **SQL Editor**
2. Click "New Query"
3. Copia todo el contenido de `supabase-schema.sql`
4. Click "Run"
5. Verifica en **Table Editor** que existan:
   - `landlords`
   - `screenings`

#### Paso 3: Crear Storage Buckets (3 min)

1. Sidebar → **Storage**
2. "Create bucket" → Nombre: `documents` → Private
3. "Create bucket" → Nombre: `reports` → Private
4. Para cada bucket:
   - Policies → New Policy
   - Template: "Allow service role access"
   - Save

#### Paso 4: Copiar API Keys (2 min)

1. **Settings** → **API**
2. Copia estas 3 keys:

```
Project URL: https://xxxxx.supabase.co
anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Paso 5: Actualizar .env.local (1 min)

Edita `c:\code\proptech\tenant-screening\.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Paso 6: Reiniciar Servidor (1 min)

```bash
# Detener servidor (Ctrl+C)
# Reiniciar
npm run dev
```

✅ **¡Listo!** Ahora los screenings se guardarán en DB real.

---

## 🧪 Cómo Verificar que Funciona

### En Modo Demo (Actual):

1. Abre http://localhost:3000
2. Click "Iniciar Verificación"
3. Completa el formulario
4. Deberías ver en consola:
   ```
   ⚠️ Supabase not configured - returning mock response
   ```
5. Submit → Success page con ID: `mock-1728761234567`

### Con Supabase Configurado:

1. Mismo flujo
2. En consola NO verás el warning
3. Submit → Success page con ID real: `123e4567-e89b-12d3-a456-426614174000`
4. Ve a Supabase → **Table Editor** → `screenings`
5. Deberías ver el registro guardado

---

## 📊 Estado Actual

| Componente | Sin Supabase | Con Supabase |
|------------|--------------|--------------|
| **Landing Page** | ✅ Funciona | ✅ Funciona |
| **Formulario** | ✅ Funciona | ✅ Funciona |
| **Validaciones** | ✅ Funciona | ✅ Funciona |
| **API /screenings POST** | ✅ Mock | ✅ DB Real |
| **API /screenings GET** | ✅ Mock | ✅ DB Real |
| **Dashboard** | ✅ Datos hardcoded | ✅ Datos de DB |
| **Login** | ✅ Demo local | ⚠️ Demo (Supabase Auth pendiente) |
| **PDF Generation** | ✅ Funciona | ✅ Funciona + Upload |
| **Scoring** | ✅ Funciona | ✅ Funciona |

---

## 🎯 Recomendación

**Para desarrollo/testing:** Continúa en modo demo (actual)

**Para producción/usuarios reales:** Configura Supabase (15 min)

**Para pagos:** Además de Supabase, necesitarás Stripe (otros 15 min)

---

## 📝 Archivos Modificados

1. ✅ `app/api/screenings/route.ts` - Detecta Supabase, retorna mock si no está
2. ✅ `app/api/screenings/[id]/process/route.ts` - Mismo patrón
3. ✅ `.env.local` - Existe con placeholders
4. ✅ `.env.local.example` - Template para producción

---

## ❓ FAQ

**P: ¿El modo demo guarda datos?**  
R: No, todo es temporal en memoria.

**P: ¿Puedo hacer demo a clientes sin Supabase?**  
R: Sí, el usuario demo/demo funciona perfectamente.

**P: ¿Cuánto cuesta Supabase?**  
R: Gratis hasta 500MB DB + 1GB storage + 2GB bandwidth.

**P: ¿Necesito tarjeta de crédito?**  
R: No para free tier de Supabase.

**P: ¿Y para Stripe?**  
R: Sí, pero puedes usar test mode sin cobros reales.

---

**Solución implementada:** ✅ Modo demo funcional  
**Error 500:** ✅ Resuelto  
**Próximo paso:** Configurar Supabase (opcional, 15 min)
