# 🎯 Sistema de Castigos - EurekaProfe

## Descripción General

El sistema de castigos es una funcionalidad gamificada que permite a los profesores gestionar castigos de manera interactiva a través de una ruleta. Los estudiantes pueden girar la ruleta para recibir castigos aleatorios, y los profesores pueden gestionar el sistema completo.

## Características Principales

### 🎮 Para Estudiantes
- **Ruleta Interactiva**: Gira la ruleta para recibir castigos aleatorios
- **Historial Personal**: Ve todos tus castigos anteriores
- **Estados de Completado**: Sigue el progreso de tus castigos
- **Niveles de Severidad**: Castigos organizados por intensidad

### 👨‍🏫 Para Profesores
- **Gestión de Castigos**: Crea, edita y desactiva tipos de castigos
- **Control de Acceso**: Bloquea/desbloquea castigos específicos
- **Historial Global**: Ve todos los castigos de todos los estudiantes
- **Marcado de Completado**: Marca castigos como completados
- **Estadísticas**: Dashboard con métricas del sistema

## Estructura de Base de Datos

### Tablas Principales

#### `punishment_types`
```sql
- id: Identificador único
- name: Nombre del castigo
- description: Descripción detallada
- color: Color en formato hex (#fdd835)
- severity: Nivel de severidad (1-5)
- is_active: Si está disponible en la ruleta
- created_at/updated_at: Timestamps
```

#### `punishment_results`
```sql
- id: Identificador único
- student_id: ID del estudiante
- punishment_type_id: ID del tipo de castigo
- teacher_id: ID del profesor (opcional)
- result_date: Fecha del resultado
- is_completed: Si está completado
- completed_at: Fecha de completado
- notes: Notas adicionales
```

#### `punishment_settings`
```sql
- id: Identificador único
- setting_key: Clave de configuración
- setting_value: Valor de configuración
- description: Descripción de la configuración
```

## API Endpoints

### Tipos de Castigos
- `GET /api/punishments/types` - Obtener todos los tipos
- `POST /api/punishments/types` - Crear nuevo tipo
- `PUT /api/punishments/types` - Actualizar tipo existente

### Resultados de Castigos
- `GET /api/punishments/results` - Obtener resultados
- `POST /api/punishments/results` - Crear nuevo resultado
- `PUT /api/punishments/results` - Actualizar resultado

## Componentes Principales

### 1. Ruleta del Estudiante (`app/student-dashboard/profile/Ruleta.tsx`)
- Ruleta animada con castigos disponibles
- Lógica de giro aleatorio
- Guardado automático de resultados
- Historial personal

### 2. Panel del Profesor (`app/punishments/page.tsx`)
- Dashboard con estadísticas
- Gestión de tipos de castigos
- Historial global
- Control de completado

### 3. Modal de Gestión (`components/punishments/PunishmentTypeModal.tsx`)
- Formulario para crear/editar castigos
- Selector de colores
- Niveles de severidad
- Vista previa en tiempo real

## Niveles de Severidad

| Nivel | Nombre | Color | Descripción |
|-------|--------|-------|-------------|
| 1 | Muy Leve | Verde | Castigos menores |
| 2 | Leve | Amarillo | Castigos ligeros |
| 3 | Moderado | Naranja | Castigos medios |
| 4 | Severo | Rojo | Castigos fuertes |
| 5 | Muy Severo | Rojo Oscuro | Castigos máximos |

## Castigos por Defecto

1. **5 minutos extra de deberes** (Nivel 1)
2. **Traer resumen adicional** (Nivel 2)
3. **Ayudar a limpiar el aula** (Nivel 3)
4. **Exponer tema sorpresa** (Nivel 4)
5. **Trabajo adicional** (Nivel 5)

## Configuración

### 1. Instalar Dependencias
```bash
pnpm add react-custom-roulette
```

### 2. Configurar Base de Datos
```bash
# Ejecutar el esquema SQL
psql -d tu_base_de_datos -f database/punishments-schema.sql

# O usar el script de configuración
node scripts/setup-punishments-db.js
```

### 3. Configurar Rutas
- `/student-dashboard/profile` - Ruleta del estudiante
- `/punishments` - Panel del profesor

## Funcionalidades Avanzadas

### Sincronización en Tiempo Real
- WebSocket para sincronización profesor-estudiante
- Eventos de giro de ruleta
- Actualizaciones automáticas

### Gamificación
- Sistema de puntos por completar castigos
- Logros y badges
- Ranking de estudiantes

### Reportes
- Estadísticas de castigos por estudiante
- Tendencias temporales
- Análisis de efectividad

## Seguridad

- Validación de permisos (solo profesores pueden gestionar)
- Sanitización de inputs
- Rate limiting en APIs
- Logs de auditoría

## Mantenimiento

### Limpieza Automática
- Castigos completados antiguos
- Resultados duplicados
- Configuraciones obsoletas

### Backup
- Exportación de configuraciones
- Respaldo de historial
- Migración de datos

## Troubleshooting

### Problemas Comunes
1. **Ruleta no gira**: Verificar que hay castigos activos
2. **No se guardan resultados**: Revisar permisos de base de datos
3. **Colores no se muestran**: Verificar formato hex de colores

### Logs
- Errores de API en consola
- Logs de base de datos
- Métricas de uso

## Roadmap

### Próximas Funcionalidades
- [ ] Notificaciones push
- [ ] Integración con calendario
- [ ] Sistema de recompensas
- [ ] Análisis de comportamiento
- [ ] API móvil

## Contribución

Para contribuir al sistema de castigos:
1. Fork del repositorio
2. Crear rama feature
3. Implementar cambios
4. Tests y documentación
5. Pull request

## Licencia

Sistema desarrollado para EurekaProfe - Todos los derechos reservados.
