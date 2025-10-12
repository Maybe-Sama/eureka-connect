# 🐛 Solución de Problemas - Sistema de Avatares

## 🔍 Diagnóstico paso a paso

### 1. **Verificar que el bucket existe**
Ve a tu panel de Supabase → Storage y verifica que:
- ✅ Existe el bucket `avatars`
- ✅ El bucket está marcado como **público**
- ✅ Existe la carpeta `defaults` dentro del bucket

### 2. **Verificar que las imágenes están subidas**
En la carpeta `defaults` del bucket `avatars`:
- ✅ Debe haber al menos 1 imagen
- ✅ Las imágenes deben tener nombres válidos (sin espacios, caracteres especiales)
- ✅ Formato recomendado: PNG o JPG

### 3. **Verificar la base de datos**
Ejecuta en el SQL Editor de Supabase:

```sql
-- Verificar que el campo avatar_url existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'students' 
AND column_name = 'avatar_url';

-- Verificar que hay estudiantes en la tabla
SELECT id, first_name, last_name, avatar_url 
FROM students 
LIMIT 5;

-- Verificar la relación con system_users
SELECT su.id, su.student_id, s.first_name, s.last_name, s.avatar_url
FROM system_users su
LEFT JOIN students s ON su.student_id = s.id
WHERE su.user_type = 'student'
LIMIT 5;
```

### 4. **Verificar en la consola del navegador**
1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña "Console"
3. Navega a la página de configuración del estudiante
4. Busca estos mensajes:

**✅ Mensajes esperados:**
```
🔄 Cargando avatares predefinidos...
📁 Datos de storage: { data: [...], error: null }
🖼️ Avatar URL: avatar1.png -> https://...
✅ Avatares predefinidos cargados: [...]
```

**❌ Mensajes de error comunes:**
```
❌ Error loading predefined avatars: { message: "Bucket not found" }
❌ Error loading predefined avatars: { message: "Permission denied" }
⚠️ No se encontraron avatares predefinidos
```

### 5. **Verificar las políticas de Storage**
En Supabase → Storage → Policies, debe existir:

```sql
-- Política para lectura pública
CREATE POLICY "Public read access for avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');
```

## 🚨 Problemas comunes y soluciones

### **Problema: "Bucket not found"**
**Solución:**
1. Ve a Storage → New bucket
2. Nombre: `avatars`
3. Marca como público: ✅
4. Create bucket

### **Problema: "Permission denied"**
**Solución:**
1. Ve a Storage → Policies
2. Crea la política de lectura pública (ver arriba)
3. O temporalmente haz el bucket público desde la configuración

### **Problema: "No se encontraron avatares predefinidos"**
**Solución:**
1. Ve al bucket `avatars`
2. Crea la carpeta `defaults`
3. Sube al menos 1 imagen a esa carpeta
4. Verifica que el nombre del archivo no tenga espacios o caracteres especiales

### **Problema: Los avatares no se muestran en la UI**
**Solución:**
1. Verifica la consola del navegador para errores
2. Asegúrate de que estás logueado como estudiante
3. Verifica que el `student_id` existe en `system_users`

### **Problema: Error al subir imagen personalizada**
**Solución:**
1. Verifica que el campo `avatar_url` existe en la tabla `students`
2. Verifica que el `student_id` está correctamente vinculado
3. Verifica los permisos de escritura en el bucket

## 🧪 Prueba rápida

Ejecuta este código en la consola del navegador para probar la conexión:

```javascript
// En la consola del navegador (F12)
const { createClient } = window.supabase || {};

if (createClient) {
  const supabase = createClient(
    'TU_SUPABASE_URL',
    'TU_SUPABASE_ANON_KEY'
  );
  
  // Probar listado de archivos
  supabase.storage
    .from('avatars')
    .list('defaults')
    .then(({ data, error }) => {
      console.log('Resultado:', { data, error });
    });
} else {
  console.log('Supabase no está disponible');
}
```

## 📞 Si nada funciona

1. **Verifica la configuración de Supabase:**
   - Variables de entorno correctas
   - Proyecto activo
   - Permisos de administrador

2. **Revisa los logs de Supabase:**
   - Ve a Logs en el panel de Supabase
   - Busca errores relacionados con Storage

3. **Prueba con un bucket de prueba:**
   - Crea un bucket temporal
   - Sube una imagen de prueba
   - Verifica que se puede acceder públicamente

## ✅ Checklist final

- [ ] Bucket `avatars` creado y público
- [ ] Carpeta `defaults` existe en el bucket
- [ ] Al menos 1 imagen subida en `defaults`
- [ ] Campo `avatar_url` existe en tabla `students`
- [ ] Política de lectura pública configurada
- [ ] Usuario logueado como estudiante
- [ ] `student_id` vinculado correctamente
- [ ] Sin errores en la consola del navegador
- [ ] URLs de avatares se generan correctamente

¡Si todos estos puntos están correctos, el sistema debería funcionar! 🎉
