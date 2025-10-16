# 📧 Configuración de Email para Verificación

## 🔧 Variables de Entorno Requeridas

Para que el sistema de verificación de email funcione correctamente, necesitas configurar las siguientes variables de entorno en tu archivo `.env.local`:

### **Configuración SMTP:**

```env
# Configuración para envío de emails de verificación
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here
SMTP_FROM=your_email@gmail.com

# URL de la aplicación (para enlaces de verificación)
NEXT_PUBLIC_APP_URL=http://localhost:3000
VERCEL_URL=your_vercel_url_here
```

## 📋 Configuración por Proveedor

### **Gmail (Recomendado):**

1. **Habilita la verificación en 2 pasos** en tu cuenta de Google
2. **Genera una contraseña de aplicación:**
   - Ve a [Configuración de Google](https://myaccount.google.com/)
   - Seguridad → Verificación en 2 pasos → Contraseñas de aplicaciones
   - Genera una contraseña para "Correo"
3. **Usa la configuración:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=tu_email@gmail.com
   SMTP_PASS=contraseña_de_aplicación_generada
   SMTP_FROM=tu_email@gmail.com
   ```

### **Outlook/Hotmail:**

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=tu_email@outlook.com
SMTP_PASS=tu_contraseña
SMTP_FROM=tu_email@outlook.com
```

### **Yahoo:**

```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=tu_email@yahoo.com
SMTP_PASS=contraseña_de_aplicación
SMTP_FROM=tu_email@yahoo.com
```

### **Otros Proveedores SMTP:**

```env
SMTP_HOST=servidor_smtp_del_proveedor
SMTP_PORT=587  # Para TLS, o 465 para SSL
SMTP_USER=tu_email
SMTP_PASS=tu_contraseña
SMTP_FROM=email_del_remitente
```

## 🚀 Funcionalidades Implementadas

### **Módulos Creados:**

1. **`lib/email/mailer.ts`** - Configuración y envío de emails
2. **`lib/email/templates.ts`** - Plantillas HTML para emails

### **Endpoints que Usan Email:**

- **`POST /api/student/settings/initiate-email-verification`** - Envía email de verificación
- **`GET /api/auth/verify-email`** - Procesa la verificación del email

### **Flujo de Verificación:**

1. **Estudiante solicita verificación** → `POST /api/student/settings/initiate-email-verification`
2. **Sistema genera token único** → Almacena en `system_users.email_verification_token`
3. **Sistema envía email** → Usando `sendMail()` con plantilla HTML
4. **Estudiante hace clic en enlace** → `GET /api/auth/verify-email?token=...`
5. **Sistema verifica token** → Marca `email_verified = true`

## 🛠️ Instalación de Dependencias

Las dependencias ya están instaladas:

```bash
npm install nodemailer @types/nodemailer --legacy-peer-deps
```

## 🧪 Pruebas

### **Probar Configuración SMTP:**

```typescript
import { sendMail } from '@/lib/email/mailer';

// Prueba básica
await sendMail(
  'test@example.com',
  'Prueba de Email',
  '<h1>¡Email enviado correctamente!</h1>'
);
```

### **Probar Plantilla de Verificación:**

```typescript
import { verificationEmailTemplate } from '@/lib/email/templates';

const html = verificationEmailTemplate('https://tu-app.com/verify?token=abc123');
console.log(html); // Ver el HTML generado
```

## 🔒 Seguridad

- ✅ **Tokens únicos** de 64 caracteres hexadecimales
- ✅ **Expiración de 24 horas** para tokens de verificación
- ✅ **Validación de tipo de usuario** (solo estudiantes)
- ✅ **Limpieza de tokens** después de verificación
- ✅ **Manejo seguro de errores** sin exponer información sensible

## 📝 Notas Importantes

1. **Nunca commites** el archivo `.env.local` al repositorio
2. **Usa contraseñas de aplicación** en lugar de contraseñas normales
3. **Configura SPF, DKIM y DMARC** para mejorar la entrega de emails
4. **Considera usar un servicio de email** como SendGrid o Mailgun para producción

## 🚨 Solución de Problemas

### **Error: "Configuración SMTP incompleta"**
- Verifica que todas las variables de entorno estén definidas
- Asegúrate de que el archivo `.env.local` esté en la raíz del proyecto

### **Error: "No se pudo enviar el correo electrónico"**
- Verifica las credenciales SMTP
- Asegúrate de que la contraseña de aplicación sea correcta
- Verifica que el puerto y host sean correctos

### **Emails van a spam**
- Configura SPF, DKIM y DMARC
- Usa un servicio de email profesional
- Evita palabras que activen filtros de spam
















