# 🔧 CONFIGURACIÓN DE GOOGLE CLOUD VISION API

## ⏱️ Tiempo estimado: 10-15 minutos

---

## PASO 1: Crear Cuenta Google Cloud (3 min)

### 1.1. Ir a Google Cloud Console
- Abre: <https://console.cloud.google.com>
- Inicia sesión con tu cuenta Google
- Si es primera vez, acepta los términos

### 1.2. Activar prueba gratuita (opcional pero recomendado)
- Google ofrece **$300 USD de crédito gratis**
- Válido por 90 días
- **NO SE COBRA** hasta que lo actives manualmente
- Requiere tarjeta de crédito (solo para verificación)

---

## PASO 2: Crear Proyecto (2 min)

### 2.1. Click en el selector de proyectos
- Está en la parte superior: "My First Project" o "Select a project"

### 2.2. Click "NEW PROJECT"
- **Project name:** `tenant-screening-ocr`
- **Location:** Dejar como está (No organization)
- Click "CREATE"
- Espera 30 segundos a que se cree

### 2.3. Selecciona el proyecto recién creado
- Click en el selector de proyectos
- Click en `tenant-screening-ocr`

---

## PASO 3: Habilitar Vision API (2 min)

### 3.1. Ir a APIs & Services
- Menú hamburguesa (☰) → "APIs & Services" → "Library"
- O usa este link directo: <https://console.cloud.google.com/apis/library>

### 3.2. Buscar Vision API
- En el buscador escribe: `vision`
- Click en "Cloud Vision API"

### 3.3. Habilitar la API
- Click botón azul "ENABLE"
- Espera 10-20 segundos

**✅ Listo! La API está habilitada**

---

## PASO 4: Crear Service Account (3 min)

### 4.1. Ir a Credentials
- Menú hamburguesa (☰) → "APIs & Services" → "Credentials"
- O: <https://console.cloud.google.com/apis/credentials>

### 4.2. Crear Service Account
- Click "CREATE CREDENTIALS" (arriba)
- Selecciona "Service account"

### 4.3. Llenar detalles
**Service account details:**
- **Service account name:** `tenant-screening-ocr`
- **Service account ID:** (se genera automático)
- **Description:** `OCR for tenant screening app`
- Click "CREATE AND CONTINUE"

**Grant this service account access to project:**
- Click en "Select a role"
- Escribe: `Cloud Vision AI`
- Selecciona: **"Cloud Vision AI Service Agent"**
- Click "CONTINUE"

**Grant users access (opcional):**
- Dejar vacío
- Click "DONE"

**✅ Service Account creada!**

---

## PASO 5: Crear y Descargar Key (3 min)

### 5.1. Encontrar tu Service Account
- Deberías estar en la página "Credentials"
- Baja a la sección "Service Accounts"
- Verás: `tenant-screening-ocr@...`

### 5.2. Crear Key
- Click en el email de la service account
- Click en tab "KEYS"
- Click "ADD KEY" → "Create new key"

### 5.3. Seleccionar formato
- **Key type:** JSON (recomendado)
- Click "CREATE"

### 5.4. Guardar archivo
- Se descarga automáticamente: `tenant-screening-ocr-xxxxxx.json`
- **🔒 ¡IMPORTANTE! Guarda este archivo en lugar seguro**
- **NO LO SUBAS A GIT** (ya está en .gitignore)

---

## PASO 6: Configurar Variables de Entorno (5 min)

### 6.1. Abrir el archivo JSON descargado
Verás algo así:

```json
{
  "type": "service_account",
  "project_id": "tenant-screening-ocr",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n",
  "client_email": "tenant-screening-ocr@tenant-screening-ocr.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

### 6.2. Copiar valores necesarios

Necesitas estos 3 valores:
1. `project_id`
2. `private_key` (completo, con `\n`)
3. `client_email`

### 6.3. Agregar a .env.local

Abre tu archivo `.env.local` y agrega:

```env
# Google Cloud Vision API
GOOGLE_CLOUD_PROJECT_ID=tenant-screening-ocr
GOOGLE_CLOUD_CLIENT_EMAIL=tenant-screening-ocr@tenant-screening-ocr.iam.gserviceaccount.com
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n"
```

**⚠️ IMPORTANTE:**
- `GOOGLE_CLOUD_PRIVATE_KEY` debe estar entre **comillas dobles**
- Los `\n` son importantes (saltos de línea)
- Copia TODO entre las comillas del JSON (incluyendo BEGIN y END)

### 6.4. Ejemplo completo .env.local

```env
# Supabase (ya lo tienes)
NEXT_PUBLIC_SUPABASE_URL=https://dhtklergxhybdzqinfqc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# Google Cloud Vision API (NUEVO)
GOOGLE_CLOUD_PROJECT_ID=tenant-screening-ocr
GOOGLE_CLOUD_CLIENT_EMAIL=tenant-screening-ocr@tenant-screening-ocr.iam.gserviceaccount.com
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# Stripe (pendiente)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

---

## PASO 7: Reiniciar Servidor (1 min)

### 7.1. Detener servidor actual
- En la terminal donde corre: `Ctrl+C`

### 7.2. Reiniciar
```bash
npm run dev
```

