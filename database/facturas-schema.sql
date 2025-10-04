-- Esquema de base de datos para facturas RRSIF
-- Cumple con los requisitos del Real Decreto 1007/2023

-- Tabla principal de facturas
CREATE TABLE IF NOT EXISTS facturas_rrsif (
    id TEXT PRIMARY KEY,
    invoice_number TEXT UNIQUE NOT NULL,
    student_id TEXT NOT NULL,
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

-- Tabla de clases de facturas
CREATE TABLE IF NOT EXISTS factura_clases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    factura_id TEXT NOT NULL,
    clase_id TEXT NOT NULL,
    fecha TEXT NOT NULL,
    hora_inicio TEXT NOT NULL,
    hora_fin TEXT NOT NULL,
    duracion INTEGER NOT NULL,
    asignatura TEXT NOT NULL,
    precio REAL NOT NULL,
    
    FOREIGN KEY (factura_id) REFERENCES facturas_rrsif(id) ON DELETE CASCADE,
    FOREIGN KEY (clase_id) REFERENCES classes(id)
);

-- Tabla de eventos del sistema RRSIF
CREATE TABLE IF NOT EXISTS eventos_rrsif (
    id TEXT PRIMARY KEY,
    tipo_evento TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    actor TEXT NOT NULL,
    detalle TEXT NOT NULL,
    hash_evento TEXT,
    metadatos TEXT, -- JSON
    created_at TEXT NOT NULL
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_facturas_student_id ON facturas_rrsif(student_id);
CREATE INDEX IF NOT EXISTS idx_facturas_invoice_number ON facturas_rrsif(invoice_number);
CREATE INDEX IF NOT EXISTS idx_facturas_hash_registro ON facturas_rrsif(hash_registro);
CREATE INDEX IF NOT EXISTS idx_facturas_created_at ON facturas_rrsif(created_at);
CREATE INDEX IF NOT EXISTS idx_factura_clases_factura_id ON factura_clases(factura_id);
CREATE INDEX IF NOT EXISTS idx_eventos_timestamp ON eventos_rrsif(timestamp);
CREATE INDEX IF NOT EXISTS idx_eventos_tipo ON eventos_rrsif(tipo_evento);

-- Triggers para actualizar updated_at
CREATE TRIGGER IF NOT EXISTS update_facturas_updated_at 
    AFTER UPDATE ON facturas_rrsif
    FOR EACH ROW
    BEGIN
        UPDATE facturas_rrsif 
        SET updated_at = datetime('now') 
        WHERE id = NEW.id;
    END;

