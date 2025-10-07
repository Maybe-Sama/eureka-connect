-- =====================================================
-- SCRIPT CORREGIDO PARA CONFIGURAR FACTURAS EN SUPABASE
-- =====================================================
-- Este script corrige los tipos de datos para evitar conflictos
-- con las foreign keys existentes

-- 1. ELIMINAR TABLAS EXISTENTES SI EXISTEN
-- =======================================
DROP TABLE IF EXISTS factura_clases CASCADE;
DROP TABLE IF EXISTS facturas_rrsif CASCADE;
DROP TABLE IF EXISTS eventos_rrsif CASCADE;
DROP TABLE IF EXISTS configuracion_fiscal CASCADE;

-- 2. CREAR TABLA PRINCIPAL DE FACTURAS RRSIF
-- ===========================================
CREATE TABLE facturas_rrsif (
    id TEXT PRIMARY KEY,
    invoice_number TEXT UNIQUE NOT NULL,
    student_id INTEGER NOT NULL,
    total REAL NOT NULL,
    month TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'generated',
    estado_factura TEXT NOT NULL DEFAULT 'provisional',
    descripcion TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    
    -- Datos fiscales del emisor
    emisor_nif TEXT NOT NULL,
    emisor_nombre TEXT NOT NULL,
    emisor_direccion TEXT NOT NULL,
    emisor_codigo_postal TEXT NOT NULL,
    emisor_municipio TEXT NOT NULL,
    emisor_provincia TEXT NOT NULL,
    emisor_pais TEXT NOT NULL DEFAULT 'España',
    emisor_telefono TEXT,
    emisor_email TEXT,
    
    -- Datos del receptor
    receptor_nif TEXT NOT NULL,
    receptor_nombre TEXT NOT NULL,
    receptor_direccion TEXT NOT NULL,
    receptor_codigo_postal TEXT NOT NULL,
    receptor_municipio TEXT NOT NULL,
    receptor_provincia TEXT NOT NULL,
    receptor_pais TEXT NOT NULL DEFAULT 'España',
    receptor_telefono TEXT,
    receptor_email TEXT,
    
    -- Registro de facturación RRSIF
    serie TEXT NOT NULL,
    numero TEXT NOT NULL,
    fecha_expedicion TEXT NOT NULL,
    hash_registro TEXT UNIQUE NOT NULL,
    timestamp TEXT NOT NULL,
    estado_envio TEXT NOT NULL DEFAULT 'pendiente',
    url_verificacion TEXT,
    
    -- Metadatos adicionales
    pdf_generado BOOLEAN DEFAULT FALSE,
    pdf_path TEXT,
    pdf_size INTEGER,
    
    FOREIGN KEY (student_id) REFERENCES students(id)
);

-- 3. CREAR TABLA DE CLASES DE FACTURAS
-- ====================================
CREATE TABLE factura_clases (
    id SERIAL PRIMARY KEY,
    factura_id TEXT NOT NULL,
    clase_id INTEGER NOT NULL,
    fecha TEXT NOT NULL,
    hora_inicio TEXT NOT NULL,
    hora_fin TEXT NOT NULL,
    duracion INTEGER NOT NULL,
    asignatura TEXT NOT NULL,
    precio REAL NOT NULL,
    
    FOREIGN KEY (factura_id) REFERENCES facturas_rrsif(id) ON DELETE CASCADE,
    FOREIGN KEY (clase_id) REFERENCES classes(id)
);

-- 4. CREAR TABLA DE EVENTOS DEL SISTEMA RRSIF
-- ===========================================
CREATE TABLE eventos_rrsif (
    id TEXT PRIMARY KEY,
    tipo_evento TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    actor TEXT NOT NULL,
    detalle TEXT NOT NULL,
    hash_evento TEXT,
    metadatos TEXT, -- JSON
    created_at TEXT NOT NULL
);

