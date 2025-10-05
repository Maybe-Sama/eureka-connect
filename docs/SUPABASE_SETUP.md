# Configuración de Supabase para EurekaProfe CRM

Este proyecto ha sido migrado de SQLite a Supabase para una mejor escalabilidad y funcionalidades en la nube.

## 🚀 Pasos para Configurar Supabase

### 1. Crear un Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Haz clic en "New Project"
4. Completa la información del proyecto:
   - **Name**: `eureka-profe-crm`
   - **Database Password**: Genera una contraseña segura
   - **Region**: Selecciona la región más cercana a ti

### 2. Obtener las Credenciales

Una vez creado el proyecto:

1. Ve a **Settings** → **API**
2. Copia los siguientes valores:
   - **Project URL** (algo como `https://xxxxx.supabase.co`)
   - **anon public** key (la clave pública)

### 3. Configurar Variables de Entorno

1. Crea un archivo `.env.local` en la raíz del proyecto
2. Agrega las siguientes variables:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_project_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

### 4. Ejecutar el Esquema de Base de Datos

1. Ve a **SQL Editor** en tu dashboard de Supabase
2. Copia el contenido del archivo `supabase-schema.sql`
3. Pega y ejecuta el script SQL
4. Esto creará todas las tablas, índices y datos iniciales

### 5. Verificar la Configuración

1. Reinicia el servidor de desarrollo:
   ```bash
   pnpm dev
   ```

2. Ve a `http://localhost:3000` y verifica que la aplicación funcione correctamente

## 📊 Estructura de la Base de Datos

El esquema incluye las siguientes tablas:

- **courses**: Cursos disponibles
- **students**: Información de estudiantes
- **classes**: Clases programadas
- **invoices**: Facturas generadas

### Características Implementadas

- ✅ **Row Level Security (RLS)**: Políticas de seguridad configuradas
- ✅ **Triggers**: Actualización automática de `updated_at`
- ✅ **Índices**: Optimización de consultas
- ✅ **Relaciones**: Foreign keys entre tablas
- ✅ **Validaciones**: Constraints de datos

## 🔧 Funcionalidades de Supabase

### Ventajas sobre SQLite

1. **Escalabilidad**: Maneja millones de registros
2. **Tiempo Real**: Actualizaciones en vivo
3. **Autenticación**: Sistema de usuarios integrado
4. **Storage**: Almacenamiento de archivos
5. **Edge Functions**: Funciones serverless
6. **Dashboard**: Interfaz web para administración

### Funcionalidades Futuras

- **Autenticación de usuarios**: Login/registro
- **Notificaciones en tiempo real**: Actualizaciones automáticas
- **Backup automático**: Respaldo de datos
- **Analytics**: Métricas de uso
- **API REST**: Endpoints automáticos

## 🛠️ Comandos Útiles

```bash
# Instalar dependencias
pnpm install

# Ejecutar en desarrollo
pnpm dev

# Construir para producción
pnpm build

# Ejecutar en producción
pnpm start
```

## 📝 Notas Importantes

1. **Seguridad**: Las claves de API están expuestas en el cliente, pero Supabase maneja la seguridad con RLS
2. **Costo**: Supabase tiene un plan gratuito generoso para proyectos pequeños
3. **Backup**: Los datos se respaldan automáticamente
4. **Escalabilidad**: Fácil migración a planes superiores cuando sea necesario

## 🆘 Solución de Problemas

### Error de Conexión
- Verifica que las variables de entorno estén correctas
- Asegúrate de que el proyecto de Supabase esté activo

### Error de Permisos
- Verifica que las políticas RLS estén configuradas correctamente
- Revisa los logs en el dashboard de Supabase

### Error de Esquema
- Ejecuta nuevamente el script `supabase-schema.sql`
- Verifica que todas las tablas se hayan creado correctamente

## 📞 Soporte

Si tienes problemas con la configuración:

1. Revisa los logs en el dashboard de Supabase
2. Verifica la documentación oficial de Supabase
3. Consulta los logs del servidor Next.js

¡Tu CRM ahora está listo para escalar! 🚀
