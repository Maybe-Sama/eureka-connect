# ⚡ Comandos Rápidos - Sistema de Seguimiento de Clases

## 🔍 Diagnóstico

```bash
# Analizar todos los alumnos y detectar problemas
node scripts/diagnose-class-tracking-issues.js
```

**Cuándo usar**: Cada lunes o después de operaciones masivas

**Salida**: Reporte detallado con alumnos problemáticos identificados

---

## 🔧 Corrección Automática

```bash
# Generar clases faltantes para todos los alumnos
node scripts/fix-class-tracking-issues.js
```

**Cuándo usar**: Después de revisar el diagnóstico o cuando sepas que faltan clases

**Efecto**: Crea clases faltantes en la base de datos (sin duplicar)

---

## 🧪 Pruebas

```bash
# Ejecutar suite de pruebas automáticas
node scripts/test-class-tracking-fix.js
```

**Cuándo usar**: Para verificar que el sistema funciona correctamente

**Salida**: Porcentaje de éxito y detalle de cada prueba

---

## 🚀 Desarrollo

```bash
# Iniciar servidor de desarrollo
pnpm dev

# Luego ir a:
# http://localhost:3000/class-tracking
```

---

## 📊 Flujo Completo Recomendado

```bash
# 1. Diagnóstico
node scripts/diagnose-class-tracking-issues.js

# 2. Revisar el reporte (leer la terminal)

# 3. Corrección
node scripts/fix-class-tracking-issues.js

# 4. Verificar
pnpm dev
# Ir a: http://localhost:3000/class-tracking
```

---

## 🆘 Comandos de Emergencia

### Si algo no funciona:

```bash
# 1. Ejecutar diagnóstico completo
node scripts/diagnose-class-tracking-issues.js

# 2. Revisar errores en el reporte

# 3. Verificar base de datos (Supabase)
# Ir a: https://app.supabase.com → Table Editor → students

# 4. Si hay datos corruptos, ejecutar corrección
node scripts/fix-class-tracking-issues.js
```

---

## 🗂️ Archivos Importantes

### Scripts
- `scripts/diagnose-class-tracking-issues.js` - Diagnóstico completo
- `scripts/fix-class-tracking-issues.js` - Corrección automática  
- `scripts/test-class-tracking-fix.js` - Suite de pruebas

### Documentación
- `GUIA_CORRECCION_SEGUIMIENTO_CLASES.md` - Guía completa
- `RESUMEN_CORRECCION_COMPLETA.md` - Resumen ejecutivo
- `COMANDOS_RAPIDOS.md` - Este archivo

### Código Principal
- `app/api/class-tracking/route.ts` - API principal
- `app/api/class-tracking/classes/route.ts` - API de clases
- `lib/class-generation.ts` - Lógica de generación

---

## 💡 Tips

### Ejecutar con salida a archivo

```bash
# Guardar reporte de diagnóstico
node scripts/diagnose-class-tracking-issues.js > diagnostico-$(date +%Y%m%d).log

# Guardar resultado de corrección
node scripts/fix-class-tracking-issues.js > correccion-$(date +%Y%m%d).log
```

### Buscar alumnos específicos en logs

```bash
# Windows PowerShell
node scripts/diagnose-class-tracking-issues.js | Select-String "María García"

# Linux/Mac
node scripts/diagnose-class-tracking-issues.js | grep "María García"
```

---

## 📅 Mantenimiento Semanal

```bash
# Cada lunes ejecutar:
node scripts/diagnose-class-tracking-issues.js

# Si el diagnóstico muestra problemas:
node scripts/fix-class-tracking-issues.js
```

---

## ✅ Checklist Rápido

- [ ] Ejecutar diagnóstico
- [ ] Revisar reporte
- [ ] Ejecutar corrección si es necesario
- [ ] Verificar en frontend
- [ ] Confirmar estadísticas correctas

---

**Última actualización**: Octubre 2025

