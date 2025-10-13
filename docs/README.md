# 🎓 Profesor Eureka CRM - Sistema de Gestión para Profesores Particulares

Un CRM moderno, ultra-intuitivo y profesional diseñado específicamente para profesores particulares autónomos en España. Con estética 2025 en modo oscuro exclusivo, este sistema te permite gestionar alumnos, horarios, clases y facturación de manera eficiente y elegante.

## ✨ Características Principales

### 🎯 Gestión de Alumnos
- **Formulario completo** con todos los datos necesarios (nombre, email, teléfono, fecha de nacimiento, teléfono de padres)
- **Tarifas personalizadas** por alumno (mensual + clases extra)
- **Historial completo** de clases y facturación
- **Búsqueda y filtros** avanzados

### 📅 Calendario Inteligente
- **Vista semanal** con horarios visuales claros
- **Drag & Drop** fluido para programar clases
- **Diferenciación automática** entre clases fijas (recurrentes) y eventuales
- **Modal inteligente** que pregunta si el cambio es puntual o permanente
- **Verificación de disponibilidad** antes de asignar horarios

### 💰 Facturación Profesional
- **Cumplimiento normativa española 2025** (numeración correlativa, IVA/IRPF)
- **Generación automática** de facturas mensuales
- **Desglose detallado** de clases fijas y eventuales
- **Estados de facturación** (generada, enviada, pagada, pendiente)
- **Envío automático** por email + copia al contable

### 📊 Dashboard Financiero
- **Métricas en tiempo real** de ingresos y carga horaria
- **Gráficos interactivos** de evolución mensual/semanal
- **Estadísticas por materia** y rendimiento
- **Insights automáticos** y recomendaciones

### 🔔 Sistema de Comunicaciones
- **Plantillas personalizables** para recordatorios y mensajes
- **Envío automático** por email y WhatsApp
- **Programación de notificaciones** con anticipación configurable
- **Historial completo** de comunicaciones

### ⚙️ Configuración Centralizada
- **Perfil del profesor** completo (NIF, dirección fiscal, datos bancarios)
- **Configuración de notificaciones** personalizable
- **Preferencias del sistema** (idioma, zona horaria, formato de fechas)
- **Seguridad y respaldos** automáticos

## 🎨 Diseño y UX

### 🌑 Modo Oscuro Exclusivo
- **Solo modo oscuro** - nada de modo claro
- **Estética 2025** moderna, minimalista y premium
- **Paleta sobria** con acentos en neón y degradados suaves
- **Inspiración en startups SaaS** de última generación (Linear, Vercel, Notion dark)

### ✨ Microanimaciones y Transiciones
- **Framer Motion** para animaciones fluidas
- **Transiciones suaves** entre páginas y componentes
- **Efectos hover** elegantes y responsivos
- **Feedback visual** inmediato en todas las acciones

### 📱 Diseño Responsivo
- **Mobile-first** approach
- **Sidebar colapsable** para dispositivos móviles
- **Grid adaptativo** que se ajusta a cualquier pantalla
- **Touch-friendly** para tablets y smartphones

## 🚀 Tecnologías Utilizadas

- **Next.js 14** - Framework React con App Router
- **TypeScript** - Tipado estático para mayor robustez
- **Supabase** - Base de datos PostgreSQL en la nube
- **Tailwind CSS** - Framework CSS utility-first
- **Framer Motion** - Biblioteca de animaciones
- **Lucide React** - Iconos modernos y consistentes
- **React Hook Form** - Gestión de formularios eficiente
- **Radix UI** - Componentes accesibles y personalizables

## 📁 Estructura del Proyecto

```
eureka-profe-crm/
├── app/                    # Páginas de la aplicación
│   ├── page.tsx           # Dashboard principal
│   ├── students/          # Gestión de alumnos
│   ├── calendar/          # Calendario y horarios
│   ├── invoices/          # Facturación
│   ├── stats/             # Estadísticas y análisis
│   ├── communications/    # Sistema de comunicaciones
│   └── settings/          # Configuración del sistema
├── components/            # Componentes reutilizables
│   ├── ui/               # Componentes base (Button, etc.)
│   └── layout/           # Componentes de layout (Sidebar, etc.)
├── types/                # Definiciones TypeScript
├── lib/                  # Utilidades y funciones helper
└── public/               # Archivos estáticos
```

