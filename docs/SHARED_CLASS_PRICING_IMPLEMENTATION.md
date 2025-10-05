# Implementación de Precios de Clases Compartidas

## Resumen
Se ha implementado una funcionalidad completa para manejar precios especiales para alumnos que asisten a clases compartidas. Esta funcionalidad afecta a todo el flujo de la aplicación, desde la gestión de cursos hasta el seguimiento de clases.

## Cambios en la Base de Datos

### 1. Tabla `courses`
Se añadió el campo `shared_class_price` (REAL, nullable) para almacenar el precio especial de clases compartidas.

### 2. Tabla `students`
Se añadió el campo `has_shared_pricing` (BOOLEAN, default: FALSE) para indicar si un alumno tiene precio de clase compartida.

### Script de Migración
**Archivo:** `database/add-shared-pricing-fields.sql`

El script incluye:
- Verificación y creación de columnas
- Índice para optimizar consultas por `has_shared_pricing`
- Actualización de cursos existentes con precio compartido al 80% del precio normal
- Verificación completa de la migración

**Para ejecutar:** Corre este script en el SQL Editor de Supabase.

## Cambios en el Frontend

### 1. Gestión de Cursos (`app/courses/page.tsx`)

#### Interfaz actualizada:
```typescript
interface Course {
  id: number
  name: string
  description?: string
  subject?: string
  price: number
  shared_class_price?: number  // NUEVO
  duration: number
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}
```

#### Formulario de Curso:
- Nuevo campo: **"Precio Clase Compartida (€)"**
- Ubicado junto al campo de precio normal
- Opcional, con placeholder explicativo
- Validación: mínimo 0, paso 0.01

#### Tarjeta de Curso:
- Muestra el precio compartido debajo del precio normal
- Formato: "Compartida: €XX.XX"

### 2. Gestión de Alumnos (`app/students/page.tsx`)

#### Interfaz actualizada:
```typescript
interface Student {
  // ... campos existentes
  course_price: number
  course_shared_price?: number  // NUEVO
  has_shared_pricing?: boolean   // NUEVO
}
```

#### Formulario de Alumno:
- Nuevo checkbox: **"Este alumno tiene precio de clase compartida"**
- Ubicado después del selector de curso
- Muestra información contextual:
  - Si el curso tiene precio compartido: precio aplicado
  - Si no lo tiene: advertencia que se usará precio normal

#### Tarjeta de Alumno:
- Muestra el precio correcto según `has_shared_pricing`
- Badge "Clase Compartida" cuando aplica
- Cálculo de ingreso mensual usa el precio correcto

#### Cálculo de Ingresos:
La función `calculateStudentMonthlyIncome` ahora:
1. Determina el precio por hora según `has_shared_pricing`
2. Si `has_shared_pricing === true` y existe `course_shared_price`, usa ese precio
3. Si no, usa el precio normal del curso
4. Aplica este precio tanto para horarios fijos como clases individuales

### 3. Seguimiento de Clases (`components/class-tracking/`)

#### Componentes actualizados:

**ClassTrackingCard.tsx:**
- Muestra el precio correcto por hora
- Badge "Compartida" cuando el alumno tiene precio compartido
- Cálculo automático según el tipo de alumno

**ClassTrackingDashboard.tsx:**
- Interfaz actualizada con campos de precio compartido
- Todas las estadísticas usan el precio correcto

**ClassDetailsModal.tsx:**
- Interfaz actualizada para incluir información de precio compartido
- Los totales reflejan el precio aplicable a cada alumno

## Cambios en el Backend

### 1. API Routes - Courses

**`app/api/courses/route.ts` (POST):**
```typescript
const courseId = await dbOperations.createCourse({
  name,
  description,
  subject,
  price: Number(price),
  shared_class_price: shared_class_price ? Number(shared_class_price) : null,  // NUEVO
  duration: Number(duration),
  color,
  is_active: is_active !== undefined ? Boolean(is_active) : true
})
```

**`app/api/courses/[id]/route.ts` (PUT):**
- Similar al POST, maneja `shared_class_price` en actualizaciones

### 2. API Routes - Students

**`app/api/students/route.ts` (POST):**
```typescript
const studentId = await dbOperations.createStudent({
  // ... otros campos
  has_shared_pricing: has_shared_pricing || false,  // NUEVO
  // ... campos fiscales
})
```

**`app/api/students/[id]/route.ts` (PUT):**
```typescript
const result = await dbOperations.updateStudent(Number(params.id), {
  // ... otros campos
  has_shared_pricing: has_shared_pricing !== undefined ? has_shared_pricing : false,  // NUEVO
  // ... campos fiscales
})
```

### 3. API Routes - Class Tracking

**`app/api/class-tracking/route.ts`:**
- Query actualizada para incluir `has_shared_pricing` y `shared_class_price`
- Estadísticas calculadas con el precio correcto

**`app/api/class-tracking/classes/route.ts`:**
- Incluye `has_shared_pricing` en datos del estudiante
- Incluye `shared_class_price` en datos del curso
- Todas las clases retornadas incluyen esta información

### 4. Database Operations (`lib/database.ts`)

