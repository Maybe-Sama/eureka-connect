# 🚀 GUÍA COMPLETA: Configurar Facturas con Supabase

## ✅ **LO QUE YA ESTÁ HECHO**

He implementado todas las correcciones necesarias en el código:

1. **✅ Endpoint de facturas corregido** - Ahora usa Supabase en lugar de memoria
2. **✅ Endpoint de generar-factura corregido** - Guarda directamente en Supabase
3. **✅ Script SQL completo creado** - Listo para ejecutar en Supabase

## 📋 **PASOS QUE DEBES SEGUIR TÚ**

### **PASO 1: Ejecutar el Script SQL en Supabase**

1. **Abre tu dashboard de Supabase**:
   - Ve a [supabase.com](https://supabase.com)
   - Inicia sesión y selecciona tu proyecto

2. **Ir al SQL Editor**:
   - En el menú lateral, haz clic en **"SQL Editor"**

3. **Ejecutar el script**:
   - Copia TODO el contenido del archivo `database/supabase-facturas-complete.sql`
   - Pégalo en el editor SQL
   - Haz clic en **"Run"** para ejecutar

4. **Verificar que se crearon las tablas**:
   - Ve a **"Table Editor"** en el menú lateral
   - Deberías ver estas nuevas tablas:
     - `facturas_rrsif`
     - `factura_clases`
     - `eventos_rrsif`
     - `configuracion_fiscal`

### **PASO 2: Verificar Variables de Entorno**

Asegúrate de que tu archivo `.env.local` tenga estas variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

**Para obtener la SERVICE_ROLE_KEY**:
1. En tu dashboard de Supabase
2. Ve a **Settings** → **API**
3. Copia la **"service_role"** key (NO la anon key)

### **PASO 3: Reiniciar el Servidor**

```bash
# Detener el servidor actual (Ctrl+C)
# Luego ejecutar:
pnpm dev
```

### **PASO 4: Probar la Integración**

1. **Ir a la página de facturas**:
   - Navega a `http://localhost:3000/invoices`

2. **Crear una factura de prueba**:
   - Selecciona un estudiante
   - Selecciona algunas clases
   - Configura los datos fiscales
   - Genera la factura

3. **Verificar en Supabase**:
   - Ve a **Table Editor** en Supabase
   - Abre la tabla `facturas_rrsif`
   - Deberías ver la factura recién creada

## 🔍 **VERIFICACIÓN DE QUE TODO FUNCIONA**

### **Señales de que está funcionando correctamente**:

1. **En la consola del navegador** (F12):
   - No deberías ver errores de conexión a Supabase
   - Los logs deberían mostrar "Factura guardada exitosamente en Supabase"

2. **En la consola del servidor**:
   - Deberías ver mensajes como:
     ```
     Guardando factura en Supabase: factura-1234567890
     Factura guardada exitosamente en Supabase: factura-1234567890
     ```

3. **En Supabase Table Editor**:
   - La tabla `facturas_rrsif` debería tener registros
   - La tabla `factura_clases` debería tener las clases asociadas

## 🚨 **SI ALGO NO FUNCIONA**

### **Error: "Variables de entorno de Supabase no encontradas"**
- Verifica que `.env.local` existe y tiene las variables correctas
- Reinicia el servidor después de cambiar las variables

### **Error: "Error al guardar factura en la base de datos"**
- Verifica que ejecutaste el script SQL completo
- Verifica que la SERVICE_ROLE_KEY es correcta

### **Error: "relation does not exist"**
- El script SQL no se ejecutó completamente
- Ejecuta el script de nuevo en Supabase

## 📊 **ANTES vs DESPUÉS**

### **ANTES (Problemático)**:
- ❌ Facturas se guardaban en memoria
- ❌ Se perdían al reiniciar el servidor
- ❌ No persistían en la base de datos

### **DESPUÉS (Corregido)**:
- ✅ Facturas se guardan en Supabase
- ✅ Persisten entre reinicios
- ✅ Consultas optimizadas con índices
- ✅ Seguridad con RLS configurada

## 🎯 **RESULTADO FINAL**

Una vez completados estos pasos:

1. **Las facturas se guardarán permanentemente** en Supabase
2. **No se perderán** al reiniciar el servidor
3. **Podrás consultar** todas las facturas desde cualquier lugar
4. **El sistema será escalable** y profesional

---

## 📞 **¿NECESITAS AYUDA?**

Si encuentras algún problema:

1. **Revisa los logs** en la consola del servidor
2. **Verifica las variables de entorno**
3. **Confirma que el script SQL se ejecutó** sin errores
4. **Comprueba que las tablas existen** en Supabase

¡El sistema de facturas ahora funcionará correctamente con Supabase! 🎉
