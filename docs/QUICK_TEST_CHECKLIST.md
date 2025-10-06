# ✅ Checklist de Pruebas Rápidas

## 🔍 Pre-requisitos
- [ ] Tienes un código de estudiante válido en Supabase (tabla `students`, columna `student_code`)
- [ ] Ese código NO está registrado en `system_users` (debe ser un estudiante nuevo)

---

## 📝 Test 1: Validación en Tiempo Real del Código

1. [ ] Ve a `http://localhost:3000/register`
2. [ ] Empieza a escribir un código de estudiante
3. [ ] Espera 1 segundo sin escribir
4. [ ] **CON CÓDIGO VÁLIDO:**
   - [ ] ✅ Aparece check verde a la derecha del input
   - [ ] 🟢 Borde del input se pone verde
   - [ ] 👤 Se muestra: "Estudiante: [Nombre del estudiante]"
   - [ ] 🟢 Botón cambia a verde y dice "Continuar"
5. [ ] **CON CÓDIGO INVÁLIDO:**
   - [ ] ❌ Aparece X roja a la derecha del input
   - [ ] 🔴 Borde del input se pone rojo
   - [ ] ⚠️ Mensaje de error: "Código inválido" o "Este código ya ha sido registrado"

---

## 📝 Test 2: Registro Completo

1. [ ] Ingresa un código válido (debe mostrar check verde)
2. [ ] Click en "Continuar"
3. [ ] Verifica que pasas al paso 2 (contraseñas)
4. [ ] Ingresa una contraseña de al menos 6 caracteres
5. [ ] Repite la misma contraseña en "Confirmar Contraseña"
6. [ ] Click en "Completar Registro"
7. [ ] **RESULTADO ESPERADO:**
   - [ ] ✅ Mensaje: "¡Registro Exitoso!"
   - [ ] ⏱️ Redirección automática a `/login` en 2 segundos

---

## 📝 Test 3: Login de Estudiante

1. [ ] Ve a `http://localhost:3000/login`
2. [ ] Selecciona "Estudiante"
3. [ ] Ingresa el código que acabas de registrar
4. [ ] Ingresa la contraseña
5. [ ] Click en "Iniciar Sesión"
6. [ ] **RESULTADO ESPERADO:**
   - [ ] ✅ Login exitoso
   - [ ] ➡️ Redirección a `/student-dashboard/profile`
   - [ ] 👀 Ves tu información de perfil

---

## 📝 Test 4: Dashboard de Estudiante

1. [ ] Estás en `/student-dashboard/profile`
2. [ ] **Verifica que se muestra:**
   - [ ] 📇 Tarjeta "Información Personal"
   - [ ] 🆔 Tarjeta "Identificación"
   - [ ] 📍 Tarjeta "Dirección"
   - [ ] 👤 Tu nombre completo
   - [ ] 📧 Tu email (si existe)
3. [ ] Click en "Calendario" en el sidebar
4. [ ] **Verifica:**
   - [ ] ➡️ Vas a `/student-dashboard/calendar`
   - [ ] 📅 Se muestra un calendario
5. [ ] Click en "Facturas" en el sidebar
6. [ ] **Verifica:**
   - [ ] ➡️ Vas a `/student-dashboard/invoices`
   - [ ] 🧾 Se muestra lista de facturas (puede estar vacía)

---

## 📝 Test 5: Protección de Rutas

1. [ ] **ESTANDO LOGUEADO COMO ESTUDIANTE:**
2. [ ] Intenta acceder manualmente a `http://localhost:3000/dashboard`
3. [ ] **RESULTADO ESPERADO:**
   - [ ] 🚫 Redirección automática a `/student-dashboard/profile`
   - [ ] ⚠️ Mensaje en consola: "Estudiante intentando acceder a ruta de profesor"

4. [ ] Cierra sesión
5. [ ] Intenta acceder a `http://localhost:3000/student-dashboard/profile` sin estar logueado
6. [ ] **RESULTADO ESPERADO:**
   - [ ] 🚫 Redirección automática a `/login`

---

## 📝 Test 6: Validación de Contraseñas

1. [ ] Ve a `/register` e ingresa un código válido
2. [ ] En el paso 2, ingresa:
   - Contraseña: `12345` (menos de 6 caracteres)
   - Confirmar: `12345`
3. [ ] Click en "Completar Registro"
4. [ ] **RESULTADO ESPERADO:**
   - [ ] ⚠️ Error: "La contraseña debe tener al menos 6 caracteres"

5. [ ] Intenta con:
   - Contraseña: `123456`
   - Confirmar: `654321` (diferentes)
6. [ ] **RESULTADO ESPERADO:**
   - [ ] ⚠️ Error: "Las contraseñas no coinciden"

---

## 📝 Test 7: Código Ya Registrado

1. [ ] Ve a `/register`
2. [ ] Ingresa el código de un estudiante que ya completó el registro
3. [ ] **RESULTADO ESPERADO:**
   - [ ] ❌ X roja en el input
   - [ ] 🔴 Borde rojo
   - [ ] ⚠️ Mensaje: "Este código ya ha sido registrado"
   - [ ] 🔒 No puedes continuar al paso 2

---

## 🐛 Si Algo Falla

### **Abre la Consola del Navegador (F12)**
- Busca errores en rojo
- Copia el mensaje de error completo

### **Verifica la Consola del Terminal**
- Busca logs de error
- Especialmente errores de Supabase

### **Información a Reportar:**
1. ✅ Qué test estabas haciendo (número del test)
2. ❌ Qué falló exactamente
3. 📋 Mensaje de error (consola navegador + terminal)
4. 📸 Captura de pantalla (opcional pero útil)

---

## 🎯 Criterios de Éxito

**✅ TODO FUNCIONA SI:**

1. ✅ Validación en tiempo real muestra check verde/X roja correctamente
2. ✅ Puedes registrar un estudiante nuevo con código válido
3. ✅ No puedes registrar el mismo código dos veces
4. ✅ Puedes hacer login con el estudiante registrado
5. ✅ Eres redirigido automáticamente a `/student-dashboard/profile`
6. ✅ Puedes navegar entre Perfil, Calendario y Facturas
7. ✅ No puedes acceder a `/dashboard` como estudiante
8. ✅ No puedes acceder a `/student-dashboard` sin login

---

**Fecha**: 2025-10-05  
**Versión**: 1.0


