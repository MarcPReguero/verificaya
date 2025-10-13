// Script de verificación de conexión a Supabase
const { createClient } = require('@supabase/supabase-js');

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Verificando configuración de Supabase...\n');

// Verificar que las credenciales existen
if (!supabaseUrl || supabaseUrl === 'https://your-project.supabase.co') {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL no está configurada correctamente');
  process.exit(1);
}

if (!supabaseServiceKey || supabaseServiceKey === 'your-service-role-key-here') {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY no está configurada correctamente');
  process.exit(1);
}

console.log('✅ Variables de entorno configuradas:');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Service Key: ${supabaseServiceKey.substring(0, 20)}...`);
console.log('');

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Verificar conexión listando tablas
async function verifyConnection() {
  try {
    console.log('🔌 Intentando conectar a Supabase...\n');
    
    // Verificar tabla landlords
    const { data: landlords, error: landlordsError } = await supabase
      .from('landlords')
      .select('count')
      .limit(1);
    
    if (landlordsError) {
      console.error('❌ Error al conectar con tabla landlords:', landlordsError.message);
      return false;
    }
    
    console.log('✅ Tabla landlords: Accesible');
    
    // Verificar tabla screenings
    const { data: screenings, error: screeningsError } = await supabase
      .from('screenings')
      .select('count')
      .limit(1);
    
    if (screeningsError) {
      console.error('❌ Error al conectar con tabla screenings:', screeningsError.message);
      return false;
    }
    
    console.log('✅ Tabla screenings: Accesible');
    
    // Verificar tabla screening_documents
    const { data: docs, error: docsError } = await supabase
      .from('screening_documents')
      .select('count')
      .limit(1);
    
    if (docsError) {
      console.error('❌ Error al conectar con tabla screening_documents:', docsError.message);
      return false;
    }
    
    console.log('✅ Tabla screening_documents: Accesible');
    
    // Verificar storage buckets
    console.log('\n📦 Verificando Storage Buckets...\n');
    
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error al listar buckets:', bucketsError.message);
      return false;
    }
    
    const documentsBucket = buckets.find(b => b.name === 'documents');
    const reportsBucket = buckets.find(b => b.name === 'reports');
    
    if (documentsBucket) {
      console.log('✅ Bucket "documents": Encontrado');
    } else {
      console.log('⚠️  Bucket "documents": NO encontrado (créalo manualmente)');
    }
    
    if (reportsBucket) {
      console.log('✅ Bucket "reports": Encontrado');
    } else {
      console.log('⚠️  Bucket "reports": NO encontrado (créalo manualmente)');
    }
    
    console.log('\n✅ CONEXIÓN A SUPABASE EXITOSA! 🎉\n');
    console.log('📊 Resumen:');
    console.log('   - Base de datos: ✅ Conectada');
    console.log('   - Tablas: ✅ Accesibles (3/3)');
    console.log('   - Storage: ' + (documentsBucket && reportsBucket ? '✅ Configurado' : '⚠️  Parcialmente configurado'));
    console.log('');
    console.log('🚀 Tu aplicación está lista para usar Supabase!');
    console.log('   Abre: http://localhost:3001');
    console.log('');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
    return false;
  }
}

// Ejecutar verificación
verifyConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