### 7.3. Verificar configuración
El servidor debería iniciar sin errores. Si ves:
```
✓ Ready in 2.1s
✓ Local: http://localhost:3001
```

**✅ ¡Configuración completa!**

---

## 🧪 PROBAR OCR

### Método 1: Desde la aplicación
1. Ve a: <http://localhost:3001/screening/new>
2. Login con: demo / demo
3. Sube una foto de DNI en el nuevo componente
4. Verás los datos extraídos automáticamente

### Método 2: Prueba directa con cURL

```bash
curl -X POST http://localhost:3001/api/ocr/analyze \
  -F "file=@/ruta/a/tu/dni.jpg"
```

Deberías ver:
```json
{
  "success": true,
  "document": {
    "type": "DNI",
    "documentNumber": "12345678A",
    "fullName": "JUAN PEREZ GARCIA",
    ...
  },
  "validation": {
    "valid": true,
    "errors": [],
    "warnings": []
  }
}
```

---

## 💰 COSTOS Y LÍMITES

### Free Tier (GRATIS)
- **1,000 requests/mes** GRATIS ✅
- Perfecto para empezar
- Resetea cada mes

### Después del Free Tier
- 1,001 - 5,000,000: **$1.50 USD por 1,000 docs**
- 5,000,001+: **$0.60 USD por 1,000 docs**

### Tu caso (100 screenings/mes):
- ~200-300 documentos/mes
- **Costo: $0** (dentro del free tier) 🎉

### Si escalas (1,000 screenings/mes):
- ~2,000 documentos/mes
- Costo: ~$3 USD/mes (€2.70)
- **Por screening: €0.003** (prácticamente gratis)

---

## 🔒 SEGURIDAD

### ✅ Buenas prácticas aplicadas:

1. **Service Account** (no OAuth user)
   - Más seguro para server-side
   - No requiere login manual
   - Permisos específicos

2. **Variables de entorno**
   - Keys no en código
   - `.env.local` en `.gitignore`
   - Nunca compartir el JSON

3. **Permisos mínimos**
   - Solo "Cloud Vision AI Service Agent"
   - Sin acceso a otros servicios

### ⚠️ SI EL JSON SE FILTRA:

1. Ve a: <https://console.cloud.google.com/iam-admin/serviceaccounts>
2. Encuentra tu service account
3. Click en "..." → "Manage keys"
4. Elimina la key comprometida
5. Crea una nueva key
6. Actualiza .env.local

---

## 🐛 TROUBLESHOOTING

### Error: "Google Cloud credentials not configured"
**Solución:** 
- Verifica que las 3 variables estén en `.env.local`
- Reinicia el servidor (`Ctrl+C` y `npm run dev`)

### Error: "Permission denied"
**Solución:**
- Ve a IAM & Admin → IAM
- Encuentra tu service account
- Agregar rol: "Cloud Vision AI Service Agent"

### Error: "API not enabled"
**Solución:**
- Ve a: <https://console.cloud.google.com/apis/library/vision.googleapis.com>
- Click "ENABLE"

### Error: "Invalid key format"
**Solución:**
- El `private_key` debe tener las comillas dobles
- Los `\n` son importantes (no los borres)
- Copia TODO el valor del JSON

### Error: "Quota exceeded"
**Solución:**
- Has superado el free tier (1,000/mes)
- Ve a: <https://console.cloud.google.com/billing>
- Habilita facturación (se cobrará el excedente)

---

## 📊 MONITOREO

### Ver uso de la API:
1. Ve a: <https://console.cloud.google.com/apis/dashboard>
2. Selecciona "Cloud Vision API"
3. Verás gráficas de:
   - Requests por día
   - Latencia
   - Errores

### Configurar alertas:
1. Ve a: <https://console.cloud.google.com/monitoring/alerting>
2. Click "CREATE POLICY"
3. Configurar alerta cuando:
   - Uso > 800 requests/mes (cerca del límite)
   - Errores > 5%

---

## ✅ CHECKLIST FINAL

Verifica que todo está configurado:

- [ ] Cuenta Google Cloud creada
- [ ] Proyecto `tenant-screening-ocr` creado
- [ ] Vision API habilitada
- [ ] Service Account creada
- [ ] JSON key descargado
- [ ] Variables en `.env.local`:
  - [ ] `GOOGLE_CLOUD_PROJECT_ID`
  - [ ] `GOOGLE_CLOUD_CLIENT_EMAIL`
  - [ ] `GOOGLE_CLOUD_PRIVATE_KEY`
- [ ] Servidor reiniciado
- [ ] OCR funcionando (probado)

---

## 🎉 ¡LISTO!

Ahora tienes OCR funcionando con:
- ✅ 1,000 documentos/mes GRATIS
- ✅ Detección automática de DNI/NIE/Pasaporte
- ✅ Extracción de datos
- ✅ Validación de documentos
- ✅ Auto-completado de formularios

**Costo actual: €0/mes** 🎉

---

## 📞 SIGUIENTE PASO

¿Quieres que te ayude a:
1. **Integrar el componente OCR** en el formulario de screening
2. **Probar con documentos reales**
3. **Mejorar la precisión** con ajustes específicos
4. **Agregar más features** (verificación facial, detección de fraudes)

**¿Cuál prefieres?** 🚀
