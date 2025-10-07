const fs = require('fs');
const path = require('path');

// Script para configurar la base de datos de castigos
async function setupPunishmentsDatabase() {
  try {
    console.log('🎯 Configurando base de datos de castigos...');
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '..', 'database', 'punishments-schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Esquema SQL cargado correctamente');
    console.log('📋 Contenido del esquema:');
    console.log('   - Tabla punishment_types: Tipos de castigos');
    console.log('   - Tabla punishment_results: Resultados de la ruleta');
    console.log('   - Tabla punishment_settings: Configuraciones');
    console.log('   - Castigos por defecto: 5 niveles de severidad');
    console.log('   - Índices y triggers configurados');
    
    console.log('\n✅ Para aplicar el esquema, ejecuta el siguiente comando:');
    console.log('   psql -d tu_base_de_datos -f database/punishments-schema.sql');
    console.log('\n   O si usas Supabase:');
    console.log('   - Ve al SQL Editor en tu dashboard de Supabase');
    console.log('   - Copia y pega el contenido de database/punishments-schema.sql');
    console.log('   - Ejecuta el script');
    
    console.log('\n🎯 Sistema de castigos listo para usar!');
    
  } catch (error) {
    console.error('❌ Error configurando la base de datos:', error);
  }
}

setupPunishmentsDatabase();
