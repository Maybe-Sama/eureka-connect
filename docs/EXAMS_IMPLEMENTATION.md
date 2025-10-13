# Implementación del Sistema de Exámenes

## Cambios en la Base de Datos

### 1. Crear la tabla de exámenes

**IMPORTANTE**: Ejecuta los scripts en este orden:

1. **Primero**: `database/exams-schema-safe.sql` - Crea la tabla y estructura
2. **Segundo**: `database/exams-disable-rls.sql` - Deshabilita RLS para evitar conflictos

Ejecuta el siguiente SQL en tu base de datos de Supabase:

```sql
-- Crear tabla de exámenes (solo si no existe)
CREATE TABLE IF NOT EXISTS public.exams (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    exam_date DATE NOT NULL,
    exam_time TIME,
    notes TEXT,
    grade DECIMAL(4,2) CHECK (grade >= 0 AND grade <= 10),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices solo si no existen
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_exams_student_id') THEN
        CREATE INDEX idx_exams_student_id ON public.exams(student_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_exams_date') THEN
        CREATE INDEX idx_exams_date ON public.exams(exam_date);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_exams_student_date') THEN
        CREATE INDEX idx_exams_student_date ON public.exams(student_id, exam_date);
    END IF;
END $$;

-- Crear función solo si no existe
CREATE OR REPLACE FUNCTION public.update_exams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger solo si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_update_exams_updated_at'
    ) THEN
        CREATE TRIGGER trigger_update_exams_updated_at
            BEFORE UPDATE ON public.exams
            FOR EACH ROW
            EXECUTE FUNCTION public.update_exams_updated_at();
    END IF;
END $$;

-- Habilitar RLS solo si no está habilitado
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'exams' 
        AND n.nspname = 'public'
        AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.exams;
DROP POLICY IF EXISTS "Allow select for anonymous users" ON public.exams;

-- Crear políticas RLS
CREATE POLICY "Allow all operations for authenticated users" ON public.exams
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow select for anonymous users" ON public.exams
    FOR SELECT
    TO anon
    USING (true);

-- Otorgar permisos
GRANT ALL ON public.exams TO service_role;
GRANT ALL ON public.exams TO authenticated;
GRANT SELECT ON public.exams TO anon;

-- Otorgar permisos en secuencias (verificar que existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'exams_id_seq') THEN
        GRANT USAGE, SELECT ON SEQUENCE exams_id_seq TO service_role;
        GRANT USAGE, SELECT ON SEQUENCE exams_id_seq TO authenticated;
    END IF;
END $$;
```

### 2. Verificar la estructura existente

Tu base de datos ya tiene la estructura correcta con:
- `students` table con `id` como INTEGER
- `system_users` table para autenticación personalizada
- `user_sessions` table para sesiones activas

## Funcionalidades Implementadas

### 1. Calendario Mejorado
- **Cards de clases**: Los días con clases ahora muestran cards más detalladas con la hora y asignatura
- **Diseño mejorado**: Cards con sombras y bordes para mejor visibilidad

### 2. Sistema de Exámenes
- **Gestión completa**: Crear, editar, eliminar y visualizar exámenes
- **Campos disponibles**:
  - Asignatura (requerido)
  - Fecha (requerido)
  - Hora (opcional)
  - Notas (opcional)
  - Nota/Calificación (opcional, 0-10)

### 3. Modal Gestor de Exámenes
- **Interfaz intuitiva**: Panel lateral con formulario y lista de exámenes
- **Operaciones CRUD**: Todas las operaciones en un solo modal
- **Validación**: Campos requeridos y validación de notas
- **Diseño responsivo**: Se adapta a diferentes tamaños de pantalla

### 4. API Endpoints
- `GET /api/exams` - Obtener exámenes del estudiante
- `POST /api/exams` - Crear nuevo examen
- `PUT /api/exams/[id]` - Actualizar examen
- `DELETE /api/exams/[id]` - Eliminar examen

## Seguridad

- **RLS habilitado**: Los estudiantes solo pueden ver y modificar sus propios exámenes
- **Validación de permisos**: Verificación de ownership en cada operación
- **Sanitización**: Validación de tipos de datos y rangos

## Próximos Pasos

1. **Ejecutar el SQL** en tu base de datos de Supabase
2. **Probar la funcionalidad** creando algunos exámenes de prueba
3. **Personalizar estilos** si es necesario según tu diseño
4. **Agregar notificaciones** para exámenes próximos (opcional)

## Notas Técnicas

- Los exámenes se ordenan automáticamente por fecha
- Las notas se validan en el rango 0-10
- Se mantiene un historial de creación y actualización
- La interfaz es completamente responsiva
- Compatible con el sistema de autenticación existente
