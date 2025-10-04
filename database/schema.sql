-- Database schema for CRM Profesor Autónomo
-- SQLite database

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    color TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    birth_date TEXT NOT NULL,
    phone TEXT NOT NULL,
    parent_phone TEXT,
    course_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- Classes table (fixed and eventual)
CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    day_of_week INTEGER NOT NULL, -- 1=Monday, 7=Sunday
    date TEXT NOT NULL, -- YYYY-MM-DD format
    is_recurring BOOLEAN DEFAULT 0,
    status TEXT DEFAULT 'scheduled', -- scheduled, completed, cancelled
    price REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT UNIQUE NOT NULL,
    student_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    status TEXT DEFAULT 'generated', -- generated, sent, paid, pending
    fixed_classes INTEGER DEFAULT 0,
    eventual_classes INTEGER DEFAULT 0,
    subtotal REAL NOT NULL,
    tax REAL NOT NULL,
    total REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Insert default courses
INSERT OR IGNORE INTO courses (id, name, description, price, duration, color, is_active) VALUES
(1, 'Matemáticas Básicas', 'Fundamentos de matemáticas para estudiantes de secundaria', 25.00, 60, '#6366f1', 1),
(2, 'Física Avanzada', 'Física de nivel universitario', 35.00, 90, '#8b5cf6', 1),
(3, 'Química Orgánica', 'Estudio de compuestos de carbono', 30.00, 60, '#10b981', 1);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_course_id ON students(course_id);
CREATE INDEX IF NOT EXISTS idx_classes_student_id ON classes(student_id);
CREATE INDEX IF NOT EXISTS idx_classes_date ON classes(date);
CREATE INDEX IF NOT EXISTS idx_classes_day_of_week ON classes(day_of_week);
CREATE INDEX IF NOT EXISTS idx_invoices_student_id ON invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);


