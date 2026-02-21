# Modo Demo - Sin Pagos

## 🎯 Funcionalidad

El usuario **demo** puede acceder a todas las funcionalidades del sistema **sin realizar ningún pago**.

## ✨ Características del Modo Demo

### 1. **Acceso Completo Sin Costo**
- Usuario demo: `demo`
- Contraseña: `demo`
- No requiere configuración de Stripe
- No requiere tarjeta de crédito
- Acceso ilimitado a crear verificaciones

### 2. **Flujo Simplificado**

#### Usuarios Normales:
```
Formulario → Pago Stripe → Webhook → Procesamiento → Informe
```

#### Usuario Demo:
```
Formulario → Procesamiento Directo → Informe (sin pago)
```

### 3. **Identificación Visual**

#### Banner en Formulario de Verificación
- Color: Verde gradient (green-500 to green-600)
- Icono: ✨
- Mensaje: "Modo Demo Activo - Sin pago necesario"

#### Banner en Dashboard
- Color: Verde gradient
- Icono: 🎯
- Mensaje: "Panel Demo Activo - Verificaciones ilimitadas sin costo"

#### Etiquetas en Verificaciones
- Badge verde con texto "DEMO"
- Aparece junto al nombre del inquilino en la tabla

## 🔧 Implementación Técnica

### 1. **Detección de Usuario Demo** (`app/screening/new/page.tsx`)
```typescript
const isDemoUser = isAuthenticated && user?.email === 'demo';
```

### 2. **Saltar Pago** (Flujo Modificado)
```typescript
if (isDemoUser) {
  // Saltar Stripe, ir directo a success
  router.push(`/screening/${data.screeningId}/success?demo=true`);
  return;
}
```

### 3. **Página de Éxito** (`app/screening/[id]/success/page.tsx`)
- Detecta parámetro `?demo=true`
- Muestra mensaje adaptado: "Verificación Demo Iniciada"
- Banner verde indicando modo demo
- No menciona pago confirmado

### 4. **Dashboard** (`app/dashboard/page.tsx`)
- Banner informativo para usuario demo
- Badge "DEMO" en verificaciones demo
- Datos de ejemplo incluidos

## 📊 Datos de Ejemplo

### Verificación Demo Incluida
```typescript
{
  id: 'demo-1',
  tenantName: 'Ana Demo Usuario',
  propertyAddress: 'Rambla de Catalunya, 50, Barcelona',
  status: 'completed',
  score: 92,
  isDemo: true,
  createdAt: new Date('2025-10-12'),
  completedAt: new Date('2025-10-12'),
}
```

## 🎨 Elementos Visuales

### Colores Modo Demo
- **Gradient Background:** `from-green-500 to-green-600`
- **Text Color:** `text-white`
- **Badge:** `bg-green-100 text-green-700`
- **Icon Background:** `bg-green-500`

### Iconos
- Formulario: ✨ (sparkles)
- Dashboard: 🎯 (target)
- Success: ✓ (checkmark)

## 🚀 Flujo de Usuario Demo

### Paso 1: Login
1. Ir a `/login`
2. Ver banner azul con credenciales
3. Ingresar: demo / demo
4. Redirigir a `/dashboard`

### Paso 2: Dashboard
1. Ver banner verde "Panel Demo Activo"
2. Ver verificación demo existente con badge
3. Click en "+ Nueva Verificación"

### Paso 3: Nueva Verificación
1. Ver banner verde "Modo Demo Activo"
2. Completar formulario (4 pasos)
3. **NO se muestra precio ni pago**
4. Click "Finalizar" → Procesamiento directo

### Paso 4: Success
1. Redirigido a `/screening/[id]/success?demo=true`
2. Ver banner verde "Modo Demo"
3. Ver mensaje de éxito adaptado
4. Procesamiento automático del informe

### Paso 5: Ver Informe
1. Volver al dashboard
2. Ver nueva verificación con badge "DEMO"
3. Click "Ver Informe"
4. Acceder al PDF generado

## 🔒 Seguridad

### Limitaciones del Modo Demo
- Solo funciona con email exacto: `demo`
- No puede cambiar credenciales
- Datos no se guardan en base de datos real
- No genera cargos en Stripe

### Validación Backend
El backend debe:
- Verificar si `isDemoUser` flag está presente
- Saltar validación de pago de Stripe
- Marcar screening como demo en base de datos
- No enviar webhooks de pago

## 📝 Mensajes del Sistema

### Formulario de Verificación
```
Modo Demo Activo
Como usuario demo, puedes crear verificaciones sin pagar. 
El proceso se completará automáticamente para que puedas 
explorar todas las funcionalidades.
```

### Dashboard
```
Panel Demo Activo
Estás usando una cuenta demo. Puedes crear verificaciones 
ilimitadas sin ningún costo y explorar todas las 
funcionalidades del sistema.
```

