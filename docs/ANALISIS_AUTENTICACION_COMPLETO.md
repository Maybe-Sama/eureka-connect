# 📋 Análisis Completo del Sistema de Autenticación

## 🔍 **Prompt 1 — Lógica de Autenticación Actual**

### **Sistema de Autenticación de Estudiantes**

#### **1. Creación del Código Numérico**

**Ubicación:** `lib/utils.ts` (líneas 12-16)
```typescript
export function generateStudentCode(): string {
  const year = new Date().getFullYear()
  const randomNum = Math.floor(Math.random() * 9000) + 1000 // 1000-9999
  return `EUREKA-${year}-${randomNum}`
}
```

**Uso:** Se genera automáticamente en `app/students/page.tsx` (línea 644) cuando se crea un nuevo estudiante.

#### **2. Validación del Código en Login/Registro**

**Validación en Login:**
- **Archivo:** `lib/auth-complex.ts` (líneas 130-199)
- **Función:** `authenticateStudent(studentCode, password)`
- **Proceso:**
  1. Normaliza el código (quita guiones/espacios)
  2. Busca en tabla `students` por `student_code`
  3. Busca usuario asociado en `system_users`
  4. Verifica contraseña hasheada

**Validación en Registro:**
- **Archivo:** `lib/auth-complex.ts` (líneas 296-348)
- **Función:** `verifyStudentCode(studentCode)`
- **Proceso:**
  1. Verifica que el código existe en `students`
  2. Verifica que no esté ya registrado en `system_users`

#### **3. Sistema de Autenticación**

**NO usa Supabase Auth** - Usa tabla propia con hash de contraseña:

**Tablas principales:**
- `students` - Datos del estudiante + `student_code`
- `system_users` - Usuarios del sistema (profesores/estudiantes)
- `user_sessions` - Sesiones activas

#### **4. Páginas/Archivos Implicados**

##### **Rutas Next.js:**
- `app/login/page.tsx` - Login de profesores
- `app/student-login/page.tsx` - Login de estudiantes
- `app/register/page.tsx` - Registro de estudiantes
- `app/student-dashboard/page.tsx` - Dashboard del estudiante

##### **Componentes de Formularios:**
- `components/auth/StudentLoginForm.tsx` - Formulario login estudiante
- `components/auth/TeacherLoginForm.tsx` - Formulario login profesor
- `components/auth/RegisterForm.tsx` - Formulario registro estudiante

##### **API Routes:**
- `app/api/auth/login/student/route.ts` - Endpoint login estudiante
- `app/api/auth/login/teacher/route.ts` - Endpoint login profesor
- `app/api/auth/register/route.ts` - Endpoint registro estudiante
- `app/api/auth/verify-code/route.ts` - Endpoint verificación código
- `app/api/auth/validate-session/route.ts` - Endpoint validación sesión

##### **Hooks:**
- `contexts/AuthContext.tsx` - Contexto de autenticación global
- `hooks/useAuthToken.ts` - Hook para token de autenticación
- `hooks/useRouteProtection.ts` - Hook para protección de rutas

#### **5. Tablas de BD y Columnas**

##### **Tabla `students`:**
```sql
- id (INTEGER PRIMARY KEY)
- student_code (TEXT UNIQUE) -- Código numérico EUREKA-YYYY-XXXX
- first_name, last_name, email, etc.
- password_hash (TEXT) -- Hash de contraseña (legacy)
```

##### **Tabla `system_users`:**
```sql
- id (UUID PRIMARY KEY)
- email (TEXT UNIQUE)
- password_hash (TEXT) -- Hash SHA256 de contraseña
- user_type (TEXT) -- 'teacher' o 'student'
- student_id (INTEGER UNIQUE) -- FK a students.id
```

##### **Tabla `user_sessions`:**
```sql
- id (UUID PRIMARY KEY)
- user_id (UUID) -- FK a system_users.id
- session_token (TEXT UNIQUE) -- Token de sesión
- expires_at (TIMESTAMPTZ) -- Expiración
```

#### **6. Políticas RLS Relevantes**

**Archivo:** `database/supabase-auth-rls-policies.sql`

