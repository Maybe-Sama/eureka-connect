# 🗄️ Configuración de Base de Datos de Test (Paso 1)

## 📋 **Objetivo**
Crear una copia exacta de tu base de datos actual para usarla como entorno de test, manteniendo tu base de datos de desarrollo intacta.

## 🎯 **¿Por qué necesitas una base de datos de test?**
- **Pruebas seguras**: Probar cambios sin afectar datos reales
- **Desarrollo paralelo**: Múltiples desarrolladores pueden trabajar
- **Backup**: Tener una copia de seguridad de tu configuración actual
- **Testing**: Probar migraciones y cambios antes de producción

## 🚀 **Pasos para Crear la Base de Datos de Test**

### **Paso 1: Crear Nuevo Proyecto en Supabase**

1. **Accede a Supabase**
   - Ve a [supabase.com](https://supabase.com)
   - Inicia sesión con tu cuenta

2. **Crear nuevo proyecto**
   - Haz clic en **"New Project"**
   - Configuración:
     - **Name**: `eureka-connect-test`
     - **Database Password**: (guarda esta contraseña en un lugar seguro)
     - **Region**: La misma que tu proyecto actual
   - Haz clic en **"Create new project"**

3. **Esperar la creación** (2-3 minutos)

### **Paso 2: Obtener Credenciales del Proyecto Test**

1. **En tu nuevo proyecto de test:**
   - Ve a **Settings** → **API**
   - Anota estas credenciales:
     - **Project URL**: `https://tu-proyecto-test.supabase.co`
     - **anon public key**: `eyJ...` (clave larga)
     - **service_role key**: `eyJ...` (clave larga)

2. **Guarda estas credenciales** en un lugar seguro

### **Paso 3: Configurar Variables de Entorno**

1. **Crea un archivo `.env.test`** en la raíz de tu proyecto:

```env
# ============================================================
# CONFIGURACIÓN PARA BASE DE DATOS DE TEST
# ============================================================

# Base de datos de desarrollo (origen - tu base actual)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto-dev.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_dev

# Base de datos de test (destino - nueva base de datos)
NEXT_PUBLIC_SUPABASE_URL_TEST=https://tu-proyecto-test.supabase.co
SUPABASE_SERVICE_ROLE_KEY_TEST=tu_service_role_key_test
```

2. **Reemplaza los valores** con tus credenciales reales

### **Paso 4: Configurar el Esquema en la Base de Datos de Test**

1. **En tu proyecto de test en Supabase:**
   - Ve a **SQL Editor**
   - Ejecuta este script para crear el esquema:

```sql
-- Ejecutar el archivo: database/supabase-complete-schema-verification.sql
-- Este script creará todas las tablas, índices y funciones necesarias
```

2. **Configurar políticas RLS:**
   - Ejecuta: `database/supabase-rls-policies.sql`

3. **Configurar storage:**
   - Ejecuta: `database/supabase-storage-avatars-policies-fixed.sql`

### **Paso 5: Ejecutar el Script de Migración**

1. **Instalar dependencias** (si no están instaladas):
   ```bash
   pnpm install
   ```

2. **Ejecutar el script de migración:**
   ```bash
   node scripts/migrate-to-test.js
   ```

3. **El script hará lo siguiente:**
   - ✅ Verificar que las variables de entorno estén configuradas
   - ✅ Conectar a ambas bases de datos
   - ✅ Migrar datos en el orden correcto (respetando dependencias)
   - ✅ Mostrar un resumen de la migración

### **Paso 6: Verificar la Migración**

1. **En tu proyecto de test:**
   - Ve a **Table Editor**
   - Verifica que todas las tablas tengan datos:
     - `courses`
     - `students`
     - `classes`
     - `invoices`
     - `facturas_rrsif` (si existe)

2. **Probar la aplicación con test:**
   - Cambia temporalmente las variables de entorno
   - Ejecuta `pnpm dev`
   - Verifica que todo funcione correctamente

## 🔧 **Script de Migración Explicado**

El script `scripts/migrate-to-test.js` incluye:

### **Características:**
- ✅ **Verificación de entorno**: Comprueba que todas las variables estén configuradas
- ✅ **Migración ordenada**: Respeta las dependencias entre tablas
- ✅ **Manejo de errores**: Muestra errores claros si algo falla
- ✅ **Resumen detallado**: Muestra cuántos registros se migraron
- ✅ **Colores en consola**: Fácil de leer los resultados

### **Orden de migración:**
1. `courses` (sin dependencias)
2. `students` (depende de courses)
3. `classes` (depende de students)
4. `invoices` (depende de students)
5. `facturas_rrsif` (independiente)
6. `settings` (si existe)
7. `avatars` (si existe)

## 🚨 **Troubleshooting**

### **Error: "Variables de entorno faltantes"**
- ✅ Verifica que el archivo `.env.test` existe
- ✅ Verifica que las variables estén correctamente escritas
- ✅ Reinicia tu terminal después de crear el archivo

### **Error: "Missing dependency"**
- ✅ El script detecta automáticamente dependencias faltantes
- ✅ Verifica que el esquema esté correctamente configurado en test

### **Error: "Permission denied"**
- ✅ Verifica que las claves de service role sean correctas
- ✅ Verifica que el proyecto de test esté activo

### **Error: "Table doesn't exist"**
- ✅ Ejecuta primero los scripts de esquema en la base de datos de test
- ✅ Verifica que el nombre de la tabla sea correcto

## 📊 **Verificación Final**

Después de la migración exitosa, deberías ver:

```
📊 RESUMEN DE MIGRACIÓN:
==================================================
✅ Tabla 1: 3 registros
✅ Tabla 2: 25 registros
✅ Tabla 3: 150 registros
✅ Tabla 4: 30 registros
✅ Tabla 5: 45 registros
==================================================
📈 Total migrado: 253 registros
❌ Errores: 0
🎉 ¡Migración completada exitosamente!
```

## 🎯 **Próximos Pasos**

1. **Configurar entorno de test**:
   - Crear archivo `.env.test.local` para desarrollo con test
   - Configurar scripts de package.json para alternar entre entornos

2. **Configurar CI/CD**:
   - Usar la base de datos de test para pruebas automáticas
   - Configurar GitHub Actions o similar

3. **Documentar el proceso**:
   - Crear documentación para otros desarrolladores
   - Establecer procedimientos de migración

## 💡 **Consejos Adicionales**

- **Backup regular**: Ejecuta la migración periódicamente para mantener test actualizado
- **Datos de prueba**: Puedes agregar datos específicos para testing
- **Limpieza**: El script puede limpiar la base de test antes de migrar
- **Incremental**: Para futuras migraciones, puedes modificar el script para ser incremental

¡Tu base de datos de test estará lista para usar! 🎉
