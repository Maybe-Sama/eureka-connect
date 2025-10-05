# Guía de Actualización de Clases hasta Hoy

## 🎯 Problema Solucionado

Antes, al hacer clic en "Ver Clases" en el seguimiento, **solo se mostraban las clases generadas en la base de datos**, que podían no llegar hasta el día actual.

**Ahora**, el sistema puede:
1. ✅ Generar automáticamente todas las clases faltantes desde el `start_date` hasta hoy
2. ✅ Mostrar TODAS las clases históricas de cada alumno
3. ✅ Actualizar las clases con un solo clic

---

## 🚀 Cómo Usar la Nueva Funcionalidad

### Paso 1: Acceder al Seguimiento de Clases

```bash
# Asegúrate de que el servidor esté corriendo
pnpm dev
```

Luego ve a: **`http://localhost:3000/class-tracking`**

### Paso 2: Actualizar las Clases

Verás un nuevo botón verde **"Actualizar Clases"** en la parte superior derecha.

**¿Qué hace este botón?**
- Revisa todos los alumnos con horario fijo y fecha de inicio
- Genera automáticamente las clases faltantes desde `start_date` hasta hoy
- Solo crea clases nuevas (no duplica las existentes)
- Guarda las clases físicamente en la base de datos

**¿Cuándo usarlo?**
- ✅ Después de crear un alumno nuevo con horario fijo
- ✅ Cuando las clases no llegan hasta el día actual
- ✅ Cuando quieras asegurarte de que todos los alumnos tienen sus clases actualizadas
- ✅ Periódicamente (ej: cada lunes) para mantener las clases al día

### Paso 3: Ver las Clases Actualizadas

1. Haz clic en **"Ver Clases"** de cualquier alumno
2. Ahora verás **TODAS las clases** desde su fecha de inicio hasta hoy
3. Las clases están ordenadas de más reciente a más antigua

---

## 📋 Detalles Técnicos

### ¿Qué Alumnos se Procesan?

El sistema procesa alumnos que cumplan:
- ✅ Tienen `fixed_schedule` (horario fijo) configurado
- ✅ Tienen `start_date` (fecha de inicio) definida
- ✅ El horario fijo tiene al menos un slot de tiempo

### ¿Cómo se Generan las Clases?

```
1. Lee el horario fijo del alumno (ej: Lunes 10:00-11:00, Miércoles 16:00-17:00)
2. Desde start_date hasta hoy:
   - Calcula todas las fechas que coinciden con los días configurados
   - Crea una clase para cada ocurrencia
   - Calcula el precio basado en la duración y el precio del curso
3. Evita duplicados comparando: fecha + hora_inicio + hora_fin
4. Inserta solo las clases nuevas en la base de datos
```

### Ejemplo de Resultado

```json
{
  "success": true,
  "totalClassesCreated": 45,
  "studentsProcessed": 6,
  "results": [
    {
      "studentId": 1,
      "studentName": "María García",
      "classesCreated": 12,
      "message": "12 clases creadas hasta 2025-10-01"
    },
    {
      "studentId": 2,
      "studentName": "Juan López",
      "classesCreated": 8,
      "message": "8 clases creadas hasta 2025-10-01"
    }
  ]
}
```

---

## 🛠️ Solución de Problemas

### Las clases siguen sin llegar hasta hoy

**Causa posible**: El alumno no tiene `start_date` o `fixed_schedule`

**Solución**:
1. Ve a `/students`
2. Edita el alumno
3. Asegúrate de que tenga:
   - ✅ Fecha de Inicio de Clases
   - ✅ Horario Fijo configurado
4. Guarda los cambios
5. Ve a `/class-tracking` y haz clic en "Actualizar Clases"

### El botón "Actualizar Clases" no hace nada

**Causa posible**: Error en la consola del navegador

