# 🔧 Configuración de Variables de Entorno en Vercel

## 🚨 **Problema Resuelto**

**Error**: `"Environment Variable "NEXT_PUBLIC_SUPABASE_URL" references Secret "next_public_supabase_url", which does not exist."`

**Causa**: El archivo `vercel.json` estaba configurado incorrectamente para usar secrets en lugar de variables de entorno normales.

**Solución**: Simplificar `vercel.json` y configurar las variables directamente en el dashboard de Vercel.

## 📋 **Pasos para Configurar Variables en Vercel**

### **Paso 1: Acceder al Dashboard de Vercel**

1. Ve a [vercel.com](https://vercel.com)
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto `eureka-connect`

### **Paso 2: Ir a la Sección de Variables de Entorno**

1. En tu proyecto, haz clic en **"Settings"**
2. En el menú lateral, selecciona **"Environment Variables"**
3. Verás una lista de variables existentes (si las hay)

### **Paso 3: Agregar Variables de Entorno**

Haz clic en **"Add New"** y agrega cada variable una por una:

#### **🔗 Variables de Supabase (Producción)**

| Variable | Valor | Entorno |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://tu-proyecto-prod.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (tu clave anónima) | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (tu service role key) | Production, Preview, Development |

#### **🌐 Variables de URLs**

| Variable | Valor | Entorno |
|----------|-------|---------|
| `NEXT_PUBLIC_BASE_URL` | `https://tu-dominio.vercel.app` | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | `https://tu-dominio.vercel.app` | Production, Preview, Development |
| `NEXT_PUBLIC_VERIFICATION_URL` | `https://verificacion.tu-dominio.com` | Production, Preview, Development |

#### **👤 Variables de Autenticación**

| Variable | Valor | Entorno |
|----------|-------|---------|
| `TEACHER_EMAIL` | `profesor@tu-dominio.com` | Production, Preview, Development |
| `TEACHER_PASSWORD` | `tu_password_seguro_prod` | Production, Preview, Development |

#### **📧 Variables de Email (SMTP)**

| Variable | Valor | Entorno |
|----------|-------|---------|
| `SMTP_HOST` | `smtp.tu-proveedor.com` | Production, Preview, Development |
| `SMTP_PORT` | `587` | Production, Preview, Development |
| `SMTP_USER` | `tu_email@tu-dominio.com` | Production, Preview, Development |
| `SMTP_PASS` | `tu_password_smtp` | Production, Preview, Development |
| `SMTP_FROM` | `tu_email@tu-dominio.com` | Production, Preview, Development |

#### **🔐 Variables de RRSIF**

| Variable | Valor | Entorno |
|----------|-------|---------|
| `NEXT_PUBLIC_RRSIF_SECRET_KEY` | `tu_clave_secreta_super_segura_prod` | Production, Preview, Development |

### **Paso 4: Configurar Entornos**

Para cada variable, asegúrate de seleccionar:
- ✅ **Production** (para el despliegue en producción)
- ✅ **Preview** (para pull requests)
- ✅ **Development** (para desarrollo local con Vercel)

### **Paso 5: Guardar y Redesplegar**

1. Haz clic en **"Save"** después de agregar cada variable
2. Ve a la pestaña **"Deployments"**
3. Haz clic en **"Redeploy"** en el último despliegue
4. O haz un nuevo commit para activar un nuevo despliegue

## 🔍 **Verificación de la Configuración**

### **Paso 1: Verificar en el Dashboard**

1. Ve a **Settings** → **Environment Variables**
2. Verifica que todas las variables estén listadas
3. Verifica que tengan los valores correctos
4. Verifica que estén habilitadas para **Production**

### **Paso 2: Verificar en el Despliegue**

1. Ve a la pestaña **"Deployments"**
2. Haz clic en el último despliegue
3. Ve a **"Functions"** → **"View Function Logs"**
4. Verifica que no hay errores relacionados con variables de entorno

### **Paso 3: Probar la Aplicación**

1. Abre tu aplicación en producción
2. Verifica que:
   - La página carga correctamente
   - No hay errores en la consola del navegador
   - Las funcionalidades principales funcionan
   - La conexión a Supabase funciona

## 🚨 **Troubleshooting**

### **Error: "Environment Variable not found"**

**Causa**: La variable no está configurada en Vercel
**Solución**: 
1. Ve a Settings → Environment Variables
2. Agrega la variable faltante
3. Redesplega la aplicación

### **Error: "Invalid API key"**

**Causa**: La clave de Supabase es incorrecta
**Solución**:
1. Verifica que copiaste la clave correctamente
2. Asegúrate de que no hay espacios extra
3. Verifica que el proyecto de Supabase esté activo

### **Error: "Network error"**

**Causa**: URL de Supabase incorrecta
**Solución**:
1. Verifica que la URL de Supabase sea correcta
2. Asegúrate de que incluya `https://`
3. Verifica que el proyecto no esté pausado

### **Error: "SMTP configuration incomplete"**

**Causa**: Variables de email faltantes o incorrectas
**Solución**:
1. Verifica que todas las variables SMTP estén configuradas
2. Verifica que las credenciales sean correctas
3. Prueba la configuración SMTP localmente primero

## 📝 **Archivo vercel.json Simplificado**

El archivo `vercel.json` ahora está simplificado y solo contiene la configuración esencial:

```json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NODE_ENV": "production"
  }
}
```

## 🔐 **Seguridad de Variables**

### **Variables Públicas (NEXT_PUBLIC_*)**
- ✅ Se exponen al cliente
- ✅ Seguras para usar en el navegador
- ✅ Ejemplo: `NEXT_PUBLIC_SUPABASE_URL`

### **Variables Privadas (Sin NEXT_PUBLIC_)**
- 🔒 Solo accesibles en el servidor
- 🔒 Nunca se exponen al cliente
- 🔒 Ejemplo: `SUPABASE_SERVICE_ROLE_KEY`

## 🎯 **Próximos Pasos**

1. **Configurar todas las variables** en el dashboard de Vercel
2. **Redesplegar la aplicación**
3. **Probar todas las funcionalidades**
4. **Verificar que no hay errores**
5. **Configurar dominio personalizado** (opcional)

## ✅ **Checklist de Verificación**

- [ ] Variables de Supabase configuradas
- [ ] Variables de URLs configuradas
- [ ] Variables de autenticación configuradas
- [ ] Variables de email configuradas
- [ ] Variables de RRSIF configuradas
- [ ] Todas las variables habilitadas para Production
- [ ] Aplicación redesplegada
- [ ] Funcionalidades probadas
- [ ] Sin errores en la consola

¡Tu aplicación estará lista para producción! 🚀
