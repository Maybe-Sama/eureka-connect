# Implementación del Sistema de Grupos de Asignaturas

## 📋 Resumen

Se ha implementado un sistema para asociar grupos de asignaturas del archivo `subjects.json` a cada curso. Esto permite que cuando un estudiante esté en un curso específico (ej: "2º BACH TECNOLÓGICO"), solo se muestren las asignaturas relevantes de ese nivel educativo en el seguimiento de clases.

---

## ✅ Cambios Implementados

### 1. **Nuevo Componente: SubjectGroupSelector**
- **Ubicación**: `components/courses/SubjectGroupSelector.tsx`
- **Función**: Permite seleccionar un grupo de asignaturas del `subjects.json` al crear/editar un curso
- **Grupos disponibles**:
  - Primaria (1º a 6º)
  - Secundaria/ESO (1º a 4º)
  - Bachillerato Ciencias (1º y 2º)
  - Bachillerato Humanidades (1º y 2º)
  - Bachillerato Artes (1º y 2º)
  - Idiomas
  - Especialidades/Refuerzo

### 2. **Actualización del Formulario de Cursos**
- **Archivo**: `app/courses/page.tsx`
- **Cambios**:
  - Añadido campo `subject_group` al interface `Course`
  - Integrado `SubjectGroupSelector` en el formulario de creación/edición
  - El campo almacena la ruta del grupo (ej: "bachillerato.2_bachillerato.ciencias")

### 3. **CourseFilteredSubjectSelector Mejorado**
- **Archivo**: `components/class-tracking/CourseFilteredSubjectSelector.tsx`
- **Cambios**:
  - Ahora lee las asignaturas directamente del `subjects.json` según el `subject_group` del curso
  - Mantiene lógica fallback (basada en palabras clave) para cursos sin `subject_group` configurado
  - Muestra la ruta del grupo en el header del dropdown

### 4. **Actualización de Interfaces y APIs**
- **ClassDetailsModal.tsx**: Actualizado para pasar `subject_group`
- **ClassItem.tsx**: Actualizado para pasar `subject_group`
- **API class-tracking/route.ts**: Incluye `subject_group` en las consultas
- **API class-tracking/classes/route.ts**: Incluye `subject_group` en las consultas
- **API class-tracking/classes/batch/route.ts**: Incluye `subject_group` en las consultas

---

## 🗄️ Migración de Base de Datos (IMPORTANTE)

### ⚠️ **ACCIÓN REQUERIDA**: Ejecutar SQL Manualmente

Debes ejecutar este SQL en **Supabase Dashboard** → **SQL Editor**:

```sql
-- Añadir campo subject_group a la tabla courses
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS subject_group VARCHAR(100);

-- Añadir índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_courses_subject_group ON courses(subject_group);

-- Añadir comentario para documentación
COMMENT ON COLUMN courses.subject_group IS 'Ruta al grupo de asignaturas en subjects.json (ej: bachillerato.2_bachillerato.ciencias)';
```

**Nota**: También está disponible en `database/migrations/add-subject-group-to-courses.sql`

---

## 📖 Cómo Usar

### **Paso 1: Configurar Cursos**

1. Ve a **Gestión de Cursos**
2. Crea o edita un curso
3. En el campo **"Grupo de Asignaturas"**, selecciona el nivel educativo correspondiente
   - Ejemplo: Para "2º BACH TECNOLÓGICO" → selecciona "2º Bachillerato Ciencias"
4. Opcionalmente, selecciona una **asignatura principal** que represente el curso
5. Guarda el curso

### **Paso 2: Usar en Seguimiento de Clases**

1. Ve a **Seguimiento de Clases**
2. Selecciona un estudiante
3. Al editar o añadir una clase, el selector de asignaturas mostrará **solo las asignaturas del grupo configurado** para el curso del estudiante
4. Las asignaturas disponibles se muestran en el header del dropdown

---

## 🔄 Compatibilidad Retroactiva

### **Cursos Sin subject_group Configurado**

Los cursos creados anteriormente (sin `subject_group`) seguirán funcionando:
- El sistema usará la **lógica fallback** basada en palabras clave del nombre del curso
- Se recomienda actualizar estos cursos para aprovechar el nuevo sistema
- No hay pérdida de funcionalidad

---

## 📁 Estructura de subject_group

El campo `subject_group` almacena la ruta en formato de puntos:

| Formato | Ejemplo |
|---------|---------|
| `nivel.curso` | `primaria.1_primaria` |
| `nivel.curso` | `secundaria.3_eso` |
| `nivel.curso.modalidad` | `bachillerato.2_bachillerato.ciencias` |
| `categoria` | `idiomas` |
| `categoria` | `especialidades` |

---

## 🎯 Beneficios

1. ✅ **Una única fuente de verdad**: `subjects.json`
2. ✅ **Fácil mantenimiento**: Actualiza el JSON y todos los cursos se actualizan
3. ✅ **Más preciso**: No depende de palabras clave del nombre del curso
4. ✅ **Flexible**: Permite asignar cualquier grupo a cualquier curso
5. ✅ **Escalable**: Fácil añadir nuevos niveles o modalidades

---

## 🔧 Mantenimiento Futuro

### **Para añadir nuevas asignaturas:**
1. Edita `data/subjects.json`
2. Añade las asignaturas en el nivel correspondiente
3. No es necesario tocar el código

### **Para añadir nuevos niveles educativos:**
1. Edita `data/subjects.json`
2. Actualiza `SubjectGroupSelector.tsx` para incluir el nuevo nivel en el dropdown
3. La lógica de filtrado funcionará automáticamente

---

## 📝 Notas Técnicas

- El campo `subject_group` es **opcional** (NULL permitido)
- El sistema es **retrocompatible** con cursos existentes
- Las consultas están **optimizadas** con índices
- El componente usa **useMemo** para mejor rendimiento
- Normalización de texto para búsqueda **sin acentos**

---

## 🐛 Resolución de Problemas

### **Problema**: No se muestran asignaturas al editar clases
**Solución**: 
1. Verifica que el curso tenga `subject_group` configurado
2. Si no lo tiene, el sistema usará lógica fallback basada en el nombre del curso
3. Edita el curso y asigna un grupo de asignaturas

### **Problema**: Error al crear/editar curso
**Solución**: 
1. Verifica que hayas ejecutado la migración SQL
2. Comprueba que la columna `subject_group` existe en la tabla `courses`

---

## 📚 Archivos Relacionados

### Componentes
- `components/courses/SubjectGroupSelector.tsx` (nuevo)
- `components/class-tracking/CourseFilteredSubjectSelector.tsx` (modificado)
- `components/class-tracking/ClassDetailsModal.tsx` (modificado)
- `components/class-tracking/ClassItem.tsx` (modificado)

### APIs
- `app/api/class-tracking/route.ts` (modificado)
- `app/api/class-tracking/classes/route.ts` (modificado)
- `app/api/class-tracking/classes/batch/route.ts` (modificado)

### Páginas
- `app/courses/page.tsx` (modificado)

### Base de Datos
- `database/migrations/add-subject-group-to-courses.sql` (nuevo)

### Datos
- `data/subjects.json` (existente, usado como fuente de verdad)

---

**Implementado por**: AI Assistant  
**Fecha**: 2025-10-19  
**Versión**: 1.0

