# Verificación del Campo start_date en Supabase

## 🎯 Objetivo

Este documento explica cómo verificar y configurar el campo `start_date` en la tabla `students` de Supabase, necesario para el seguimiento de clases desde el inicio de la actividad de cada alumno.

## ✅ Verificación Automática

Ejecuta el siguiente comando para verificar si el campo existe:

```bash
node scripts/migrate-add-start-date.js
```

## 📝 Verificación Manual

### Opción 1: Desde el Dashboard de Supabase

1. Ve a [tu proyecto en Supabase](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Table Editor** → **students**
4. Verifica que exista una columna llamada `start_date` de tipo `DATE`

### Opción 2: Usando SQL Editor

1. Ve a **SQL Editor** en tu dashboard de Supabase
2. Ejecuta esta consulta:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'students' 
AND column_name = 'start_date';
```

Si devuelve un resultado, el campo existe. Si no devuelve nada, necesitas crearlo.

## 🔧 Agregar el Campo (Si No Existe)

Si el campo `start_date` no existe, ejecuta este comando SQL en el **SQL Editor** de Supabase:

```sql
-- Agregar la columna start_date a la tabla students
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS start_date DATE;

-- Opcional: Agregar un comentario descriptivo
COMMENT ON COLUMN students.start_date IS 'Fecha de inicio de actividad del alumno';

-- Opcional: Establecer una fecha por defecto para alumnos existentes
UPDATE students 
SET start_date = CURRENT_DATE 
WHERE start_date IS NULL;
```

## 🎨 Funcionalidad Implementada

Una vez que el campo `start_date` esté configurado:

### 1. Formulario de Alumnos
- Al crear un nuevo alumno, el formulario solicita la **"Fecha de Inicio de Clases"**
- Este campo es **obligatorio**
- Se guarda en la base de datos como `start_date`

### 2. Seguimiento de Clases
El apartado de seguimiento (`/class-tracking`) ahora:

- ✅ **Identifica todos los alumnos** y los muestra en el panel principal
- ✅ **Al hacer clic en "Ver Clases"**, muestra:
  - Todas las clases desde la fecha de inicio (`start_date`) hasta hoy
  - No solo las del mes seleccionado
  - Ordenadas de más reciente a más antigua
- ✅ **Muestra la fecha de inicio** en el encabezado del modal de detalles
  - Ejemplo: "Clases desde 15 de septiembre de 2024 hasta hoy"

### 3. Generación Automática de Clases
- Al crear un alumno con horario fijo:
  - Se generan automáticamente todas las clases desde `start_date` hasta hoy
  - Las clases se crean respetando el horario semanal configurado
  - No se crean clases futuras (solo hasta hoy)

## 🧪 Prueba de Funcionalidad

Para probar que todo funciona correctamente:

1. **Crear un alumno nuevo**:
   ```bash
   pnpm dev
   ```
   - Ve a `/students`
   - Haz clic en "Añadir Alumno"
   - Completa el formulario incluyendo la "Fecha de Inicio de Clases"
   - Configura un horario fijo (opcional)
   - Guarda el alumno

2. **Verificar el seguimiento**:
   - Ve a `/class-tracking`
   - Deberías ver el alumno en la lista
   - Haz clic en "Ver Clases"
   - Verifica que:
     - Se muestran todas las clases desde la fecha de inicio
     - El encabezado muestra la fecha de inicio correcta
     - Las clases están ordenadas de más reciente a más antigua

3. **Verificar en la base de datos**:
   - Ve al **Table Editor** de Supabase
   - Tabla **students**: Verifica que el `start_date` esté guardado
   - Tabla **classes**: Verifica que se hayan generado las clases correspondientes

## 🐛 Solución de Problemas

### Error: "column start_date does not exist"
**Causa**: El campo no existe en la tabla `students`

**Solución**: Ejecuta el SQL de la sección "Agregar el Campo"

### Error: "start_date es requerido" al crear alumno
**Causa**: El campo no se está enviando desde el formulario

**Solución**: 
1. Verifica que el formulario tenga el campo de fecha de inicio
2. Asegúrate de completar el campo antes de guardar

### Las clases no se muestran desde el inicio
**Causa**: El alumno no tiene `start_date` configurado

**Solución**:
1. Ve a **Table Editor** → **students**
2. Edita el alumno y añade manualmente una fecha en `start_date`
3. O ejecuta:
   ```sql
   UPDATE students 
   SET start_date = '2024-09-01' 
   WHERE id = [ID_DEL_ALUMNO];
   ```

## 📊 Estructura de Datos

```typescript
interface Student {
  id: string
  first_name: string
  last_name: string
  email: string
  birth_date: string
  phone: string
  course_id: string
  student_code: string
  start_date?: string  // ← Campo nuevo (YYYY-MM-DD)
  // ... otros campos
}
```

## ✨ Nuevas Funcionalidades

### 🔄 Botón "Actualizar Clases"

En `/class-tracking` ahora hay un botón verde **"Actualizar Clases"** que:
- Genera automáticamente todas las clases faltantes desde `start_date` hasta hoy
- Procesa todos los alumnos con horario fijo
- Guarda las clases físicamente en la base de datos
- Muestra un resumen de las clases creadas

**¿Cuándo usarlo?**
- Después de crear un alumno nuevo
- Cuando las clases no llegan hasta hoy
- Semanalmente para mantener el sistema actualizado

**Más información**: Ver `GUIA_ACTUALIZACION_CLASES.md`

## ✨ Siguientes Pasos

Una vez verificado que `start_date` funciona correctamente:

1. ✅ El seguimiento mostrará todas las clases históricas
2. ✅ Las estadísticas serán más precisas
3. ✅ La facturación podrá filtrar por rango de fechas
4. ✅ Los reportes incluirán el periodo completo de actividad
5. ✅ Usa el botón "Actualizar Clases" para generar clases hasta hoy

---

**Última actualización**: 1 de octubre de 2025

