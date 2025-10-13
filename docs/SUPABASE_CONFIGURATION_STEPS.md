# 🚀 Guía de Configuración de Supabase - Profesor Eureka CRM

## 📋 Pasos para Conectar tu Proyecto con Supabase

### 1. 🔑 Obtener las Credenciales de tu Proyecto

1. **Accede a tu dashboard de Supabase**:
   - Ve a [supabase.com](https://supabase.com)
   - Inicia sesión con tu cuenta
   - Selecciona tu proyecto

2. **Obtener las credenciales**:
   - Ve a **Settings** → **API** (en el menú lateral)
   - Copia los siguientes valores:
     - **Project URL** (algo como `https://xxxxx.supabase.co`)
     - **anon public** key (la clave pública larga)

### 2. ⚙️ Configurar Variables de Entorno

1. **Crear archivo de configuración**:
   ```bash
   # En la raíz del proyecto
   cp supabase-config.example .env.local
   ```

2. **Editar el archivo `.env.local`**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon-aqui
   ```

### 3. 🗄️ Configurar la Base de Datos

1. **Acceder al SQL Editor**:
   - En tu dashboard de Supabase
   - Ve a **SQL Editor** (en el menú lateral)

2. **Ejecutar el script de base de datos**:
   - Copia todo el contenido del archivo `supabase-schema.sql`
   - Pégalo en el editor SQL
   - Haz clic en **Run** para ejecutar el script

3. **Verificar que se crearon las tablas**:
   - Ve a **Table Editor** (en el menú lateral)
   - Deberías ver las siguientes tablas:
     - `courses`
     - `students` (con los nuevos campos `student_code` y `fixed_schedule`)
     - `classes`
     - `invoices`

### 4. 🔒 Configurar Políticas de Seguridad (RLS)

1. **Verificar Row Level Security**:
   - Ve a **Authentication** → **Policies**
   - Deberías ver políticas para cada tabla

2. **Si no hay políticas, crearlas**:
   ```sql
   -- Política para courses
   CREATE POLICY "Allow all operations on courses" ON courses FOR ALL USING (true);
   
   -- Política para students
   CREATE POLICY "Allow all operations on students" ON students FOR ALL USING (true);
   
   -- Política para classes
   CREATE POLICY "Allow all operations on classes" ON classes FOR ALL USING (true);
   
   -- Política para invoices
   CREATE POLICY "Allow all operations on invoices" ON invoices FOR ALL USING (true);
   ```

### 5. 🧪 Probar la Conexión

1. **Iniciar el servidor de desarrollo**:
   ```bash
   pnpm dev
   ```

2. **Verificar que funciona**:
   - Ve a `http://localhost:3000`
   - Intenta crear un nuevo alumno
   - Verifica que se guarde en Supabase

3. **Verificar en Supabase**:
   - Ve a **Table Editor** → **students**
   - Deberías ver el nuevo alumno con su código único

### 6. 🔍 Verificación de Campos Nuevos

#### Campos Añadidos a la Tabla `students`:

1. **`student_code`** (TEXT UNIQUE NOT NULL):
   - Código único de 20 dígitos
   - Generado automáticamente
   - Formato: `12345678901234567890`

2. **`fixed_schedule`** (TEXT NULL):
   - Descripción del horario fijo del alumno
   - Campo opcional
   - Ejemplo: "Lunes y Miércoles de 16:00 a 17:00"

#### Índices Creados:
- `idx_students_code`: Para búsquedas rápidas por código
- `idx_students_course_id`: Para consultas por curso
- `idx_students_email`: Para búsquedas por email

### 7. 🎯 Funcionalidades del Código de Estudiante

#### Características:
- **Longitud**: 20 dígitos numéricos
- **Unicidad**: Garantizada por la base de datos
- **Formato de visualización**: `1234-5678-9012-3456-7890`
- **Regeneración**: Botón para generar nuevo código
- **Uso futuro**: Para registro de estudiantes

#### En el Modal de Creación:
- Campo de solo lectura con código generado
- Botón "Regenerar" para crear nuevo código
- Formato visual con guiones cada 4 dígitos
- Descripción explicativa del propósito

### 8. 🚨 Solución de Problemas Comunes

#### Error: "Invalid API key"
- **Solución**: Verifica que las variables de entorno estén correctas
- **Verificar**: Que no haya espacios extra en `.env.local`

#### Error: "Table doesn't exist"
- **Solución**: Ejecuta nuevamente el script `supabase-schema.sql`
- **Verificar**: Que todas las tablas se crearon correctamente

#### Error: "Permission denied"
- **Solución**: Verifica que las políticas RLS estén configuradas
- **Verificar**: Que las políticas permitan operaciones en las tablas

#### Error: "Connection timeout"
- **Solución**: Verifica tu conexión a internet
- **Verificar**: Que el proyecto de Supabase esté activo

### 9. 📊 Verificación Final

#### Checklist de Verificación:
- [ ] Variables de entorno configuradas correctamente
- [ ] Script SQL ejecutado sin errores
- [ ] Tablas creadas con todos los campos
- [ ] Políticas RLS configuradas
- [ ] Servidor de desarrollo funcionando
- [ ] Creación de alumno exitosa
- [ ] Código único generado correctamente
- [ ] Datos visibles en Supabase

### 10. 🎉 ¡Listo!

Tu proyecto Profesor Eureka CRM ahora está completamente conectado a Supabase con las nuevas funcionalidades:

- ✅ **Base de datos PostgreSQL** en la nube
- ✅ **Códigos únicos** de 20 dígitos para estudiantes
- ✅ **Horarios fijos** personalizables
- ✅ **Escalabilidad** ilimitada
- ✅ **Backup automático** de datos
- ✅ **Dashboard web** para administración

### 📞 Soporte Adicional

Si encuentras problemas:
1. Revisa los logs en el dashboard de Supabase
2. Verifica la consola del navegador
3. Consulta la documentación oficial de Supabase
4. Revisa los logs del servidor Next.js

¡Tu CRM está listo para gestionar estudiantes de manera profesional! 🚀
