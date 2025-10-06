# 🔧 Guía de Configuración de Variables de Entorno

## ⚠️ Problema Resuelto

Se han corregido errores de seguridad críticos donde código del servidor se estaba ejecutando en el cliente. Ahora toda la autenticación se maneja a través de API routes seguras.

## 📝 Crear el Archivo `.env.local`

1. **Crea un archivo llamado `.env.local` en la raíz del proyecto** (mismo nivel que `package.json`)

2. **Agrega el siguiente contenido:**

```env
# ============================================================
# Configuración de Supabase
# ============================================================
# Obtén estos valores desde tu dashboard de Supabase:
# 1. Ve a https://supabase.com
# 2. Selecciona tu proyecto
# 3. Ve a Settings → API
# 4. Copia los valores correspondientes

# URL del Proyecto (ejemplo: https://abcdefghijk.supabase.co)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here

# Clave Anónima (anon/public key - es seguro exponerla al cliente)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Clave de Service Role (¡NUNCA exponerla al cliente! Solo servidor)
# Esta clave bypasea Row Level Security - úsala con precaución
# Búscala en Settings → API → service_role key (Project API keys)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# ============================================================
# Credenciales de Profesor
# ============================================================
# Credenciales para el login del profesor/administrador
TEACHER_EMAIL=profesor@eureka.com
TEACHER_PASSWORD=profesor123
```

## 🔍 Cómo Obtener tus Credenciales de Supabase

### Paso 1: Acceder al Dashboard
1. Ve a [supabase.com](https://supabase.com)
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto (o crea uno nuevo si aún no tienes)

### Paso 2: Obtener las Claves
1. En el menú lateral, ve a **Settings** (⚙️)
2. Selecciona **API**
3. Verás una sección llamada **Project API keys**
4. Encontrarás dos claves:
   - **`anon public`** → Esta va en `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **`service_role`** → Esta va en `SUPABASE_SERVICE_ROLE_KEY`
5. También verás el **Project URL** → Este va en `NEXT_PUBLIC_SUPABASE_URL`

### Paso 3: Copiar los Valores
- Haz clic en el ícono de copiar junto a cada valor
- Pégalos en tu archivo `.env.local`
- **¡IMPORTANTE!** No incluyas comillas alrededor de los valores

## ✅ Verificar la Configuración

Después de crear tu archivo `.env.local`:

1. **Reinicia el servidor de desarrollo:**
   ```bash
   # Detén el servidor actual (Ctrl+C)
   # Luego reinicia:
   pnpm dev
   ```

2. **Abre el navegador en `http://localhost:3000`**

3. **Verifica que no haya errores:**
   - No deberías ver mensajes sobre `SUPABASE_SERVICE_ROLE_KEY`
   - La página debería cargar correctamente
   - Deberías ver la pantalla de login

## 🔒 Seguridad

### ⚠️ ¡IMPORTANTE!

- **NUNCA** compartas tu `SUPABASE_SERVICE_ROLE_KEY`
- **NUNCA** la incluyas en el código del cliente
- **NUNCA** la subas a GitHub
- El archivo `.env.local` ya está en `.gitignore` para protegerte

### ✅ Arquitectura Segura Implementada

El proyecto ahora usa una arquitectura segura:

```
Cliente (Browser)
    ↓
lib/auth-client.ts (solo fetch a APIs)
    ↓
API Routes (app/api/auth/**/route.ts)
    ↓
lib/auth-complex.ts (servidor)
    ↓
lib/supabase-server.ts (servidor con service role key)
    ↓
Supabase Database
```

**Flujo anterior (INSEGURO - YA CORREGIDO):**
```
❌ Cliente → lib/auth.ts → lib/supabase-server.ts → ¡Exposición de clave!
```

**Flujo actual (SEGURO):**
```
✅ Cliente → lib/auth-client.ts → API Route → lib/auth-complex.ts → Supabase
```

## 🚀 Siguiente Paso

Una vez que hayas configurado el archivo `.env.local` y reiniciado el servidor:

1. Ve a `http://localhost:3000`
2. Deberías ver la pantalla de login sin errores
3. Prueba hacer login con:
   - **Email:** profesor@eureka.com
   - **Password:** profesor123

## 🆘 ¿Problemas?

### Error: "SUPABASE_SERVICE_ROLE_KEY no está configurada"
- ✅ Verifica que el archivo se llame exactamente `.env.local` (con el punto al inicio)
- ✅ Verifica que esté en la raíz del proyecto (mismo nivel que `package.json`)
- ✅ Verifica que las variables no tengan comillas
- ✅ Reinicia el servidor de desarrollo

### Error: "Invalid API key"
- ✅ Verifica que copiaste las claves correctamente desde Supabase
- ✅ Asegúrate de no haber incluido espacios extra al pegar
- ✅ Verifica que el proyecto de Supabase esté activo

### Error: "Network error"
- ✅ Verifica tu conexión a internet
- ✅ Verifica que la URL de Supabase sea correcta
- ✅ Asegúrate de que el proyecto de Supabase no esté pausado

## 📚 Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Variables de Entorno en Next.js](https://nextjs.org/docs/basic-features/environment-variables)
- [Seguridad en Supabase](https://supabase.com/docs/guides/auth/row-level-security)



