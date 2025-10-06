# 🔧 Correcciones Finales - Códigos de Estudiante con Guiones

## 📋 Problemas Identificados y Solucionados

### ❌ **Problema 1: Códigos con guiones no funcionaban**
- **Causa**: Los códigos se generan como `3339-2254-1291-6319-6576` pero las búsquedas no normalizaban el formato
- **Solución**: Función `normalizeStudentCode()` que elimina guiones y espacios

### ❌ **Problema 2: Mensaje de error incorrecto**
- **Causa**: El mensaje "Usuario no registrado. Por favor completa tu registro." aparecía en registro
- **Solución**: Mejorado el manejo de errores en `registerStudent()` con logs detallados

### ❌ **Problema 3: Páginas duplicadas de login/register**
- **Causa**: Existían `app/auth/login` y `app/(auth)/login` (dos versiones)
- **Solución**: Eliminadas las páginas viejas en `app/auth/`

---

## ✅ Cambios Aplicados

### 1. **Función de Normalización** (`lib/auth-complex.ts`)
```typescript
// Helper: Normalizar código de estudiante (quitar guiones, espacios, etc.)
function normalizeStudentCode(code: string): string {
  return code.replace(/[-\s]/g, '').trim().toUpperCase()
}
```

### 2. **Funciones Actualizadas**
- ✅ `authenticateStudent()` - Normaliza código antes de buscar
- ✅ `verifyStudentCode()` - Normaliza código antes de verificar
- ✅ `registerStudent()` - Normaliza código antes de registrar

### 3. **Logs Mejorados**
```typescript
console.log('🔵 Registering student with code:', normalizedCode)
console.log('🔵 RPC result:', { data, error })
console.log('✅ Student registered successfully')
console.error('❌ Error from RPC:', error)
```

### 4. **Archivos Eliminados**
- ❌ `app/auth/login/page.tsx` (viejo, no funcional)
- ❌ `app/auth/register/page.tsx` (viejo, no funcional)

---

## 🗄️ Migración de Base de Datos Requerida

### ⚠️ **IMPORTANTE: Ejecuta este script en Supabase**

**Archivo**: `database/normalize-student-codes.sql`

Este script hace dos cosas:

1. **Normaliza códigos existentes** (quita guiones de todos los registros)
2. **Actualiza el RPC** `create_student_user` para normalizar códigos automáticamente

### 📝 **Pasos para Ejecutar:**

1. **Abre Supabase** → SQL Editor
2. **Copia TODO el contenido** de `database/normalize-student-codes.sql`
3. **Pega** en el SQL Editor
4. **Click en "Run"** (o Ctrl+Enter)
5. **Verifica los resultados**:
   - Debe mostrar los códigos sin guiones
   - Debe confirmar que la función fue actualizada

### ✅ **Verificación:**
```sql
-- Este query debe devolver 0
SELECT COUNT(*) FROM public.students WHERE student_code LIKE '%-%';

-- Este query debe mostrar códigos sin guiones
SELECT student_code, first_name, last_name 
FROM public.students 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## 🧪 Pruebas a Realizar

### **Test 1: Código con Guiones**
1. Ve a `http://localhost:3002/(auth)/register`
2. Ingresa un código **con guiones**: `3339-2254-1291-6319-6576`
3. **Resultado Esperado**: ✅ Check verde, código válido

### **Test 2: Código sin Guiones**
1. Ve a `http://localhost:3002/(auth)/register`
2. Ingresa el mismo código **sin guiones**: `33392254129163196576`
3. **Resultado Esperado**: ✅ Check verde, código válido

### **Test 3: Registro Completo**
1. Ingresa un código válido (con o sin guiones)
2. Espera el check verde
3. Click en "Continuar"
4. Ingresa contraseña (mínimo 6 caracteres)
5. Repite la contraseña
6. Click en "Completar Registro"
7. **Resultado Esperado**: 
   - ✅ "¡Registro Exitoso!"
   - ➡️ Redirección a `/login`

### **Test 4: Logs en Consola**
Abre la consola del navegador (F12) y busca:
- 🔵 `Registering student with code: XXXXX` (sin guiones)
- 🔵 `RPC result: { data: 'uuid', error: null }`
- ✅ `Student registered successfully`

Si ves ❌ errores, copia el mensaje completo.

---

## 🚨 Troubleshooting

### **Error: "Código de estudiante no encontrado o ya registrado"**

**Posibles Causas:**
1. El código no existe en la tabla `students`
2. El código ya fue registrado en `system_users`
3. No ejecutaste el script de migración

**Solución:**
```sql
-- Verifica que el código existe
SELECT * FROM students WHERE student_code = '33392254129163196576';

-- Verifica si ya está registrado
SELECT su.* 
FROM system_users su
JOIN students s ON su.student_id = s.id
WHERE s.student_code = '33392254129163196576';
```

### **Error: "function public.create_student_user(text, text) does not exist"**

**Causa**: No ejecutaste el script de migración

**Solución**: Ejecuta `database/normalize-student-codes.sql`

### **Error: "Usuario no registrado. Por favor completa tu registro."**

**Causa**: Estás en LOGIN en lugar de REGISTER

**Solución**: 
- Asegúrate de estar en `http://localhost:3002/(auth)/register`
- NO en `/login` o `/(auth)/login`

---

## 📊 Resumen de URLs Correctas

| Función | URL Correcta | Eliminar |
|---------|-------------|----------|
| **Login** | `http://localhost:3002/(auth)/login` | ✅ |
| **Register** | `http://localhost:3002/(auth)/register` | ✅ |
| ~~Login Viejo~~ | ~~`/auth/login`~~ | ❌ ELIMINADO |
| ~~Register Viejo~~ | ~~`/auth/register`~~ | ❌ ELIMINADO |

---

## 🎯 Checklist de Verificación

Antes de continuar con las pruebas, confirma:

- [ ] ✅ Ejecutaste `database/normalize-student-codes.sql` en Supabase
- [ ] ✅ Los códigos en la base de datos ya no tienen guiones
- [ ] ✅ La función `create_student_user` está actualizada
- [ ] ✅ El servidor está corriendo en `http://localhost:3002`
- [ ] ✅ Tienes un código de estudiante válido para probar
- [ ] ✅ Ese código NO está ya registrado

---

## 📞 Siguiente Paso

Una vez que ejecutes el script de migración, prueba:

1. **Register con código con guiones** → Debe funcionar ✅
2. **Register con código sin guiones** → Debe funcionar ✅
3. **Login con el estudiante registrado** → Debe ir a `/student-dashboard/profile` ✅

---

**Fecha**: 2025-10-05  
**Puerto del servidor**: 3002  
**Estado**: ✅ CORRECCIONES APLICADAS - PENDIENTE MIGRACIÓN DB


