# react-modern-ui

## 📋 Propósito
Define el estilo visual y patrones de componentes para el frontend React del sistema financiero, asegurando consistencia en diseño glass-morphism, animaciones, y responsividad.

## 🎯 Cuándo Usar
- Al crear cualquier nuevo componente visual (widgets, cards, modales)
- Al modificar estilos de componentes existentes
- Al implementar layouts responsive para mobile/desktop
- Al añadir animaciones y transiciones

## 📐 Patrón de Diseño
**Component Library Pattern** + **Utility-First CSS** (Tailwind)

## 💻 Implementación

### Estructura Base de un Widget

```jsx
import React from 'react';
import { IconName } from 'lucide-react';

export const MyWidget = ({ data, onViewDetails }) => {
    return (
        <div className="glass-panel flex flex-col h-full">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-white/5">
                <h3 className="text-base font-bold leading-tight flex items-center gap-2 text-white">
                    <IconName size={16} className="text-blue-500" />
                    Título del Widget
                </h3>
                <button
                    onClick={onViewDetails}
                    className="text-blue-400 text-xs font-medium hover:text-blue-300 transition-colors cursor-pointer"
                >
                    Ver todo
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-4">
                {/* Contenido aquí */}
            </div>
        </div>
    );
};
```

### Glass Panel (Estilo Base de Cards)

```css
/* Clase estándar para todos los widgets/cards */
.glass-panel {
    background: rgba(10, 10, 10, 0.6);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 1rem;
}
```

**Aplicación en Tailwind**:
```jsx
<div className="bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 rounded-2xl">
```

### Jerarquía de Colores de Texto

```jsx
// Título principal
<h1 className="text-white">

// Texto secundario
<p className="text-white/70">

// Texto terciario / metadatos
<span className="text-white/50">

// Texto deshabilitado / placeholder
<span className="text-white/30">

// Acentos
<span className="text-blue-400">  // Links, botones primarios
<span className="text-green-400"> // Ingresos, positivos
<span className="text-red-400">   // Gastos, negativos, eliminar
<span className="text-yellow-400"> // Advertencias
```

### Animaciones Estándar

```jsx
// Fade in + slide up al montar
<div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

// Scale en hover (botones, cards clicables)
<button className="transition-transform active:scale-95 hover:scale-105">

// Transición de colores
<div className="transition-colors hover:bg-white/10">

// Skeleton loading
<div className="animate-pulse bg-white/10 h-4 rounded">
```

### Grid Responsive (Dashboard)

```jsx
// 1 columna mobile, 2-4 desktop
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
    <div className="md:col-span-2">Widget grande</div>
    <div>Widget normal</div>
</div>

// Prioridad de renderizado (optimización)
{renderPriority >= 1 && (
    <div>Sección crítica</div>
)}
{renderPriority >= 2 && (
    <div>Sección secundaria</div>
)}
```

### Botones Estándar

```jsx
// Primario
<button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors">
    Guardar
</button>

// Secundario
<button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors">
    Cancelar
</button>

// Destructivo
<button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors">
    Eliminar
</button>

// Ghost
<button className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors">
    <Icon size={20} />
</button>
```

### Inputs y Forms

```jsx
<input
    type="text"
    className="w-full px-4 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
    placeholder="Ingrese valor..."
/>

// Select/Combobox (shadcn/ui)
<Select>
    <SelectTrigger className="bg-[#1a1a1a] border-white/10 text-white">
        <SelectValue />
    </SelectTrigger>
    <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
        <SelectItem value="1">Opción 1</SelectItem>
    </SelectContent>
</Select>
```

### Mobile Bottom Navigation

```jsx
<nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/10 z-50 safe-area-bottom">
    <div className="flex items-center justify-between px-6 py-4">
        {items.map(item => (
            <button className="flex flex-col items-center gap-1.5 text-zinc-600 hover:text-white transition-colors">
                <Icon className="h-6 w-6" />
                <span className="text-[10px] font-medium">{item.label}</span>
            </button>
        ))}
    </div>
</nav>
```

## ✅ Checklist Pre-Commit

- [ ] ¿Usé `glass-panel` para cards?
- [ ] ¿Apliqué jerarquía de colores correcta?
- [ ] ¿Agregué animaciones `animate-in`?
- [ ] ¿Es responsive con `grid-cols-1 md:grid-cols-X`?
- [ ] ¿Los botones tienen estados hover/active?
- [ ] ¿Usé iconos de `lucide-react`?
- [ ] ¿Los z-index respetan la jerarquía? (modales > 9998)
- [ ] ¿Probé en mobile (< 768px)?

## ❌ Anti-Patrones

- ❌ **NO usar colores hardcodeados RGB**: `style={{color: 'rgb(100,100,100)'}}`  
  ✅ **SÍ usar Tailwind**: `text-white/70`

- ❌ **NO crear estilos inline complejos**  
  ✅ **SÍ usar clases de Tailwind** o CSS modules

- ❌ **NO usar `z-index: 1000` arbitrarios**  
  ✅ **SÍ seguir jerarquía**: Menu (40/50), Modales (9998/9999)

- ❌ **NO asumir desktop-first**  
  ✅ **SÍ pensar mobile-first**: `className="col-span-1 md:col-span-2"`

- ❌ **NO usar `div` genéricos sin semantic HTML**  
  ✅ **SÍ usar** `<nav>`, `<section>`, `<article>`, etc.

## 🎨 Paleta de Colores del Sistema

```js
// Backgrounds
bg-black              // #000000 - Fondo principal
bg-[#0a0a0a]          // #0a0a0a - Cards/Panels
bg-[#1a1a1a]          // #1a1a1a - Inputs, modales

// Borders
border-white/5        // rgba(255,255,255,0.05)
border-white/10       // rgba(255,255,255,0.10)

// Acentos
blue-500              // #3b82f6 - Primario
green-400             // #4ade80 - Ingresos
red-400               // #f87171 - Gastos
cyan-500              // #06b6d4 - Links secundarios
purple-500            // #a855f7 - IA/Agente
```

## 📱 Breakpoints Tailwind

```
sm: 640px   // Tablets pequeñas
md: 768px   // Tablets
lg: 1024px  // Desktop
xl: 1280px  // Desktop grande
2xl: 1536px // Pantallas extra grandes
```

## 🔗 Recursos

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [React 19 Docs](https://react.dev/)

