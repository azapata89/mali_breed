# MaliBreed Pro

Una aplicación web moderna para criadores de perros Malinois que facilita la gestión del programa de cría, análisis de parentesco y planificación de cruzas genéticamente óptimas.

![MaliBreed Pro](https://via.placeholder.com/800x400?text=MaliBreed+Pro)

## 🌟 Características Principales

- **Gestión de Perros**: Registro completo con información detallada, filtros y visualización en tarjetas.
- **Análisis de Cruza**: Cálculo de Índice de Consanguinidad (IC) y Coeficiente de Pérdida Ancestral (ALC).
- **Registro de Camadas**: Seguimiento de cachorros y actualización de estados.
- **Dashboard**: Estadísticas del criadero y gráficos informativos.

## 📋 Requisitos

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- No requiere instalación ni dependencias externas

## 🚀 Cómo Usar

### Instalación Local

1. Clona este repositorio:
   ```bash
   git clone https://github.com/tu-usuario/malibreed-pro.git
   ```
2. Abre el archivo `index.html` en tu navegador.

### Uso en GitHub Pages

Visita la aplicación desplegada en: [https://tu-usuario.github.io/malibreed-pro](https://tu-usuario.github.io/malibreed-pro)

## 📱 Funcionalidades

### Dashboard

El dashboard proporciona una vista general del criadero con:

- Estadísticas de perros y camadas
- Distribución por género
- Lista de reproductores destacados

### Gestión de Perros

- **Agregar Nuevo Perro**: Completa el formulario con todos los datos relevantes.
- **Filtrar Perros**: Utiliza los filtros por nombre, género, edad y títulos.
- **Ver Detalles**: Accede a información completa, pedigree y descendencia.

### Análisis de Cruza

1. Selecciona un perro macho y una hembra.
2. Haz clic en "Analizar Compatibilidad".
3. Revisa el Índice de Consanguinidad (IC) y Coeficiente de Pérdida Ancestral (ALC).
4. Si la cruza es recomendada, puedes registrar la camada directamente.

### Gestión de Camadas

- **Ver Camadas**: Explora las camadas registradas con información de los padres y cachorros.
- **Detalles de Camada**: Accede a información detallada, análisis genético y listado de cachorros.
- **Gestión de Cachorros**: Añade nuevos cachorros, actualiza su estado o regístralos como perros adultos.

## 💾 Almacenamiento de Datos

La aplicación utiliza localStorage para guardar todos los datos:

- Los perros se guardan en `malibreed_dogs`
- Las camadas se guardan en `malibreed_litters`

## 🎨 Personalización

### Colores

La aplicación utiliza la siguiente paleta de colores:

- Color primario: `#166534` (verde oscuro)
- Color primario claro: `#10B981` (verde claro)
- Color secundario: `#A16207` (marrón)
- Color secundario claro: `#FEF3C7` (beige claro)

Puedes modificar estos colores en la configuración de Tailwind en el archivo `index.html`.

## 🔧 Desarrollo

### Estructura del Proyecto

```
malibreed-pro/
├── index.html      # Estructura HTML principal
├── app.js          # Lógica de la aplicación Vue.js
└── README.md       # Documentación
```

### Tecnologías Utilizadas

- **HTML5/CSS3**: Estructura y estilos.
- **Tailwind CSS**: Framework de utilidades CSS.
- **Vue.js 3**: Framework JavaScript reactivo.
- **Font Awesome**: Iconografía.
- **localStorage**: Persistencia de datos.

## 📝 Notas Adicionales

- La aplicación incluye datos de ejemplo para demostración.
- Todos los cálculos genéticos son simulados y deben ser revisados por profesionales.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para cambios importantes, por favor abre primero un issue para discutir qué te gustaría cambiar.

## 📄 Licencia

Este proyecto está licenciado bajo [MIT License](LICENSE).

---

Desarrollado para Colin Canine Center © 2023