**Solución**:
1. Abre DevTools (F12)
2. Ve a la pestaña **Console**
3. Busca errores en rojo
4. Si ves un error 500, revisa la terminal del servidor
5. Si ves errores de autenticación, verifica las variables de entorno de Supabase

### Se crearon clases duplicadas

**Causa posible**: No debería pasar, pero si ocurre:

**Solución**:
```sql
-- Eliminar duplicados manualmente en Supabase SQL Editor
WITH duplicates AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY student_id, date, start_time, end_time 
    ORDER BY created_at
  ) as rn
  FROM classes
)
DELETE FROM classes 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);
```

### Error: "Error al obtener estudiantes"

**Causa posible**: Problema de conexión con Supabase

**Solución**:
1. Verifica que el servidor esté corriendo
2. Verifica las variables de entorno en `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_url_aqui
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_aqui
   ```
3. Reinicia el servidor: `Ctrl+C` y luego `pnpm dev`

---

## 🔄 Actualización Automática vs Manual

### Automática (Recomendado)
- Usa el botón **"Actualizar Clases"** en `/class-tracking`
- Procesa todos los alumnos a la vez
- Muestra un resumen de las clases creadas
- Más rápido y seguro

### Manual (Avanzado)
Si prefieres usar la API directamente:

```bash
# Actualizar todos los alumnos
curl -X POST http://localhost:3000/api/class-tracking/generate-missing-classes \
  -H "Content-Type: application/json" \
  -d '{}'

# Actualizar un alumno específico
curl -X POST http://localhost:3000/api/class-tracking/generate-missing-classes \
  -H "Content-Type: application/json" \
  -d '{"studentId": 1}'
```

---

## 📊 Verificación en la Base de Datos

Para verificar que las clases se crearon correctamente:

### Opción 1: Desde Supabase Dashboard

1. Ve a **Table Editor** → **classes**
2. Filtra por `student_id` del alumno
3. Ordena por `date` descendente
4. Verifica que hay clases hasta hoy

### Opción 2: SQL Query

```sql
-- Ver clases de un alumno específico
SELECT 
  date, 
  start_time, 
  end_time, 
  status, 
  payment_status
FROM classes
WHERE student_id = 1
ORDER BY date DESC
LIMIT 50;

-- Ver la última clase de cada alumno
SELECT 
  s.first_name,
  s.last_name,
  MAX(c.date) as ultima_clase
FROM students s
LEFT JOIN classes c ON s.id = c.student_id
GROUP BY s.id, s.first_name, s.last_name;
```

---

## ✅ Checklist de Verificación

Después de usar "Actualizar Clases", verifica:

- [ ] El mensaje de éxito muestra el número correcto de clases creadas
- [ ] Al hacer clic en "Ver Clases", se muestran clases hasta hoy
- [ ] No hay clases duplicadas
- [ ] Las clases tienen el precio correcto
- [ ] El estado de las clases es "scheduled"
- [ ] El estado de pago es "unpaid"

---

## 🎉 Beneficios

### Antes
- ❌ Clases solo hasta cierta fecha
- ❌ Necesitabas crear clases manualmente
- ❌ Seguimiento incompleto

### Ahora
- ✅ Todas las clases hasta hoy automáticamente
- ✅ Un solo clic para actualizar
- ✅ Seguimiento completo y preciso
- ✅ Estadísticas exactas
- ✅ Facturación más fácil

---

## 📝 Recomendaciones

1. **Ejecuta "Actualizar Clases" semanalmente** para mantener el sistema al día
2. **Verifica los horarios fijos** de los alumnos antes de actualizar
3. **Revisa los resultados** después de cada actualización
4. **Mantén actualizada la fecha de inicio** de cada alumno

---

**Última actualización**: 1 de octubre de 2025

---

## 🆘 Soporte

Si tienes problemas:
1. Revisa esta guía completa
2. Consulta la consola del navegador (F12)
3. Revisa los logs del servidor (terminal)
4. Verifica la configuración de Supabase




