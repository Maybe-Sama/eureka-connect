# 📦 Guía de Backup de Base de Datos de Supabase

Este documento explica cómo usar el script de backup para descargar una copia completa de tu base de datos de Supabase con todos los datos incluidos.

## 🚀 Características del Script

- ✅ **Copia completa**: Descarga todas las tablas con datos
- ✅ **Múltiples formatos**: Genera archivos SQL y JSON
- ✅ **Solo lectura**: No modifica la base de datos original
- ✅ **Reporte detallado**: Incluye estadísticas y documentación
- ✅ **Fácil restauración**: Scripts SQL listos para usar
- ✅ **Organizado**: Archivos separados por tabla y tipo

## 📋 Requisitos Previos

### 1. Variables de Entorno

Asegúrate de tener configuradas las siguientes variables en tu archivo `.env.local`:

```env
# Variables requeridas
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon-aqui

# Variable opcional (recomendada para acceso completo)
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
```

### 2. Dependencias

El script utiliza las dependencias ya instaladas en el proyecto:
- `@supabase/supabase-js`
- `fs` (Node.js built-in)
- `path` (Node.js built-in)

## 🛠️ Cómo Usar el Script

### Opción 1: Usando npm/pnpm (Recomendado)

```bash
# Ejecutar el backup
pnpm run backup-database

# O con npm
npm run backup-database
```

### Opción 2: Ejecución Directa

```bash
# Ejecutar directamente con Node.js
node scripts/backup-supabase-database.js
```

## 📁 Estructura de Archivos Generados

El script crea un directorio `backups/` con la siguiente estructura:

```
backups/
└── backup_YYYY-MM-DD_HH-MM-SS/
    ├── backup-report.md              # Reporte detallado del backup
    ├── complete-database.sql         # Script SQL completo
    ├── schema-only.sql              # Solo estructura de tablas
    ├── data-only.sql                # Solo datos (INSERT statements)
    ├── tabla1.sql                   # Archivo individual por tabla
    ├── tabla1.json                  # Datos en formato JSON
    ├── tabla2.sql
    ├── tabla2.json
    └── ...
```

## 📊 Tipos de Archivos Generados

### 1. Archivos SQL

- **`complete-database.sql`**: Script completo para recrear toda la base de datos
- **`schema-only.sql`**: Solo la estructura (CREATE TABLE statements)
- **`data-only.sql`**: Solo los datos (INSERT statements)
- **`[tabla].sql`**: Archivo individual por cada tabla

### 2. Archivos JSON

- **`[tabla].json`**: Datos de cada tabla en formato JSON con metadatos

### 3. Reporte

- **`backup-report.md`**: Documentación completa del backup con estadísticas

## 🔄 Cómo Restaurar los Datos

### Opción 1: Restaurar Base de Datos Completa

```sql
-- En Supabase SQL Editor o cliente PostgreSQL
\i complete-database.sql
```

### Opción 2: Restaurar Solo Datos (en tablas existentes)

```sql
-- Primero crear las tablas, luego ejecutar:
\i data-only.sql
```

### Opción 3: Restaurar Tabla Individual

```sql
-- Ejecutar el archivo SQL de la tabla específica
\i nombre_tabla.sql
```

## 📈 Ejemplo de Salida

```
🚀 Iniciando backup de base de datos de Supabase...
============================================================
✅ Variables de entorno verificadas
ℹ️  Directorio de backup creado: /ruta/proyecto/backups
ℹ️  Usando Service Role Key para acceso completo a los datos
ℹ️  Encontradas 4 tablas: courses, students, classes, invoices

📋 Procesando tabla: courses
ℹ️  Obteniendo datos de la tabla: courses
✅ courses: 3 registros obtenidos
✅ Tabla courses procesada exitosamente

📋 Procesando tabla: students
ℹ️  Obteniendo datos de la tabla: students
✅ students: 15 registros obtenidos
✅ Tabla students procesada exitosamente

📋 Procesando tabla: classes
ℹ️  Obteniendo datos de la tabla: classes
✅ classes: 45 registros obtenidos
✅ Tabla classes procesada exitosamente

📋 Procesando tabla: invoices
ℹ️  Obteniendo datos de la tabla: invoices
✅ invoices: 8 registros obtenidos
✅ Tabla invoices procesada exitosamente

✅ Datos guardados como JSON: /ruta/backups/backup_2024-01-15_14-30-25/courses.json
✅ Datos guardados como JSON: /ruta/backups/backup_2024-01-15_14-30-25/students.json
✅ Datos guardados como JSON: /ruta/backups/backup_2024-01-15_14-30-25/classes.json
✅ Datos guardados como JSON: /ruta/backups/backup_2024-01-15_14-30-25/invoices.json
✅ Reporte de backup generado: /ruta/backups/backup_2024-01-15_14-30-25/backup-report.md

============================================================
✅ ¡Backup completado exitosamente!
ℹ️  Directorio de backup: /ruta/backups/backup_2024-01-15_14-30-25
ℹ️  Total de tablas: 4
ℹ️  Total de registros: 71
ℹ️  Archivos generados: 13
============================================================
```

## ⚠️ Consideraciones Importantes

### Seguridad

- **Service Role Key**: Si usas la Service Role Key, tendrás acceso completo a todos los datos, incluso los protegidos por RLS
- **Anon Key**: Con la Anon Key, algunos datos pueden estar restringidos por las políticas de Row Level Security
- **Archivos de backup**: Contienen datos sensibles, mantén los archivos seguros

### Limitaciones

- **Tamaño**: Para bases de datos muy grandes, el proceso puede tomar tiempo
- **Conexión**: Requiere conexión estable a internet
- **Permisos**: Necesita permisos de lectura en todas las tablas

### Mejores Prácticas

1. **Ejecutar regularmente**: Programa backups automáticos
2. **Verificar archivos**: Revisa el reporte generado
3. **Almacenar seguramente**: Guarda los backups en un lugar seguro
4. **Probar restauración**: Verifica que los archivos se pueden restaurar correctamente

## 🔧 Solución de Problemas

### Error: "Variables de entorno faltantes"

```bash
# Verifica que tienes un archivo .env.local con:
NEXT_PUBLIC_SUPABASE_URL=tu_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key_aqui
```

### Error: "No se encontraron tablas"

- Verifica que las credenciales de Supabase son correctas
- Asegúrate de que el proyecto de Supabase existe y está activo
- Revisa que tienes permisos de lectura en las tablas

### Error: "Error obteniendo datos de tabla"

- Algunas tablas pueden tener restricciones de RLS
- Usa la Service Role Key para acceso completo
- Verifica que la tabla existe y tiene datos

## 📞 Soporte

Si encuentras problemas:

1. Revisa el archivo `backup-report.md` generado
2. Verifica las variables de entorno
3. Comprueba la conexión a Supabase
4. Revisa los logs de error en la consola

## 🎯 Casos de Uso

- **Migración**: Mover datos entre entornos
- **Respaldo**: Crear copias de seguridad regulares
- **Análisis**: Exportar datos para análisis externos
- **Desarrollo**: Crear datasets de prueba
- **Auditoría**: Documentar el estado de la base de datos

---

**Nota**: Este script es de solo lectura y no modifica la base de datos original. Es seguro ejecutarlo en cualquier momento.
