# Configuración del Sistema de Seguimiento de Clases para Supabase

## 🎯 Instrucciones para el SQL Editor de Supabase

### 1. Acceder al SQL Editor
1. Ve a tu proyecto de Supabase
2. Navega a **SQL Editor** en el menú lateral
3. Haz clic en **New Query**

### 2. Ejecutar el Esquema de Base de Datos

Copia y pega el siguiente código SQL en el editor y ejecútalo:

```sql
-- Extension to the existing Supabase schema for class tracking and payment management
-- This adds new columns and tables to support class payment tracking

-- Add new columns to existing classes table
ALTER TABLE classes ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid'));
ALTER TABLE classes ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS payment_notes TEXT;

-- Create class_tracking table for detailed monthly tracking
CREATE TABLE IF NOT EXISTS class_tracking (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    month_year TEXT NOT NULL, -- Format: YYYY-MM
    total_classes_scheduled INTEGER DEFAULT 0,
    total_classes_completed INTEGER DEFAULT 0,
    total_classes_cancelled INTEGER DEFAULT 0,
    recurring_classes_scheduled INTEGER DEFAULT 0,
    recurring_classes_completed INTEGER DEFAULT 0,
    recurring_classes_cancelled INTEGER DEFAULT 0,
    eventual_classes_scheduled INTEGER DEFAULT 0,
    eventual_classes_completed INTEGER DEFAULT 0,
    eventual_classes_cancelled INTEGER DEFAULT 0,
    classes_paid INTEGER DEFAULT 0,
    classes_unpaid INTEGER DEFAULT 0,
    recurring_classes_paid INTEGER DEFAULT 0,
    recurring_classes_unpaid INTEGER DEFAULT 0,
    eventual_classes_paid INTEGER DEFAULT 0,
    eventual_classes_unpaid INTEGER DEFAULT 0,
    total_earned DECIMAL(10,2) DEFAULT 0.00,
    total_paid DECIMAL(10,2) DEFAULT 0.00,
    total_unpaid DECIMAL(10,2) DEFAULT 0.00,
    recurring_earned DECIMAL(10,2) DEFAULT 0.00,
    recurring_paid DECIMAL(10,2) DEFAULT 0.00,
    recurring_unpaid DECIMAL(10,2) DEFAULT 0.00,
    eventual_earned DECIMAL(10,2) DEFAULT 0.00,
    eventual_paid DECIMAL(10,2) DEFAULT 0.00,
    eventual_unpaid DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create monthly_reports table for overall monthly statistics
CREATE TABLE IF NOT EXISTS monthly_reports (
    id SERIAL PRIMARY KEY,
    month_year TEXT NOT NULL UNIQUE, -- Format: YYYY-MM
    total_students INTEGER DEFAULT 0,
    total_classes_scheduled INTEGER DEFAULT 0,
    total_classes_completed INTEGER DEFAULT 0,
    total_classes_cancelled INTEGER DEFAULT 0,
    total_recurring_classes INTEGER DEFAULT 0,
    total_eventual_classes INTEGER DEFAULT 0,
    total_earned DECIMAL(10,2) DEFAULT 0.00,
    total_paid DECIMAL(10,2) DEFAULT 0.00,
    total_unpaid DECIMAL(10,2) DEFAULT 0.00,
    average_earned_per_student DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_classes_payment_status ON classes(payment_status);
CREATE INDEX IF NOT EXISTS idx_classes_payment_date ON classes(payment_date);
CREATE INDEX IF NOT EXISTS idx_class_tracking_student_month ON class_tracking(student_id, month_year);
CREATE INDEX IF NOT EXISTS idx_class_tracking_month ON class_tracking(month_year);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_month ON monthly_reports(month_year);

-- Create triggers for updated_at
CREATE TRIGGER update_class_tracking_updated_at BEFORE UPDATE ON class_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_monthly_reports_updated_at BEFORE UPDATE ON monthly_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on new tables
ALTER TABLE class_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables
CREATE POLICY "Allow all operations on class_tracking" ON class_tracking FOR ALL USING (true);
CREATE POLICY "Allow all operations on monthly_reports" ON monthly_reports FOR ALL USING (true);

-- Insert default data for current month if it doesn't exist
INSERT INTO monthly_reports (month_year, total_students, total_classes_scheduled, total_classes_completed, total_classes_cancelled, total_recurring_classes, total_eventual_classes, total_earned, total_paid, total_unpaid, average_earned_per_student)
SELECT 
    TO_CHAR(NOW(), 'YYYY-MM') as month_year,
    (SELECT COUNT(*) FROM students) as total_students,
    0 as total_classes_scheduled,
    0 as total_classes_completed,
    0 as total_classes_cancelled,
    0 as total_recurring_classes,
    0 as total_eventual_classes,
    0.00 as total_earned,
    0.00 as total_paid,
    0.00 as total_unpaid,
    0.00 as average_earned_per_student
ON CONFLICT (month_year) DO NOTHING;
```

### 3. Verificar la Instalación

Después de ejecutar el SQL, verifica que se hayan creado las nuevas columnas y tablas:

```sql
-- Verificar que las nuevas columnas se agregaron a la tabla classes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'classes' 
AND column_name IN ('payment_status', 'payment_date', 'payment_notes');

-- Verificar que las nuevas tablas se crearon
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('class_tracking', 'monthly_reports');
```

### 4. Actualizar las Políticas de RLS (Opcional)

Si quieres restringir el acceso a las nuevas tablas, puedes crear políticas más específicas:

```sql
-- Ejemplo de políticas más restrictivas (opcional)
DROP POLICY IF EXISTS "Allow all operations on class_tracking" ON class_tracking;
DROP POLICY IF EXISTS "Allow all operations on monthly_reports" ON monthly_reports;

-- Crear políticas más específicas si es necesario
-- (Esto es opcional, las políticas actuales permiten todas las operaciones)
```

## 🎉 ¡Listo!

Una vez ejecutado el SQL, el sistema de seguimiento de clases estará disponible en tu aplicación:

1. **Navega a** `http://localhost:3000/class-tracking`
2. **Verás el dashboard** de seguimiento de clases
3. **Podrás gestionar** estados de clases y pagos
4. **Generar reportes** mensuales detallados

## 📊 Funcionalidades Disponibles

- ✅ **Recuento automático** de clases del mes
- ✅ **Gestión de estados** (programada/completada/cancelada)
- ✅ **Gestión de pagos** (pagada/sin pagar)
- ✅ **Diferenciación** entre clases recurrentes y eventuales
- ✅ **Reportes mensuales** con estadísticas detalladas
- ✅ **Exportación a CSV** de reportes
- ✅ **Interfaz moderna** y responsive

## 🔧 Solución de Problemas

### Si hay errores al ejecutar el SQL:
1. **Verifica** que tienes permisos de administrador en Supabase
2. **Ejecuta** el SQL en partes más pequeñas si es necesario
3. **Revisa** la consola de Supabase para errores específicos

### Si no se cargan los datos en la aplicación:
1. **Verifica** que las variables de entorno de Supabase están configuradas
2. **Revisa** la consola del navegador para errores
3. **Asegúrate** de que las políticas RLS permiten el acceso

¡El sistema está listo para usar! 🚀