-- 5. CREAR TABLA DE CONFIGURACIÓN FISCAL
-- ======================================
CREATE TABLE configuracion_fiscal (
    id SERIAL PRIMARY KEY,
    datos_fiscales JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CREAR ÍNDICES PARA OPTIMIZAR CONSULTAS
-- =========================================
CREATE INDEX idx_facturas_student_id ON facturas_rrsif(student_id);
CREATE INDEX idx_facturas_invoice_number ON facturas_rrsif(invoice_number);
CREATE INDEX idx_facturas_hash_registro ON facturas_rrsif(hash_registro);
CREATE INDEX idx_facturas_created_at ON facturas_rrsif(created_at);
CREATE INDEX idx_facturas_estado ON facturas_rrsif(estado_factura);
CREATE INDEX idx_factura_clases_factura_id ON factura_clases(factura_id);
CREATE INDEX idx_factura_clases_clase_id ON factura_clases(clase_id);
CREATE INDEX idx_eventos_timestamp ON eventos_rrsif(timestamp);
CREATE INDEX idx_eventos_tipo ON eventos_rrsif(tipo_evento);

-- 7. CREAR TRIGGERS PARA ACTUALIZAR updated_at
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para facturas_rrsif
CREATE TRIGGER update_facturas_updated_at
    BEFORE UPDATE ON facturas_rrsif
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para configuracion_fiscal
CREATE TRIGGER update_configuracion_fiscal_updated_at
    BEFORE UPDATE ON configuracion_fiscal
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. CONFIGURAR ROW LEVEL SECURITY (RLS)
-- =====================================
-- Habilitar RLS en las tablas
ALTER TABLE facturas_rrsif ENABLE ROW LEVEL SECURITY;
ALTER TABLE factura_clases ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_rrsif ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_fiscal ENABLE ROW LEVEL SECURITY;

-- Políticas para facturas_rrsif
CREATE POLICY "Permitir lectura de facturas" ON facturas_rrsif
    FOR SELECT USING (true);

CREATE POLICY "Permitir inserción de facturas" ON facturas_rrsif
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualización de facturas" ON facturas_rrsif
    FOR UPDATE USING (true);

-- Políticas para factura_clases
CREATE POLICY "Permitir lectura de clases de facturas" ON factura_clases
    FOR SELECT USING (true);

CREATE POLICY "Permitir inserción de clases de facturas" ON factura_clases
    FOR INSERT WITH CHECK (true);

-- Políticas para eventos_rrsif
CREATE POLICY "Permitir lectura de eventos" ON eventos_rrsif
    FOR SELECT USING (true);

CREATE POLICY "Permitir inserción de eventos" ON eventos_rrsif
    FOR INSERT WITH CHECK (true);

-- Políticas para configuracion_fiscal
CREATE POLICY "Permitir lectura de configuración fiscal" ON configuracion_fiscal
    FOR SELECT USING (true);

CREATE POLICY "Permitir inserción de configuración fiscal" ON configuracion_fiscal
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualización de configuración fiscal" ON configuracion_fiscal
    FOR UPDATE USING (true);

-- 9. VERIFICAR CREACIÓN DE TABLAS
-- ===============================
-- Ejecutar estas consultas para verificar que todo se creó correctamente
SELECT 'facturas_rrsif' as tabla, COUNT(*) as registros FROM facturas_rrsif
UNION ALL
SELECT 'factura_clases' as tabla, COUNT(*) as registros FROM factura_clases
UNION ALL
SELECT 'eventos_rrsif' as tabla, COUNT(*) as registros FROM eventos_rrsif
UNION ALL
SELECT 'configuracion_fiscal' as tabla, COUNT(*) as registros FROM configuracion_fiscal;

-- =====================================================
-- FIN DEL SCRIPT CORREGIDO
-- =====================================================
-- Ahora los tipos de datos son compatibles:
-- - student_id: INTEGER (compatible con students.id)
-- - clase_id: INTEGER (compatible con classes.id)
