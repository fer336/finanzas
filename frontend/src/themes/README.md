# Sistema de Temas Dinámico

Este sistema permite cambiar los colores de toda la aplicación de forma dinámica y consistente.

## 🚀 Características

- **3 temas predefinidos**: Primary (verde), Blue (azul), Purple (púrpura)
- **Cambio dinámico**: Sin recargar la página
- **Persistencia**: Los temas se guardan en localStorage
- **CSS Variables**: Sistema basado en variables CSS nativas
- **Tailwind Integration**: Clases de utilidad optimizadas
- **React Context**: Gestión de estado reactiva

## 📁 Estructura de Archivos

```
src/themes/
├── theme-config.js       # Configuración de temas y funciones
├── README.md            # Esta documentación
└── /

src/contexts/
├── ThemeProvider.jsx    # Proveedor de contexto React

src/components/
├── theme-selector.jsx   # Componente selector de temas
```

## 🎨 Temas Disponibles

### 1. Primary Theme (Verde)
- **Fondo**: `#111827` (gris muy oscuro)
- **Cards**: `#1F2937` (gris oscuro)
- **Acento**: `#6EE7B7` (verde claro) / `#10B981` (verde oscuro)
- **Uso**: Tema principal recomendado

### 2. Blue Theme (Azul)
- **Fondo**: `#0F172A` (azul muy oscuro)
- **Cards**: `#1E293B` (azul oscuro)
- **Acento**: `#60A5FA` (azul claro) / `#2563EB` (azul oscuro)
- **Uso**: Ambiente profesional y elegante

### 3. Purple Theme (Púrpura)
- **Fondo**: `#1A0B2E` (púrpura muy oscuro)
- **Cards**: `#2D1B69` (púrpura oscuro)
- **Acento**: `#C4B5FD` (púrpura claro) / `#8B5CF6` (púrpura oscuro)
- **Uso**: Diseño moderno y creativo

## 🛠️ Uso Básico

### 1. Cambiar tema programáticamente

```javascript
import { applyTheme } from '../themes/theme-config';

// Cambiar a tema azul
applyTheme('blue');

// Cambiar a tema púrpura
applyTheme('purple');

// Volver al tema principal
applyTheme('primary');
```

### 2. Usar el hook useTheme

```jsx
import { useTheme } from '../contexts/ThemeProvider';

function MyComponent() {
  const { currentTheme, changeTheme, themes } = useTheme();
  
  return (
    <div>
      <p>Tema actual: {currentTheme}</p>
      <button onClick={() => changeTheme('blue')}>
        Cambiar a Azul
      </button>
    </div>
  );
}
```

### 3. Usar el componente ThemeSelector

```jsx
import { ThemeSelector } from '../components/theme-selector';

function Header() {
  return (
    <div>
      <h1>Mi App</h1>
      {/* Selector en dropdown */}
      <ThemeSelector />
      
      {/* Selector como card */}
      <ThemeSelector showAsCard={true} />
    </div>
  );
}
```

## 🎯 Variables CSS Disponibles

### Fondos
- `--bg-dark`: Fondo principal de la aplicación
- `--card-dark`: Fondo de cards y elementos elevados
- `--surface-hover`: Color de hover para superficies

### Textos
- `--text-main`: Texto principal (alta legibilidad)
- `--text-secondary`: Texto secundario (menor contraste)
- `--text-muted`: Texto silenciado (menor importancia)

### Colores de Acento
- `--green-light`: Color primario claro
- `--green-dark`: Color primario oscuro
- `--green-muted`: Color primario con transparencia

### Estados
- `--success-bg` / `--success-text`: Verde para éxitos
- `--error-bg` / `--error-text`: Rojo para errores
- `--warning-bg` / `--warning-text`: Amarillo para advertencias
- `--info-bg` / `--info-text`: Azul para información

### Elementos UI
- `--border-color`: Color de bordes principales
- `--border-light`: Color de bordes más claros
- `--shadow-sm/md/lg`: Sombras de diferentes tamaños

## 🔧 Clases de Utilidad CSS

### Contenedores
- `.view-container`: Container principal para vistas
- `.view-header`: Header de vistas con espaciado
- `.card-modern`: Cards con el estilo del tema actual

### Textos
- `.text-main`: Texto principal
- `.text-secondary`: Texto secundario
- `.text-muted`: Texto silenciado
- `.view-title`: Títulos de vistas
- `.view-subtitle`: Subtítulos de vistas

### Badges
- `.badge-modern`: Badge base
- `.badge-success`: Badge verde
- `.badge-error`: Badge rojo
- `.badge-warning`: Badge amarillo
- `.badge-info`: Badge azul
- `.badge-neutral`: Badge gris

### Botones
- `.btn-modern`: Botón base
- `.btn-primary`: Botón primario
- `.btn-secondary`: Botón secundario

### Otros
- `.bg-gradient-primary`: Gradiente del color primario
- `.input-modern`: Inputs con tema
- `.table-modern`: Tablas con tema

## 🔄 Ejemplo de Uso en Componentes

```jsx
function MyView() {
  return (
    <div className="view-container">
      {/* Header */}
      <div className="view-header">
        <div>
          <h1 className="view-title">Mi Vista</h1>
          <p className="view-subtitle">Descripción de la vista</p>
        </div>
        <ThemeSelector />
      </div>
      
      {/* Content */}
      <div className="grid gap-4">
        <div className="card-modern">
          <div className="card-header">
            <h2 className="card-title">Card Title</h2>
            <span className="badge-success">Activo</span>
          </div>
          <p className="text-secondary">Contenido de la card</p>
        </div>
        
        <button className="btn-primary">
          Acción Principal
        </button>
      </div>
    </div>
  );
}
```

## 🆕 Agregar Nuevos Temas

```javascript
// En theme-config.js
export const themes = {
  // ... temas existentes
  
  // Nuevo tema personalizado
  custom: {
    name: 'Mi Tema Personalizado',
    colors: {
      '--bg-dark': '#0A0A0A',
      '--card-dark': '#1A1A1A',
      '--text-main': '#FFFFFF',
      '--text-secondary': '#CCCCCC',
      '--green-light': '#FF6B6B',  // Rojo como acento
      '--green-dark': '#C92A2A',
      // ... más variables
    }
  }
};
```

## 🎪 Eventos del Sistema

El sistema emite eventos personalizados que puedes escuchar:

```javascript
window.addEventListener('themeChanged', (event) => {
  console.log('Tema cambiado a:', event.detail.themeName);
  console.log('Configuración:', event.detail.theme);
});
```

## 💡 Mejores Prácticas

1. **Usa las variables CSS**: Siempre usa `var(--variable)` en lugar de colores hardcodeados
2. **Clases de utilidad**: Prefiere las clases de utilidad sobre estilos inline
3. **Consistencia**: Usa las mismas clases en componentes similares
4. **Prueba todos los temas**: Asegúrate de que tu componente funcione en los 3 temas
5. **Contraste**: Verifica que el contraste sea adecuado en todos los temas

## 🐛 Troubleshooting

**Problema**: Los colores no cambian
**Solución**: Verifica que estés usando variables CSS o clases de utilidad, no colores hardcodeados

**Problema**: El tema no persiste
**Solución**: Asegúrate de que el ThemeProvider esté en el root de tu aplicación

**Problema**: Algunos elementos no se actualizan
**Solución**: Usa las clases de utilidad del tema en lugar de clases de Tailwind fijas