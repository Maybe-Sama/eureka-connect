# 📁 Scripts de Utilidad

Este directorio contiene scripts de utilidad para el proyecto Eureka Connect.

## 🗄️ Scripts de Base de Datos

### `backup-supabase-database.js`
Script principal para crear backups completos de la base de datos de Supabase.

**Uso:**
```bash
# Usando npm/pnpm
pnpm run backup-database

# Ejecución directa
node scripts/backup-supabase-database.js
```

**Características:**
- Descarga todas las tablas con datos
- Genera archivos SQL y JSON
- Solo lectura (no modifica la BD original)
- Reporte detallado del backup
- Múltiples formatos de exportación

### `test-backup-dependencies.js`
Script de verificación para comprobar que todas las dependencias del backup estén disponibles.

**Uso:**
```bash
# Usando npm/pnpm
pnpm run test-backup

# Ejecución directa
node scripts/test-backup-dependencies.js
```

**Verifica:**
- Dependencias de Node.js
- Dependencias de npm
- Variables de entorno
- Archivo .env.local
- Directorio de backups
- Conexión a Supabase

## 📋 Otros Scripts

### `check-build.js`
Script para verificar que el proyecto se compile correctamente antes del despliegue.

## 🔧 Configuración Requerida

### Variables de Entorno
Asegúrate de tener configuradas en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui  # Opcional pero recomendado
```

### Dependencias
Los scripts requieren las siguientes dependencias (ya incluidas en el proyecto):
- `@supabase/supabase-js`
- Módulos nativos de Node.js (`fs`, `path`, `util`)

## 📖 Documentación Completa

Para instrucciones detalladas, consulta:
- [Guía de Backup de Base de Datos](../docs/DATABASE_BACKUP_GUIDE.md)

## 🚀 Flujo de Trabajo Recomendado

1. **Verificar dependencias:**
   ```bash
   pnpm run test-backup
   ```

2. **Crear backup:**
   ```bash
   pnpm run backup-database
   ```

3. **Revisar archivos generados:**
   - Revisar `backups/backup_YYYY-MM-DD_HH-MM-SS/backup-report.md`
   - Verificar que los archivos SQL y JSON se generaron correctamente

## ⚠️ Notas Importantes

- Los scripts son de **solo lectura** y no modifican la base de datos original
- Los backups contienen datos sensibles, mantén los archivos seguros
- Para bases de datos grandes, el proceso puede tomar tiempo
- Requiere conexión estable a internet