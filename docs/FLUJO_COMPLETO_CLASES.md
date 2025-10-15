# 📚 Flujo Completo del Sistema de Clases

## 🎯 Arquitectura y Principios

**Principio Central**: La base de datos de Supabase es la **única fuente de verdad** para todas las clases.

### Source of Truth
```
┌─────────────────────────────────────┐
│   SUPABASE DATABASE                 │
│   Table: classes                    │
│                                     │
│   ✅ Único lugar donde existen     │
│      las clases                     │
│   ✅ Todas las clases tienen fecha  │
│      específica (field: date)       │
│   ✅ Clases recurrentes y           │
│      eventuales coexisten           │
└─────────────────────────────────────┘
         ↓          ↓          ↓
    ┌────────┐ ┌─────────┐ ┌──────────┐
    │Alumno │ │Calendar │ │Tracking│
    │  Page  │ │  Page   │ │  Page  │
    └────────┘ └─────────┘ └──────────┘
     DISPLAY    DISPLAY     DISPLAY
```

---

## 🔄 Flujo 1: Creación de Alumno

### Paso 1: Usuario crea alumno en `/students`

```typescript
// app/students/page.tsx - AddStudentModal

{
  first_name: "Juan",
  last_name: "Pérez",
  course_id: 3,
  start_date: "2024-10-01",  // ← Fecha de inicio de clases
  fixed_schedule: [
    {
      day_of_week: 1,  // Lunes
      start_time: "10:00",
      end_time: "11:00",
      subject: "Matemáticas"
    },
    {
      day_of_week: 3,  // Miércoles
      start_time: "16:00",
      end_time: "17:00",
      subject: "Física"
    }
  ]
}
```

### Paso 2: API crea el estudiante

```typescript
// app/api/students/route.ts (POST)

// 1. Crear el registro del estudiante en la tabla 'students'
const studentId = await dbOperations.createStudent({ ... })

// 2. Generar TODAS las clases desde start_date hasta HOY
const generatedClasses = await generateClassesFromStartDate(
  studentId,
  course_id,
  fixed_schedule,
  start_date,              // "2024-10-01"
  new Date().toISOString().split('T')[0]  // "2025-10-15" (hoy)
)
```

### Paso 3: Función genera clases concretas

```typescript
// lib/class-generation.ts

export async function generateClassesFromStartDate(
  studentId: number,
  courseId: number,
  fixedSchedule: any[],
  startDate: string,
  endDate: string
) {
  const classes = []
  let currentDate = new Date(startDate)
  
  // Iterar semana por semana desde startDate hasta endDate
  while (currentDate <= endDate) {
    for (const timeSlot of fixedSchedule) {
      // Para cada día de horario fijo, crear UNA clase concreta
      if (currentDate.getDay() === timeSlot.day_of_week) {
        classes.push({
          student_id: studentId,
          course_id: courseId,
          date: currentDate.toISOString().split('T')[0], // ← FECHA ESPECÍFICA
          day_of_week: timeSlot.day_of_week,
          start_time: timeSlot.start_time,
          end_time: timeSlot.end_time,
          duration: calculateDuration(timeSlot.start_time, timeSlot.end_time),
          price: calculatePrice(...),
          status: 'scheduled',
          payment_status: 'unpaid',
          is_recurring: true,  // ← Marca que proviene de horario fijo
          subject: timeSlot.subject
        })
      }
    }
    currentDate.setDate(currentDate.getDate() + 1) // Avanzar un día
  }
  
  // Insertar TODAS las clases en la base de datos
  for (const classData of classes) {
    await supabase.from('classes').insert(classData)
  }
  
  return classes
}
```

### Resultado en Base de Datos

```sql
-- Tabla: classes
-- Ejemplo: Alumno creado el 2025-10-15 con start_date: 2024-10-01

id | student_id | date       | day_of_week | start_time | end_time | is_recurring | status     | price
---|------------|------------|-------------|------------|----------|--------------|------------|------
1  | 42         | 2024-10-01 | 1           | 10:00      | 11:00    | true         | scheduled  | 20.00
2  | 42         | 2024-10-03 | 3           | 16:00      | 17:00    | true         | scheduled  | 20.00
3  | 42         | 2024-10-08 | 1           | 10:00      | 11:00    | true         | scheduled  | 20.00
4  | 42         | 2024-10-10 | 3           | 16:00      | 17:00    | true         | scheduled  | 20.00
... (continúa hasta 2025-10-15)
234| 42         | 2025-10-13 | 1           | 10:00      | 11:00    | true         | scheduled  | 20.00
235| 42         | 2025-10-15 | 3           | 16:00      | 17:00    | true         | scheduled  | 20.00
```