### Página de Éxito
```
¡Verificación Demo Iniciada!
Explorando el proceso completo de verificación

Esta es una verificación demo sin cargo. Puedes ver el 
informe completo y explorar todas las funcionalidades 
del sistema.
```

## 🎯 Beneficios

### Para Usuarios de Prueba
- ✅ No requiere tarjeta de crédito
- ✅ Exploración completa del sistema
- ✅ Sin riesgo de cargos accidentales
- ✅ Proceso simplificado

### Para Desarrollo
- ✅ Testing sin Stripe configurado
- ✅ Demos a clientes sin costo
- ✅ Pruebas de flujo completo
- ✅ Desarrollo local simplificado

### Para Ventas
- ✅ Mostrar producto completo
- ✅ Sin fricción en demos
- ✅ Conversión más fácil
- ✅ Trial sin compromiso

## 🔄 Comparación: Demo vs Normal

| Característica | Usuario Normal | Usuario Demo |
|----------------|----------------|--------------|
| Login | Email + Password | demo / demo |
| Crear Verificación | Sí | Sí |
| Proceso de Pago | Stripe Checkout | **Omitido** |
| Costo | €59 / €99 | **€0** |
| Ver Informes | Sí | Sí |
| Límite Verificaciones | Según pago | **Ilimitado** |
| Badge Visual | No | **Sí (DEMO)** |
| Banner Informativo | No | **Sí** |
| Configuración Requerida | Stripe + Supabase | **Solo Local** |

## 🚦 Testing

### Casos de Prueba

#### Test 1: Login Demo
- [ ] Ir a `/login`
- [ ] Ingresar demo/demo
- [ ] Ver dashboard con banner verde
- [ ] Ver verificación demo existente

#### Test 2: Nueva Verificación Demo
- [ ] Click "+ Nueva Verificación"
- [ ] Ver banner verde en formulario
- [ ] Completar 4 pasos
- [ ] **NO ver paso de pago**
- [ ] Redirigir a success?demo=true

#### Test 3: Success Demo
- [ ] Ver título "Verificación Demo Iniciada"
- [ ] Ver banner verde modo demo
- [ ] Ver checkmark verde
- [ ] **NO ver mensaje de pago**

#### Test 4: Dashboard con Demo
- [ ] Ver nueva verificación en tabla
- [ ] Ver badge "DEMO" verde
- [ ] Stats actualizados (4 total, 2 completadas)

#### Test 5: Usuario Normal (Comparación)
- [ ] Salir de cuenta demo
- [ ] Crear verificación sin login
- [ ] **Debe mostrar proceso de pago**
- [ ] **Debe requerir Stripe**

## 📚 Archivos Modificados

1. **`app/screening/new/page.tsx`**
   - Importar `useAuth` y `useRouter`
   - Agregar detección `isDemoUser`
   - Agregar banner verde
   - Modificar flujo de submit

2. **`app/screening/[id]/success/page.tsx`**
   - Detectar parámetro `demo`
   - Agregar banner condicional
   - Mensajes adaptados

3. **`app/dashboard/page.tsx`**
   - Agregar verificación demo en mockData
   - Banner verde para usuario demo
   - Badge "DEMO" en tabla
   - Stats actualizados

4. **`lib/auth.ts`**
   - (Ya existente) DEMO_USER definido

## 🎓 Mejoras Futuras

### Opcional - V2
- [ ] Contador de verificaciones demo
- [ ] Límite de tiempo (ej: 7 días)
- [ ] Datos demo más variados
- [ ] Analytics de uso demo
- [ ] Conversión demo → cuenta real
- [ ] Email de seguimiento post-demo
- [ ] Tutorial interactivo en modo demo

## ✅ Checklist de Implementación

- [x] Detectar usuario demo en formulario
- [x] Saltar proceso de pago para demo
- [x] Banner informativo en formulario
- [x] Banner informativo en dashboard
- [x] Badge "DEMO" en verificaciones
- [x] Página de éxito adaptada
- [x] Datos demo en dashboard
- [x] Mensajes adaptados
- [x] Testing local completado
- [ ] Backend API actualizado (pendiente Supabase)
- [ ] Webhook handler actualizado (pendiente)

## 🚀 Para Usar

1. **Iniciar servidor:**
   ```bash
   npm run dev
   ```

2. **Ir a login:**
   ```
   http://localhost:3000/login
   ```

3. **Credenciales:**
   ```
   Usuario: demo
   Contraseña: demo
   ```

4. **Explorar:**
   - Dashboard con datos demo
   - Crear nueva verificación sin pago
   - Ver informes completos
   - ¡Todo gratis! 🎉

---

**Nota:** Esta funcionalidad permite testing completo sin necesidad de configurar Stripe ni tarjetas de crédito. Ideal para desarrollo, demos y evaluación del producto.