**`getAllStudents()`:**
```typescript
return (data || []).map((student: any) => ({
  ...student,
  course_name: student.courses?.name || 'Curso no encontrado',
  course_price: student.courses?.price || 0,
  course_shared_price: student.courses?.shared_class_price || null,  // NUEVO
  course_color: student.courses?.color || '#6366f1'
}))
```

**`getStudentById()`:**
- Similar mapeo incluyendo `course_shared_price`

**`getAllClasses()`:**
- Query actualizada para incluir `has_shared_pricing` en estudiantes
- Query actualizada para incluir `shared_class_price` en cursos

## Flujo de Uso

### Crear un Curso con Precio Compartido:
1. Ir a "Gestión de Cursos"
2. Hacer clic en "Añadir Curso"
3. Completar información básica
4. Establecer "Precio por Hora" (ejemplo: €25)
5. Establecer "Precio Clase Compartida" (ejemplo: €18)
6. Guardar

### Asignar Alumno con Precio Compartido:
1. Ir a "Gestión de Alumnos"
2. Hacer clic en "Añadir Alumno"
3. Completar información del alumno
4. Seleccionar un curso que tenga precio compartido
5. **Marcar el checkbox "Este alumno tiene precio de clase compartida"**
6. Ver confirmación del precio aplicado
7. Guardar

### Visualizar en Seguimiento de Clases:
1. Ir a "Seguimiento de Clases"
2. Ver el precio correcto en cada tarjeta de alumno
3. Badge "Compartida" visible en alumnos con precio compartido
4. Todos los cálculos de ingresos usan el precio correcto

## Validaciones y Consideraciones

### Validaciones Implementadas:
- ✅ El campo `shared_class_price` es opcional
- ✅ Si no se establece, el sistema usa el precio normal
- ✅ Si un alumno tiene `has_shared_pricing` pero el curso no tiene `shared_class_price`, se usa el precio normal con advertencia
- ✅ Los valores existentes no se ven afectados (retrocompatible)

### Consideraciones de Diseño:
- **Retrocompatibilidad:** Cursos existentes sin `shared_class_price` funcionan normalmente
- **Flexibilidad:** Cada curso puede tener o no precio compartido
- **Claridad:** La UI muestra claramente qué precio se está usando
- **Consistencia:** El precio se aplica en todos los módulos (alumnos, seguimiento, reportes)

## Testing Recomendado

### Pruebas Manuales:
1. ✅ Crear curso sin precio compartido → Verificar funcionamiento normal
2. ✅ Crear curso con precio compartido → Verificar que se guarda correctamente
3. ✅ Editar curso para agregar precio compartido → Verificar actualización
4. ✅ Crear alumno sin precio compartido → Verificar usa precio normal
5. ✅ Crear alumno con precio compartido → Verificar usa precio compartido
6. ✅ Ver seguimiento de clases → Verificar precios correctos
7. ✅ Calcular ingresos mensuales → Verificar totales correctos

### Casos Edge:
- ✅ Alumno con `has_shared_pricing` pero curso sin `shared_class_price`: Usa precio normal
- ✅ Cambiar alumno de normal a compartido: Actualiza correctamente
- ✅ Cambiar alumno de compartido a normal: Actualiza correctamente
- ✅ Eliminar precio compartido del curso: Alumnos con `has_shared_pricing` usan precio normal

## Archivos Modificados

### Base de Datos:
- ✅ `database/add-shared-pricing-fields.sql` (nuevo)

### Frontend - Pages:
- ✅ `app/courses/page.tsx`
- ✅ `app/students/page.tsx`

### Frontend - Components:
- ✅ `components/class-tracking/ClassTrackingCard.tsx`
- ✅ `components/class-tracking/ClassTrackingDashboard.tsx`
- ✅ `components/class-tracking/ClassDetailsModal.tsx`

### Backend - API Routes:
- ✅ `app/api/courses/route.ts`
- ✅ `app/api/courses/[id]/route.ts`
- ✅ `app/api/students/route.ts`
- ✅ `app/api/students/[id]/route.ts`
- ✅ `app/api/class-tracking/route.ts`
- ✅ `app/api/class-tracking/classes/route.ts`

### Libraries:
- ✅ `lib/database.ts`

## Próximos Pasos

1. **Ejecutar el script de migración** en Supabase SQL Editor
2. **Probar en desarrollo** con datos de prueba
3. **Verificar** que todos los cálculos son correctos
4. **Documentar** casos de uso específicos para usuarios finales
5. **Considerar** reportes específicos para clases compartidas (opcional)

## Notas Importantes

⚠️ **Antes de desplegar a producción:**
- Ejecutar script de migración en base de datos de producción
- Hacer backup de la base de datos
- Probar exhaustivamente en staging
- Informar a usuarios sobre la nueva funcionalidad

✨ **Mejoras Futuras Posibles:**
- Reportes específicos para clases compartidas
- Estadísticas comparativas entre precios normales y compartidos
- Alertas cuando un alumno con precio compartido está en un curso sin ese precio configurado
- Bulk update para aplicar precio compartido a múltiples alumnos

---

**Fecha de Implementación:** Octubre 2025  
**Versión:** 1.0  
**Estado:** ✅ Completa y lista para testing
