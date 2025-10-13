// Script para ver los screenings guardados en Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function viewScreenings() {
  console.log('📋 SCREENINGS GUARDADOS EN SUPABASE\n');
  console.log('='.repeat(80) + '\n');

  try {
    // Obtener todos los screenings con datos del landlord
    const { data: screenings, error } = await supabase
      .from('screenings')
      .select(`
        *,
        landlords (
          name,
          email,
          phone
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Error al consultar screenings:', error.message);
      return;
    }

    if (!screenings || screenings.length === 0) {
      console.log('⚠️  No hay screenings en la base de datos todavía.\n');
      console.log('💡 Crea uno desde http://localhost:3001\n');
      return;
    }

    console.log(`✅ Total de screenings: ${screenings.length}\n`);

    screenings.forEach((screening, index) => {
      console.log(`${index + 1}. SCREENING #${screening.id.substring(0, 8)}`);
      console.log('─'.repeat(80));
      
      console.log(`\n📅 Creado: ${new Date(screening.created_at).toLocaleString('es-ES')}`);
      console.log(`📊 Estado: ${screening.status.toUpperCase()}`);
      if (screening.score) {
        console.log(`⭐ Score: ${screening.score}/100`);
      }
      
      console.log(`\n👤 INQUILINO:`);
      console.log(`   Nombre: ${screening.tenant_name}`);
      console.log(`   Email: ${screening.tenant_email}`);
      console.log(`   Teléfono: ${screening.tenant_phone || 'N/A'}`);
      console.log(`   Documento: ${screening.document_type} ${screening.document_number}`);
      console.log(`   Ingresos: €${screening.monthly_income}/mes`);
      console.log(`   Empleo: ${screening.employment_status}`);
      
      console.log(`\n🏠 PROPIEDAD:`);
      console.log(`   Dirección: ${screening.property_address}`);
      console.log(`   Renta: €${screening.monthly_rent}/mes`);
      console.log(`   Ratio Ingresos/Renta: ${(screening.monthly_income / screening.monthly_rent).toFixed(2)}x`);
      
      if (screening.landlords) {
        console.log(`\n🏢 PROPIETARIO:`);
        console.log(`   Nombre: ${screening.landlords.name}`);
        console.log(`   Email: ${screening.landlords.email}`);
        console.log(`   Teléfono: ${screening.landlords.phone || 'N/A'}`);
      }
      
      console.log(`\n💼 PAQUETE: ${screening.package_type === 'basic' ? 'Básico' : 'Completo'}`);
      
      if (screening.report_url) {
        console.log(`📄 Reporte: ${screening.report_url}`);
      }
      
      console.log('\n' + '='.repeat(80) + '\n');
    });

    // Estadísticas
    console.log('📊 ESTADÍSTICAS:');
    console.log('─'.repeat(80));
    
    const pending = screenings.filter(s => s.status === 'pending').length;
    const processing = screenings.filter(s => s.status === 'processing').length;
    const completed = screenings.filter(s => s.status === 'completed').length;
    const rejected = screenings.filter(s => s.status === 'rejected').length;
    
    console.log(`   Pendientes: ${pending}`);
    console.log(`   Procesando: ${processing}`);
    console.log(`   Completados: ${completed}`);
    console.log(`   Rechazados: ${rejected}`);
    
    const avgIncome = screenings.reduce((sum, s) => sum + parseFloat(s.monthly_income), 0) / screenings.length;
    const avgRent = screenings.reduce((sum, s) => sum + parseFloat(s.monthly_rent), 0) / screenings.length;
    
    console.log(`\n   📈 Ingreso promedio: €${avgIncome.toFixed(2)}/mes`);
    console.log(`   🏠 Renta promedio: €${avgRent.toFixed(2)}/mes`);
    console.log(`   💰 Ratio promedio: ${(avgIncome / avgRent).toFixed(2)}x`);
    
    console.log('\n' + '='.repeat(80) + '\n');
    
    console.log('✅ Datos consultados exitosamente desde Supabase!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

viewScreenings();