**Total**: ~235 clases generadas (aprox. 2 clases/semana × 52 semanas = 104 clases anuales)

---

## 🔄 Flujo 2: Visualización en Calendario

### Paso 1: Usuario abre `/calendar`

```typescript
// app/calendar/page.tsx

useEffect(() => {
  const fetchData = async () => {
    // Obtener TODAS las clases de la base de datos
    const classesResponse = await fetch('/api/classes')
    const classesData = await classesResponse.json()
    
    // CAMBIO CRÍTICO: No separar en "fixed" y "scheduled"
    // TODAS las clases se muestran directamente
    setScheduledClasses(classesData)  // ← Todas las clases
    setFixedSchedules([])              // ← No hay plantillas
  }
  
  fetchData()
}, [])
```

### Paso 2: API devuelve todas las clases

```typescript
// app/api/classes/route.ts (GET)

export async function GET() {
  // Consulta SIMPLE: solo datos básicos de clases
  const { data: classes } = await supabase
    .from('classes')
    .select(`
      id, student_id, course_id, date, start_time, end_time,
      duration, day_of_week, is_recurring, status, payment_status,
      price, subject, notes
    `)
  
  // Manual joins para datos de estudiante y curso
  const enrichedClasses = await Promise.all(
    classes.map(async (cls) => {
      const { data: student } = await supabase
        .from('students')
        .select('first_name, last_name, email')
        .eq('id', cls.student_id)
        .single()
      
      const { data: course } = await supabase
        .from('courses')
        .select('name, color')
        .eq('id', cls.course_id)
        .single()
      
      return { ...cls, students: student, courses: course }
    })
  )
  
  return NextResponse.json(enrichedClasses)
}
```

### Paso 3: Calendario muestra las clases

```typescript
// components/calendar/WeeklyCalendar.tsx

// Para cada día de la semana actual
weekDates.forEach((date) => {
  // Buscar clases que coincidan con esta fecha específica
  const classesForDate = scheduledClasses.filter(cls => 
    cls.date === date.toISOString().split('T')[0]
  )
  
  // Mostrar cada clase en su hora correspondiente
  classesForDate.forEach(cls => renderClass(cls))
})
```

**Resultado Visual**:
```
┌────────────────────────────────────────┐
│ CALENDARIO - Semana del 13-19 Oct     │
├────────┬────────┬────────┬────────────┤
│  Lun   │  Mar   │  Mié   │  Jue       │
├────────┼────────┼────────┼────────────┤
│ 10:00  │        │ 16:00  │            │
│ Juan   │        │ Juan   │            │
│ Pérez  │        │ Pérez  │            │
│ Mat.   │        │ Fís.   │            │
└────────┴────────┴────────┴────────────┘
```

---

## 🗑️ Flujo 3: Eliminación de Clase

### Paso 1: Usuario hace clic en una clase

```typescript
// app/calendar/page.tsx

const handleClassClick = (classItem) => {
  setSelectedClass(classItem)  // classItem tiene un ID de BD
  setIsEditOrDeleteModalOpen(true)
}
```

### Paso 2: Usuario confirma eliminación

```typescript
// app/calendar/page.tsx

const handleDeleteClass = async () => {
  console.log('Eliminando clase:', selectedClass)
  
  // SIMPLIFICADO: Todas las clases tienen ID y se eliminan directamente
  const response = await fetch(`/api/classes?ids=${selectedClass.id}`, {
    method: 'DELETE',
  })
  
  if (response.ok) {
    // Refresh: obtener todas las clases actualizadas
    const classesResponse = await fetch('/api/classes')
    const classesData = await classesResponse.json()
    setScheduledClasses(classesData)
    
    toast.success('Clase eliminada permanentemente')
  }
}
```

### Paso 3: API elimina de la base de datos