##### **system_users:**
- Usuarios solo pueden leer/actualizar sus propios datos
- Solo service_role puede crear/eliminar usuarios

##### **students:**
- Profesores pueden ver todos los estudiantes
- Estudiantes solo pueden ver sus propios datos

##### **user_sessions:**
- Usuarios solo pueden gestionar sus propias sesiones
- Service role tiene acceso completo

#### **7. Flujo de Autenticación**

##### **Registro de Estudiante:**
1. Admin crea estudiante con código generado
2. Estudiante va a `/register`
3. Ingresa código + contraseña
4. Se valida código en `students` table
5. Se crea usuario en `system_users`
6. Login automático tras registro exitoso

##### **Login de Estudiante:**
1. Estudiante va a `/student-login`
2. Ingresa código + contraseña
3. Se busca en `students` por `student_code`
4. Se busca usuario asociado en `system_users`
5. Se verifica contraseña hasheada (SHA256)
6. Se crea sesión en `user_sessions`
7. Se redirige a `/student-dashboard`

#### **8. Funciones de Utilidad**

**Normalización de códigos:** `normalizeStudentCode()` - Quita guiones y espacios
**Hash de contraseñas:** `hashPassword()` - SHA256 simple
**Generación de tokens:** `generateSessionToken()` - 32 bytes hex
**Gestión de sesiones:** `create_user_session()` RPC function

#### **9. Seguridad**

- ✅ Contraseñas hasheadas con SHA256
- ✅ Tokens de sesión seguros (64 caracteres hex)
- ✅ RLS habilitado en todas las tablas
- ✅ Separación clara entre client/server code
- ✅ Validación de sesiones en cada request
- ✅ Expiración automática de sesiones (24h)

El sistema es **completamente custom** y NO utiliza Supabase Auth, sino que implementa su propio sistema de autenticación basado en tablas propias con hash de contraseñas y gestión de sesiones.

---

## 📧 **Prompt 2 — Verificación de Datos de Correo y Tablas**

### **1. Ubicación del Correo del Alumno**

#### **Tabla `students`:**
- **Columna:** `email` (TEXT)
- **Uso:** Correo principal del estudiante
- **Tipo:** TEXT (no UNIQUE en esta tabla)

#### **Tabla `system_users`:**
- **Columna:** `email` (TEXT UNIQUE)
- **Uso:** Correo para autenticación del sistema
- **Tipo:** TEXT UNIQUE NOT NULL
- **Relación:** Se copia desde `students.email` al crear usuario

### **2. Sincronización con auth.users**

**❌ NO hay sincronización con Supabase Auth**
- El sistema NO usa `auth.users` de Supabase
- Los correos se almacenan únicamente en las tablas propias
- No hay integración con el sistema de autenticación de Supabase

### **3. Nombres de Usuario vs Identificadores**

#### **Identificador de Login (Código Numérico):**
- **Tabla:** `students.student_code`
- **Formato:** `EUREKA-YYYY-XXXX`
- **Uso:** Login principal de estudiantes
- **Ejemplo:** `EUREKA-2024-1234`

#### **Nombre Visible (Display Name):**
- **Tabla:** `students.first_name` + `students.last_name`
- **Uso:** Nombre mostrado en la interfaz
- **Ejemplo:** `Juan Pérez`

#### **Correo para Autenticación:**
- **Tabla:** `system_users.email`
- **Uso:** Copia del correo del estudiante para el sistema de auth
- **Sincronización:** Se copia desde `students.email` al registrar

### **4. Listado Completo de Tablas/Columnas**

#### **Tabla `students`:**
```sql
- id (INTEGER PRIMARY KEY)
- first_name (TEXT) -- Nombre visible
- last_name (TEXT) -- Apellido visible
- email (TEXT) -- Correo principal
- student_code (TEXT UNIQUE) -- Código de login
- password_hash (TEXT) -- Hash legacy (no usado)
- birth_date, phone, parent_phone, etc.
- course_id (INTEGER) -- FK a courses
- start_date, fixed_schedule, etc.
- dni, nif, address, etc. -- Datos fiscales
- receptor_nombre, receptor_apellidos, receptor_email -- Datos del receptor
```