## 🛠️ Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- pnpm (recomendado) o npm
- Cuenta de Supabase (gratuita)

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/eureka-profe-crm.git
cd eureka-profe-crm
```

2. **Instalar dependencias**
```bash
pnpm install
# o
npm install
```

3. **Configurar Supabase**
   - Crear proyecto en [supabase.com](https://supabase.com)
   - Ejecutar el script `supabase-schema.sql` en el SQL Editor
   - Configurar variables de entorno (ver `SUPABASE_SETUP.md`)

4. **Configurar variables de entorno**
```bash
cp supabase-config.example .env.local
# Editar .env.local con tus credenciales de Supabase
```

5. **Ejecutar en modo desarrollo**
```bash
pnpm dev
# o
npm run dev
```

6. **Abrir en el navegador**
```
http://localhost:3000
```

### 📚 Documentación Adicional
- [Guía de Configuración de Supabase](SUPABASE_SETUP.md)
- [Guía de Migración](MIGRATION_GUIDE.md)

### Scripts Disponibles

- `pnpm dev` - Servidor de desarrollo
- `pnpm build` - Construir para producción
- `pnpm start` - Servidor de producción
- `pnpm lint` - Verificar código con ESLint

## 🔧 Configuración del Entorno

### Variables de Entorno (Requeridas)
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=tu_project_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

### Variables Opcionales
```env
NEXT_PUBLIC_APP_NAME=Profesor Eureka
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Personalización de Colores
Los colores se pueden personalizar en `tailwind.config.js`:

```javascript
colors: {
  primary: {
    DEFAULT: '#6366f1',    // Color principal
    hover: '#4f46e5',      // Hover del color principal
  },
  accent: {
    DEFAULT: '#8b5cf6',    // Color de acento
    hover: '#7c3aed',      // Hover del acento
  },
  // ... más colores
}
```

## 📱 Características por Página

### 🏠 Dashboard
- Resumen de métricas clave
- Clases del día
- Actividad reciente
- Acciones rápidas

### 👥 Gestión de Alumnos
- CRUD completo de estudiantes
- Búsqueda y filtros
- Estadísticas por alumno
- Historial de clases

### 📅 Calendario
- Vista semanal interactiva
- Programación de clases
- Modal de cambio inteligente
- Verificación de disponibilidad

### 📄 Facturación
- Generación automática
- Cumplimiento normativa española
- Estados de facturación
- Vista previa profesional

### 📊 Estadísticas
- Gráficos interactivos
- Métricas de rendimiento
- Insights automáticos
- Exportación de datos

### 💬 Comunicaciones
- Plantillas personalizables
- Programación automática
- Múltiples canales (email, WhatsApp)
- Historial completo

### ⚙️ Configuración
- Perfil del profesor
- Configuración de notificaciones
- Preferencias del sistema
- Seguridad y respaldos

## 🎯 Casos de Uso

### Para Profesores Particulares
- **Gestión diaria** de alumnos y horarios
- **Facturación mensual** automática
- **Comunicación proactiva** con estudiantes
- **Análisis de rendimiento** del negocio

### Para Contadores
- **Facturas cumpliendo normativa** española
- **Numeración correlativa** automática
- **Desglose detallado** de servicios
- **Exportación** para contabilidad

### Para Administración
- **Cumplimiento fiscal** completo
- **Documentación** organizada
- **Historial** de todas las operaciones
- **Respaldo** automático de datos

## 🔒 Cumplimiento Legal

### Normativa Española 2025
- **Numeración correlativa** de facturas
- **Datos fiscales completos** del profesor
- **Cálculo automático** de IVA (21%)
- **Información bancaria** para pagos
- **Dirección fiscal** completa

### Protección de Datos
- **GDPR compliance** para datos de alumnos
- **Encriptación** de información sensible
- **Respaldo automático** de datos
- **Exportación** de datos personales

## 🚀 Roadmap Futuro

### Versión 1.1
- [ ] Integración con WhatsApp Business API
- [ ] Sistema de pagos online
- [ ] App móvil nativa
- [ ] Integración con calendarios externos

### Versión 1.2
- [ ] Sistema de evaluaciones
- [ ] Material didáctico digital
- [ ] Videoconferencias integradas
- [ ] Analytics avanzados

### Versión 2.0
- [ ] Multi-usuario (equipos de profesores)
- [ ] Marketplace de servicios
- [ ] IA para optimización de horarios
- [ ] Integración con sistemas educativos

## 🤝 Contribuir

### Cómo Contribuir
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Estándares de Código
- **TypeScript** estricto
- **ESLint** para consistencia
- **Prettier** para formato
- **Commits semánticos** (feat:, fix:, docs:, etc.)

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

### Contacto
- **Email**: soporte@eurekaprofe.com
- **Documentación**: [docs.eurekaprofe.com](https://docs.eurekaprofe.com)
- **Issues**: [GitHub Issues](https://github.com/tu-usuario/eureka-profe-crm/issues)

### Comunidad
- **Discord**: [Profesor Eureka Community](https://discord.gg/eurekaprofe)
- **Twitter**: [@Profesor Eureka](https://twitter.com/Profesor Eureka)
- **Blog**: [blog.eurekaprofe.com](https://blog.eurekaprofe.com)

## 🙏 Agradecimientos

- **Next.js Team** por el increíble framework
- **Tailwind CSS** por el sistema de diseño
- **Framer Motion** por las animaciones fluidas
- **Comunidad React** por el ecosistema
- **Profesores españoles** por el feedback y testing

---

**Desarrollado con ❤️ para profesores particulares autónomos**

*Profesor Eureka CRM - Transformando la gestión educativa privada*