```typescript
// app/api/classes/route.ts (DELETE)

export async function DELETE(request: NextRequest) {
  const ids = url.searchParams.get('ids')
  
  // Eliminar de la base de datos
  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('id', ids)
  
  if (error) {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
  
  return NextResponse.json({ message: 'Clase eliminada' })
}
```

### Paso 4: Calendario se actualiza

```typescript
// Al hacer refresh, la clase eliminada YA NO existe en la BD
// Por lo tanto, NO se mostrará en el calendario

GET /api/classes
→ Devuelve todas las clases EXCEPTO la eliminada
→ Calendario muestra solo las clases existentes
→ ✅ La clase NO reaparece nunca
```

---

## 🔄 Flujo 4: Visualización en Seguimiento

### Dashboard de Seguimiento

```typescript
// app/class-tracking/page.tsx

useEffect(() => {
  const fetchClasses = async () => {
    // Obtener todas las clases del mes actual
    const response = await fetch(`/api/class-tracking?month=${currentMonth}`)
    const data = await response.json()
    setClassTrackingData(data)
  }
  
  fetchClasses()
}, [currentMonth])
```

### API de Seguimiento

```typescript
// app/api/class-tracking/route.ts

export async function GET(request: NextRequest) {
  const month = url.searchParams.get('month')
  
  // Obtener todas las clases del mes
  const classes = await dbOperations.getClassesByMonth(month)
  
  // Agrupar por estudiante y calcular estadísticas
  const trackingData = groupByStudent(classes)
  
  return NextResponse.json(trackingData)
}
```

**Resultado**: Seguimiento muestra **exactamente las mismas clases** que el calendario, porque ambos consultan la misma base de datos.

---

## ✅ Ventajas del Sistema Actual

### 1. **Única Fuente de Verdad**
- ✅ Base de datos = única fuente
- ✅ No hay plantillas generadas en tiempo real
- ✅ No hay discrepancias entre vistas

### 2. **Eliminación Permanente**
- ✅ DELETE = eliminar de BD
- ✅ No reaparece al recargar
- ✅ Consistencia garantizada

### 3. **Simplicidad**
- ✅ Código simple y directo
- ✅ Fácil de debuggear
- ✅ Sin lógica compleja de plantillas

### 4. **Performance**
- ✅ Consultas directas a BD
- ✅ No regeneración en tiempo real
- ✅ Manual joins cuando necesario

---

## ⚠️ Importante: Lo que NO hace el sistema

### ❌ NO genera plantillas visuales
```typescript
// ANTES (INCORRECTO):
const fixedSchedules = fixedClasses.map(cls => ({
  day_of_week: cls.day_of_week,
  start_time: cls.start_time,
  // ... mostrar como plantilla semanal repetitiva
}))

// AHORA (CORRECTO):
setScheduledClasses(classesData) // Todas las clases directas de BD
setFixedSchedules([])             // No hay plantillas
```

### ❌ NO oculta clases temporalmente
```typescript
// ANTES (INCORRECTO):
setHiddenFixedSchedules(prev => ({ ...prev, [key]: true }))
// → Ocultar visualmente pero mantener en "plantilla"

// AHORA (CORRECTO):
await fetch(`/api/classes?ids=${classId}`, { method: 'DELETE' })
// → Eliminar permanentemente de la base de datos
```

### ❌ NO diferencia entre clases recurrentes y eventuales para visualización
```typescript
// Ambos tipos se muestran igual:
// - is_recurring: true  → Clase generada desde horario fijo
// - is_recurring: false → Clase creada manualmente

// Pero ambas tienen:
// - date: fecha específica
// - start_time: hora específica
// - Existen en la base de datos
```

---

## 🎉 Resumen del Flujo

```
1. CREAR ALUMNO
   ↓
2. GENERAR CLASES (start_date → today)
   ↓
3. INSERTAR EN BD (tabla: classes)
   ↓
4. CALENDARIO/SEGUIMIENTO LEEN BD
   ↓
5. USUARIO ELIMINA CLASE
   ↓
6. ELIMINAR DE BD
   ↓
7. CALENDAR/SEGUIMIENTO REFRESCAN
   ↓
8. CLASE NO EXISTE = NO SE MUESTRA ✅
```

**Principio Final**: Si no está en la base de datos, no existe. Si está en la base de datos, se muestra. Simple y confiable.