#### **Tabla `system_users`:**
```sql
- id (UUID PRIMARY KEY)
- email (TEXT UNIQUE) -- Copia del correo del estudiante
- password_hash (TEXT) -- Hash SHA256 para auth
- user_type (TEXT) -- 'teacher' o 'student'
- student_id (INTEGER UNIQUE) -- FK a students.id
- created_at, updated_at (TIMESTAMPTZ)
```

#### **Tabla `user_sessions`:**
```sql
- id (UUID PRIMARY KEY)
- user_id (UUID) -- FK a system_users.id
- session_token (TEXT UNIQUE) -- Token de sesión
- expires_at (TIMESTAMPTZ) -- Expiración
- created_at (TIMESTAMPTZ)
```

---

## 🗺️ **Prompt 3 — Mapa de Flujos Actuales**

### **1. Alta Alumno (Panel Profesor → Genera Código → Registro Alumno)**

```
📋 FLUJO COMPLETO DE ALTA DE ALUMNO
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│ 1. PROFESOR CREA ALUMNO                                         │
│    📁 app/students/page.tsx                                     │
│    🔧 generateStudentCode() → EUREKA-2024-1234                 │
│    💾 INSERT INTO students (student_code, email, etc.)         │
│                                                                 │
│ 2. ALUMNO RECIBE CÓDIGO                                         │
│    📧 Código enviado por profesor                              │
│    🔑 Código: EUREKA-2024-1234                                 │
│                                                                 │
│ 3. ALUMNO SE REGISTRA                                            │
│    🌐 /register                                                 │
│    📁 components/auth/RegisterForm.tsx                         │
│    🔍 verifyStudentCode() → Valida código                      │
│    🔐 registerStudent() → Crea usuario en system_users        │
│    🚀 Login automático → /student-dashboard                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Archivos involucrados:**
- `app/students/page.tsx` - Panel de creación
- `lib/utils.ts` - Generación de código
- `components/auth/RegisterForm.tsx` - Formulario registro
- `lib/auth-complex.ts` - Lógica de registro
- `app/api/auth/register/route.ts` - API endpoint

### **2. Login Alumno con Código + Contraseña**

```
🔐 FLUJO DE LOGIN DE ALUMNO
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│ 1. ALUMNO ACCEDE AL LOGIN                                        │
│    🌐 /student-login                                            │
│    📁 components/auth/StudentLoginForm.tsx                     │
│    📝 Ingresa: código + contraseña                             │
│                                                                 │
│ 2. VALIDACIÓN EN SERVIDOR                                        │
│    📁 app/api/auth/login/student/route.ts                      │
│    🔧 authenticateStudent(studentCode, password)               │
│    🔍 Busca en students por student_code                       │
│    🔍 Busca en system_users por student_id                     │
│    🔐 Verifica password_hash (SHA256)                          │
│                                                                 │
│ 3. CREACIÓN DE SESIÓN                                           │
│    🎫 generateSessionToken() → Token único                     │
│    💾 INSERT INTO user_sessions                                │
│    ⏰ Expiración: 24 horas                                     │
│                                                                 │
│ 4. REDIRECCIÓN                                                  │
│    🚀 /student-dashboard                                        │
│    🍪 Cookie: user_type=student                                │
│    💾 localStorage: session_token                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Archivos involucrados:**
- `app/student-login/page.tsx` - Página de login
- `components/auth/StudentLoginForm.tsx` - Formulario
- `app/api/auth/login/student/route.ts` - API endpoint
- `lib/auth-complex.ts` - Lógica de autenticación
- `contexts/AuthContext.tsx` - Gestión de sesión

### **3. Gestión de Cambio de Contraseña**

