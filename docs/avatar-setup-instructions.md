# 🖼️ Configuración del Sistema de Avatares

## 📋 Resumen
Se ha implementado un sistema completo de personalización de avatares para estudiantes en `/app/student-dashboard/settings/page.tsx` que permite:
- Subir imágenes personalizadas desde el dispositivo
- Seleccionar avatares predefinidos
- Almacenamiento en Supabase Storage
- Persistencia en la base de datos

## 🗄️ Configuración de Base de Datos

### 1. Ejecutar migración
Ejecuta el siguiente archivo SQL en tu panel de Supabase:

```sql
-- Archivo: database/add-avatar-url-field.sql
-- Este script añade el campo avatar_url a la tabla students
```

### 2. Verificar migración
Después de ejecutar la migración, verifica que el campo se haya añadido correctamente:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'students' 
AND column_name = 'avatar_url';
```

## 🗂️ Configuración de Supabase Storage

### 1. Crear bucket "avatars"
1. Ve a tu panel de Supabase
2. Navega a **Storage** en el menú lateral
3. Haz clic en **"New bucket"**
4. Nombre del bucket: `avatars`
5. Marca como **público** (para mostrar imágenes sin autenticación)
6. Haz clic en **"Create bucket"**

### 2. Configurar permisos del bucket
En la pestaña **Policies** del bucket `avatars`:

```sql
-- Política para permitir lectura pública
CREATE POLICY "Public read access for avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Política para permitir subida de archivos (opcional, si quieres restricciones)
CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3. Crear carpeta para avatares predefinidos
1. En el bucket `avatars`, crea una carpeta llamada `defaults`
2. Sube 4-6 imágenes de avatar de ejemplo (formato PNG/JPG, 200x200px recomendado)
3. Nombra los archivos como: `avatar1.png`, `avatar2.png`, etc.

## 🎨 Características Implementadas

### ✅ Funcionalidades
- **Subida de imágenes personalizadas**: Los usuarios pueden subir sus propias fotos
- **Selección de avatares predefinidos**: Grid de avatares predefinidos para elegir
- **Validación de archivos**: Solo imágenes, máximo 5MB
- **Actualización en tiempo real**: La imagen se actualiza inmediatamente
- **Animaciones suaves**: Transiciones con Framer Motion
- **Notificaciones**: Toast de éxito/error para todas las acciones
- **Persistencia**: Los avatares se guardan en la base de datos

### 🎯 Estilo y UX
- **Diseño moderno**: Mantiene la estética del panel de estudiante
- **Imagen redonda**: Avatar circular con bordes suaves
- **Hover effects**: Animaciones al pasar el mouse
- **Loading states**: Indicadores de carga durante la subida
- **Responsive**: Se adapta a diferentes tamaños de pantalla

## 🔧 Archivos Modificados

### 1. `app/student-dashboard/settings/page.tsx`
- ✅ Añadidas importaciones necesarias (Supabase, Framer Motion, iconos)
- ✅ Estados para manejo de avatares
- ✅ Funciones de carga y actualización de avatares
- ✅ UI completa con subida y selección de avatares
- ✅ Integración con sistema de notificaciones existente

### 2. `database/add-avatar-url-field.sql`
- ✅ Migración para añadir campo `avatar_url` a tabla `students`
- ✅ Índice para optimización de consultas
- ✅ Documentación del campo

## 🚀 Cómo Usar

### Para Estudiantes:
1. Ve a **Configuración** en tu panel de estudiante
2. En la sección **"Foto de perfil"**:
   - Haz clic en **"Subir imagen"** para subir tu propia foto
   - O selecciona uno de los avatares predefinidos
3. La imagen se actualizará automáticamente
4. Recibirás una notificación de confirmación

### Para Desarrolladores:
```typescript
// Cargar avatar del usuario
const { data } = await supabase
  .from('students')
  .select('avatar_url')
  .eq('id', userId)
  .single()

// Subir nuevo avatar
const { error } = await supabase.storage
  .from('avatars')
  .upload(`user-${userId}.png`, file, { upsert: true })

// Obtener URL pública
const { data: { publicUrl } } = supabase.storage
  .from('avatars')
  .getPublicUrl(`user-${userId}.png`)
```

## 🐛 Solución de Problemas

### Error: "Bucket 'avatars' not found"
- Verifica que el bucket `avatars` existe en Supabase Storage
- Asegúrate de que el nombre sea exactamente `avatars`

### Error: "Permission denied"
- Verifica las políticas de acceso del bucket
- Asegúrate de que el bucket sea público para lectura

### Error: "Column 'avatar_url' does not exist"
- Ejecuta la migración `database/add-avatar-url-field.sql`
- Verifica que la migración se ejecutó correctamente

### Las imágenes predefinidas no aparecen
- Verifica que la carpeta `defaults` existe en el bucket `avatars`
- Asegúrate de que las imágenes están en formato PNG/JPG
- Verifica que los archivos tienen nombres válidos

## 📝 Notas Adicionales

- **Formato de archivos**: Se recomienda PNG para transparencias, JPG para fotos
- **Tamaño**: Las imágenes se redimensionan automáticamente a 200x200px
- **Límite de tamaño**: 5MB máximo por archivo
- **Nomenclatura**: Los archivos subidos se nombran como `user-{userId}.{ext}`
- **Backup**: Los avatares se almacenan en Supabase Storage, no localmente

## ✅ Verificación Final

Para verificar que todo funciona correctamente:

1. ✅ Bucket `avatars` creado y configurado
2. ✅ Campo `avatar_url` añadido a tabla `students`
3. ✅ Imágenes predefinidas subidas a `defaults/`
4. ✅ Políticas de acceso configuradas
5. ✅ Interfaz de usuario funcionando
6. ✅ Subida de imágenes funcionando
7. ✅ Selección de avatares predefinidos funcionando
8. ✅ Notificaciones mostrándose correctamente
9. ✅ Persistencia en base de datos funcionando

¡El sistema de avatares está listo para usar! 🎉
