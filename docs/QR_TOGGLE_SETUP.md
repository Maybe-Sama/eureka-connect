# Configuración del Toggle QR VeriFactu

## Problema Actual
El error `Could not find the 'incluye_qr' column of 'facturas_rrsif' in the schema cache` indica que el campo `incluye_qr` no existe en la tabla de Supabase.

## Solución

### 1. Ejecutar Migración en Supabase

1. **Abrir Supabase Dashboard**
   - Ve a tu proyecto en [supabase.com](https://supabase.com)
   - Navega a **SQL Editor**

2. **Ejecutar Script de Migración**
   - Copia y pega el contenido de `database/migrate-add-incluye-qr.sql`
   - Ejecuta el script

3. **Verificar Migración**
   - Ejecuta el script de `database/check-incluye-qr-field.sql`
   - Debe mostrar que el campo `incluye_qr` existe

### 2. Descomentar Código

Una vez ejecutada la migración, descomenta esta línea en `app/api/rrsif/generar-factura/route.ts`:

```typescript
// Cambiar esto:
// incluye_qr: incluirQR // Temporalmente comentado hasta que se ejecute la migración

// Por esto:
incluye_qr: incluirQR
```

### 3. Probar el Sistema

1. **Toggle Desactivado**: Debe generar facturas sin QR
2. **Toggle Activado**: Debe generar facturas con QR
3. **Indicadores**: Las tarjetas deben mostrar el estado correcto

## Archivos de Migración

- `database/migrate-add-incluye-qr.sql` - Script principal de migración
- `database/check-incluye-qr-field.sql` - Script de verificación
- `database/add-incluye-qr-field.sql` - Script simple (alternativo)

## Notas

- El sistema funciona con fallback usando `hash_registro` hasta que se ejecute la migración
- Las facturas existentes se marcarán automáticamente como con QR si tienen hash
- Una vez ejecutada la migración, el sistema funcionará completamente