```
❌ CAMBIO DE CONTRASEÑA - NO IMPLEMENTADO
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│ 🚫 FUNCIONALIDAD NO DISPONIBLE                                  │
│                                                                 │
│ 📁 app/settings/page.tsx (líneas 333-377)                      │
│    - Solo UI mockup para profesores                            │
│    - No hay funcionalidad real                                 │
│                                                                 │
│ 📁 app/student-dashboard/profile/                              │
│    - No hay opción de cambio de contraseña                     │
│    - Solo visualización de datos                               │
│                                                                 │
│ 🔧 IMPLEMENTACIÓN NECESARIA:                                    │
│    - API endpoint para cambio de contraseña                    │
│    - Validación de contraseña actual                           │
│    - Hash de nueva contraseña                                  │
│    - Actualización en system_users.password_hash               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Estado actual:** ❌ **NO IMPLEMENTADO**
- Solo existe UI mockup en settings de profesores
- No hay funcionalidad real para estudiantes
- No hay API endpoints para cambio de contraseña

### **4. Middleware/Guards de Protección**

```
🛡️ SISTEMA DE PROTECCIÓN MULTICAPA
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│ 1. MIDDLEWARE (SERVER-SIDE)                                     │
│    📁 middleware.ts                                             │
│    🍪 Lee cookie: user_type                                     │
│    🚫 Bloquea acceso a rutas no autorizadas                    │
│    🔄 Redirige según tipo de usuario                           │
│                                                                 │
│ 2. AUTHCONTEXT (CLIENT-SIDE)                                    │
│    📁 contexts/AuthContext.tsx                                 │
│    🔍 Valida sesión en cada navegación                         │
│    🚫 Redirige si no hay usuario                               │
│    🔄 Redirige según tipo de usuario                           │
│                                                                 │
│ 3. ROUTE PROTECTION HOOKS                                       │
│    📁 hooks/useRouteProtection.ts                              │
│    🎯 useTeacherRoute() / useStudentRoute()                    │
│    🚫 Protección a nivel de página                             │
│    🔄 Redirige si no tiene acceso                              │
│                                                                 │
│ 4. RLS POLICIES (DATABASE)                                      │
│    📁 database/supabase-auth-rls-policies.sql                 │
│    🔒 Políticas a nivel de base de datos                       │
│    🚫 Usuarios solo ven sus propios datos                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### **Rutas Protegidas:**

**Profesores:**
- `/dashboard`, `/students`, `/courses`, `/calendar`
- `/invoices`, `/class-tracking`, `/communications`
- `/stats`, `/settings`

**Estudiantes:**
- `/student-dashboard` (y todas las sub-rutas)

#### **Matriz de Redirecciones:**

| Usuario | Intenta Acceder | Redirigido A |
|---------|----------------|--------------|
| Student | `/dashboard` | `/student-dashboard/profile` |
| Student | `/students` | `/student-dashboard/profile` |
| Student | Cualquier ruta de profesor | `/student-dashboard/profile` |
| Teacher | `/student-dashboard` | `/dashboard` |
| Teacher | Cualquier ruta de estudiante | `/dashboard` |
| No autenticado | Cualquier ruta protegida | `/login` |

#### **Archivos de Protección:**
- `middleware.ts` - Protección server-side
- `contexts/AuthContext.tsx` - Protección client-side
- `hooks/useRouteProtection.ts` - Hooks de protección
- `database/supabase-auth-rls-policies.sql` - Políticas RLS

---

## 📊 **Resumen Ejecutivo**

### **Sistema de Autenticación:**
- ✅ **Custom** (no Supabase Auth)
- ✅ **Códigos numéricos** EUREKA-YYYY-XXXX
- ✅ **Hash SHA256** para contraseñas
- ✅ **Sesiones** con tokens seguros
- ✅ **RLS** habilitado

### **Datos de Correo:**
- ✅ **students.email** - Correo principal
- ✅ **system_users.email** - Copia para auth
- ❌ **NO sincronizado** con auth.users

### **Protección de Rutas:**
- ✅ **Middleware** server-side
- ✅ **AuthContext** client-side
- ✅ **Hooks** de protección
- ✅ **RLS** database-level

### **Funcionalidades Faltantes:**
- ❌ **Cambio de contraseña** para estudiantes
- ❌ **Recuperación de contraseña**
- ❌ **Verificación de email**

El sistema está **funcionalmente completo** para login/registro pero **carece de funcionalidades de gestión de contraseñas**.
