# Guía de Migración: SQLite → Supabase

## 🔄 Cambios Realizados

### 1. Dependencias
- ✅ Agregado `@supabase/supabase-js`
- ✅ Removido `better-sqlite3` (ya no necesario)

### 2. Base de Datos
- ✅ Migrado de SQLite a PostgreSQL (Supabase)
- ✅ Actualizado esquema con tipos PostgreSQL
- ✅ Agregado Row Level Security (RLS)
- ✅ Implementado triggers para `updated_at`

### 3. Cliente de Base de Datos
- ✅ Reemplazado Map en memoria con Supabase
- ✅ Convertido todas las operaciones a async/await
- ✅ Agregado manejo de errores robusto
- ✅ Implementado joins automáticos

### 4. APIs
- ✅ Actualizado todas las rutas API para usar async/await
- ✅ Mantenida compatibilidad con frontend existente
- ✅ Agregado manejo de errores mejorado

## 📋 Checklist de Migración

### Antes de la Migración
- [ ] Hacer backup de datos existentes (si los hay)
- [ ] Crear proyecto en Supabase
- [ ] Configurar variables de entorno

### Durante la Migración
- [ ] Ejecutar script `supabase-schema.sql`
- [ ] Verificar que todas las tablas se crearon
- [ ] Probar conexión con la aplicación

### Después de la Migración
- [ ] Probar todas las funcionalidades
- [ ] Verificar que los datos se cargan correctamente
- [ ] Confirmar que las operaciones CRUD funcionan

## 🔧 Archivos Modificados

### Nuevos Archivos
- `lib/supabase.ts` - Cliente de Supabase
- `supabase-schema.sql` - Esquema de base de datos
- `supabase-config.example` - Ejemplo de configuración
- `SUPABASE_SETUP.md` - Guía de configuración

### Archivos Modificados
- `lib/database.ts` - Migrado a Supabase
- `app/api/courses/route.ts` - Actualizado para async
- `app/api/courses/[id]/route.ts` - Actualizado para async
- `app/api/students/route.ts` - Actualizado para async
- `app/api/students/[id]/route.ts` - Actualizado para async
- `app/api/classes/route.ts` - Actualizado para async

## 🚨 Consideraciones Importantes

### Tipos de Datos
- `INTEGER` → `SERIAL` (auto-increment)
- `REAL` → `DECIMAL(10,2)` (precisión monetaria)
- `TEXT` → `TEXT` (sin cambios)
- `BOOLEAN` → `BOOLEAN` (sin cambios)
- `DATETIME` → `TIMESTAMP WITH TIME ZONE`

### Relaciones
- Foreign keys mantenidas
- CASCADE para eliminaciones
- RESTRICT para actualizaciones

### Índices
- Mantenidos todos los índices existentes
- Agregados índices adicionales para optimización

## 🎯 Beneficios de la Migración

### Escalabilidad
- Maneja millones de registros
- Consultas optimizadas
- Caché automático

### Funcionalidades
- Tiempo real (futuro)
- Autenticación (futuro)
- Storage (futuro)
- Edge Functions (futuro)

### Mantenimiento
- Dashboard web
- Logs centralizados
- Backup automático
- Monitoreo integrado

## 🔍 Verificación Post-Migración

### Pruebas Básicas
1. **Cargar página principal** - Verificar que no hay errores
2. **Listar cursos** - Verificar que se cargan desde Supabase
3. **Crear curso** - Verificar que se guarda en Supabase
4. **Editar curso** - Verificar que se actualiza en Supabase
5. **Eliminar curso** - Verificar que se elimina de Supabase

### Pruebas Avanzadas
1. **Gestión de estudiantes** - CRUD completo
2. **Programación de clases** - Creación y edición
3. **Generación de facturas** - Funcionalidad completa
4. **Búsquedas y filtros** - Rendimiento optimizado

## 🆘 Solución de Problemas Comunes

### Error: "Invalid API key"
- Verificar variables de entorno
- Confirmar que las claves son correctas

### Error: "Table doesn't exist"
- Ejecutar script `supabase-schema.sql`
- Verificar en dashboard de Supabase

### Error: "Permission denied"
- Verificar políticas RLS
- Confirmar que las tablas tienen permisos correctos

### Error: "Connection timeout"
- Verificar conectividad a internet
- Confirmar que Supabase está activo

## 📞 Soporte

Si encuentras problemas durante la migración:

1. Revisa los logs en el dashboard de Supabase
2. Verifica la consola del navegador para errores
3. Consulta la documentación de Supabase
4. Revisa los logs del servidor Next.js

¡La migración está completa y tu CRM está listo para escalar! 🚀
