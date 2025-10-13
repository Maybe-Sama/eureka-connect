# Migración: Campo status_invoice en Clases

## Descripción

Se ha implementado un sistema para prevenir que las clases ya facturadas se vuelvan a incluir en nuevas facturas. Esto se logra mediante un campo `status_invoice` en la tabla `classes` que indica si una clase ya ha sido incluida en una factura.

## Cambios Implementados

### 1. Base de Datos

- **Nuevo campo**: `status_invoice BOOLEAN DEFAULT 0` en la tabla `classes`
- **Valores**:
  - `0` (FALSE): La clase NO ha sido incluida en ninguna factura
  - `1` (TRUE): La clase YA ha sido incluida en una factura
- **Índice**: Se creó un índice para mejorar el rendimiento de las consultas

### 2. Funcionalidades

#### Creación de Facturas
- Al crear una factura, todas las clases incluidas se marcan automáticamente como `status_invoice = true`
- Solo las clases con `status_invoice = false` aparecen como disponibles para facturar

#### Eliminación de Facturas Provisionales
- Al eliminar una factura provisional, todas las clases asociadas se desmarcan (`status_invoice = false`)
- Esto permite que las clases vuelvan a estar disponibles para nuevas facturas

#### Filtrado de Clases
- El sistema filtra automáticamente las clases ya facturadas
- Solo se muestran clases pagadas que no han sido facturadas previamente

## Archivos Modificados

### Base de Datos
- `database/schema.sql` - Esquema actualizado con el nuevo campo
- `database/add-status-invoice-field.sql` - Script de migración SQL

### APIs
- `app/api/rrsif/generar-factura/route.ts` - Marca clases como facturadas
- `app/api/rrsif/eliminar-factura-provisional/route.ts` - Desmarca clases al eliminar factura

### Frontend
- `app/invoices/page.tsx` - Filtra clases no facturadas en la interfaz

### Librerías
- `lib/database.ts` - Nuevas funciones para manejar status_invoice

### Scripts
- `scripts/apply-status-invoice-migration.js` - Script de migración automática

## Instrucciones de Migración

### Opción 1: Migración Automática (Recomendada)

```bash
# 1. Ejecutar el script de migración
node scripts/apply-status-invoice-migration.js

# 2. Reiniciar el servidor de desarrollo
pnpm dev
```

### Opción 2: Migración Manual

```bash
# 1. Ejecutar el script SQL en tu base de datos
# (Usar el contenido de database/add-status-invoice-field.sql)

# 2. Verificar que el campo se agregó correctamente
# 3. Reiniciar el servidor de desarrollo
```

## Verificación

Después de aplicar la migración, verifica que:

1. ✅ El campo `status_invoice` existe en la tabla `classes`
2. ✅ Todas las clases existentes tienen `status_invoice = false`
3. ✅ Al crear una factura, las clases se marcan como facturadas
4. ✅ Al eliminar una factura provisional, las clases se desmarcan
5. ✅ Las clases ya facturadas no aparecen en nuevas facturas

## Beneficios

- **Prevención de duplicados**: Evita que las mismas clases se facturen múltiples veces
- **Trazabilidad**: Permite saber qué clases han sido facturadas
- **Flexibilidad**: Las facturas provisionales pueden eliminarse y las clases volver a estar disponibles
- **Rendimiento**: Índice optimizado para consultas rápidas

## Notas Técnicas

- El campo se inicializa como `FALSE` para todas las clases existentes
- La migración es segura y no afecta datos existentes
- El sistema es retrocompatible con facturas ya creadas
- Se mantiene la integridad referencial de la base de datos

## Solución de Problemas

### Error: "column status_invoice does not exist"
- Ejecuta primero el script SQL: `database/add-status-invoice-field.sql`
- Luego ejecuta el script de migración: `scripts/apply-status-invoice-migration.js`

### Clases no aparecen para facturar
- Verifica que `status_invoice = false` en la base de datos
- Asegúrate de que `payment_status = 'paid'` o `status = 'completed'`

### Error al marcar clases como facturadas
- Verifica permisos de la base de datos
- Revisa los logs del servidor para más detalles
