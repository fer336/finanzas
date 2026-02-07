# Frontend UI - AI Agent Ruleset

> **Sistema Financiero Personal** - Frontend con React 19, Vite, Tailwind CSS y shadcn/ui

---

## 📋 Skills Reference

For detailed patterns, use these skills:

| Skill | Descripción | Ubicación |
|-------|-------------|-----------|
| [`react-modern-ui`](../../skills/react-modern-ui.md) | Glass-morphism, animaciones, responsive design | ✅ Obligatorio para UI |
| [`modal-system`](../../skills/modal-system.md) | Z-index jerárquico, scroll lock, backdrop blur | ✅ Obligatorio para modales |
| [`recharts-data-viz`](../../skills/recharts-data-viz.md) | Gráficos interactivos, temas consistentes | ✅ Para visualizaciones |
| [`context-api-patterns`](../../skills/context-api-patterns.md) | Estado global, providers, custom hooks | ✅ Para estado compartido |

---

## 🎯 Tabla de Auto-Invocación

Cuando realices estas acciones, **SIEMPRE invoca la skill correspondiente PRIMERO**:

| Acción | Skill a Invocar | Prioridad |
|--------|----------------|-----------|
| Crear nuevo componente UI | `react-modern-ui` | 🔴 CRÍTICO |
| Crear/modificar cualquier modal | `modal-system` | 🔴 CRÍTICO |
| Agregar gráfico al dashboard | `recharts-data-viz` | 🟠 ALTO |
| Crear estado global nuevo | `context-api-patterns` | 🟠 ALTO |
| Modificar widget del dashboard | `react-modern-ui` | 🟠 ALTO |
| Crear nuevo widget | `react-modern-ui` + `recharts-data-viz` | 🔴 CRÍTICO |
| Agregar nueva vista full-screen | `react-modern-ui` | 🟠 ALTO |
| Modificar estilos de cards | `react-modern-ui` | 🟡 MEDIO |
| Crear formulario de transacción | `react-modern-ui` | 🟠 ALTO |
| Fix de posicionamiento de modales | `modal-system` | 🔴 CRÍTICO |

---

## 🚨 REGLAS CRÍTICAS - NO NEGOCIABLES

### React 19

```javascript
// ✅ CORRECTO
import { useState, useEffect } from 'react';

// ❌ INCORRECTO
import React, { useState } from 'react';
import * as React from 'react';
```

**Razón**: React 19 no requiere importar React para JSX. El compilador lo maneja automáticamente.

---

### Optimizaciones del Compilador

```javascript
// ❌ NUNCA uses useMemo o useCallback innecesariamente
const memoizedValue = useMemo(() => expensiveCalculation(), []);

// ✅ El compilador de React 19 lo optimiza automáticamente
const value = expensiveCalculation();
```

**Razón**: React 19 tiene un compilador que optimiza automáticamente. Solo usa `useMemo`/`useCallback` si hay un problema de performance medido.

---

### Glass-Morphism (Estilo del Proyecto)

```javascript
// ✅ SIEMPRE usa este patrón para cards
<div className="bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 rounded-xl p-6">
  {/* content */}
</div>

// ❌ NUNCA uses fondos sólidos sin blur
<div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
  {/* content */}
</div>
```

---

### Z-Index Hierarchy (ABSOLUTO)

```
z-[9999] → Modales y Dialogs (MÁXIMA PRIORIDAD)
z-50     → Mobile Navigation Menu
z-40     → Dropdowns y Tooltips
z-10     → Cards elevados
z-0      → Contenido normal
```

**NUNCA uses `z-50` o menos para modales. SIEMPRE `z-[9999]`.**

---

### Animaciones Consistentes

```javascript
// ✅ Patrón estándar de animación de entrada
<div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
  {/* content */}
</div>

// ✅ Hover suave
<button className="transition-all duration-300 hover:scale-105 active:scale-95">
  Click me
</button>
```

---

### Colores y Jerarquía de Texto

```javascript
// ✅ Jerarquía visual correcta
<h1 className="text-2xl font-bold text-white">Título Principal</h1>
<p className="text-white/70">Texto secundario</p>
<span className="text-white/50">Texto terciario</span>

// Colores de estado
<span className="text-green-400">Ingreso</span>  // Verde para ingresos
<span className="text-red-400">Gasto</span>      // Rojo para gastos
<span className="text-blue-400">Objetivo</span>  // Azul para objetivos
```

---

## 🧩 ÁRBOLES DE DECISIÓN

### ¿Dónde colocar el componente?

```
¿Es un componente de shadcn/ui?
  ├─ Sí → components/ui/
  └─ No → ¿Es específico de Mission Control?
          ├─ Sí → ¿Es un widget?
          │       ├─ Sí → components/mission-control/new-design/
          │       └─ No → ¿Es un modal?
          │               ├─ Sí → components/mission-control/modals/
          │               └─ No → components/mission-control/
          └─ No → ¿Se usa en múltiples lugares?
                  ├─ Sí → components/
                  └─ No → Dejar en feature directory
```

### ¿Qué tipo de modal necesito?

```
¿Necesita formulario complejo?
  ├─ Sí → Crear modal custom con backdrop blur
  └─ No → ¿Es confirmación simple?
          ├─ Sí → Usar AlertDialog de shadcn/ui
          └─ No → ¿Necesita scroll interno?
                  ├─ Sí → Crear modal con overflow-y-auto
                  └─ No → Usar Dialog de shadcn/ui
```

### ¿Necesito estado global?

```
¿Se usa en 3+ componentes no relacionados?
  ├─ Sí → Crear Context Provider
  └─ No → ¿Necesita persistencia?
          ├─ Sí → localStorage + Context
          └─ No → Mantener state local con useState
```

---

## 📐 PATRONES OBLIGATORIOS

### Widget del Dashboard

```javascript
import { TrendingUp } from 'lucide-react';

export const MyWidget = ({ data, onViewAll }) => {
  return (
    <div className="glass-panel h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Título</h3>
        </div>
        {onViewAll && (
          <button 
            onClick={onViewAll}
            className="text-sm text-white/50 hover:text-white transition-colors"
          >
            Ver todo →
          </button>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Widget content */}
      </div>
    </div>
  );
};
```

### Modal con Scroll Lock

```javascript
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export const MyModal = ({ isOpen, onClose }) => {
  // 🔒 Block body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        className="bg-[#1a1a1a] border border-white/10 rounded-xl max-w-2xl w-full shadow-xl m-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Título</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Modal content */}
        </div>
      </div>
    </div>
  );
};
```

### Gráfico con Recharts

```javascript
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const MyChart = ({ data }) => {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="date" 
            stroke="rgba(255,255,255,0.5)"
            fontSize={12}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.5)"
            fontSize={12}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'rgba(0,0,0,0.9)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px'
            }}
            labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
```

### Context Provider

```javascript
import { createContext, useContext, useState } from 'react';

// 1. Create context
const MyContext = createContext(undefined);

// 2. Create provider
export const MyProvider = ({ children }) => {
  const [value, setValue] = useState(initialValue);
  
  const contextValue = {
    value,
    setValue,
    // ... other methods
  };
  
  return (
    <MyContext.Provider value={contextValue}>
      {children}
    </MyContext.Provider>
  );
};

// 3. Create custom hook
export const useMyContext = () => {
  const context = useContext(MyContext);
  if (!context) {
    throw new Error('useMyContext must be used within MyProvider');
  }
  return context;
};
```

### Formateo de Montos (K notation)

```javascript
// ✅ Para montos grandes (> 1000)
export const formatAmount = (amount) => {
  if (Math.abs(amount) >= 1000) {
    return (amount / 1000).toFixed(1) + 'K';
  }
  return amount.toFixed(2);
};

// Uso
<span className="text-2xl font-bold">
  ${formatAmount(25000)} {/* Output: $25.0K */}
</span>
```

---

## 🗂️ ESTRUCTURA DEL PROYECTO

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/                          # shadcn/ui components (Dialog, Button, etc)
│   │   ├── mission-control/
│   │   │   ├── new-design/              # ✅ Widgets modernos (USAR AQUÍ)
│   │   │   │   ├── StatsCardsNew.jsx
│   │   │   │   ├── RecentTransactionsSection.jsx
│   │   │   │   ├── CategoriesWidget.jsx
│   │   │   │   ├── TransactionsFullView.jsx
│   │   │   │   └── ObjetivosFullView.jsx
│   │   │   ├── modals/                  # Modales del sistema
│   │   │   │   ├── CategoryModal.jsx
│   │   │   │   ├── PaymentMethodModal.jsx
│   │   │   │   └── TransactionModal.jsx
│   │   │   ├── AIUsageWidget.jsx
│   │   │   ├── ObjetivosWidget.jsx
│   │   │   └── DeudaTarjetasWidget.jsx
│   │   ├── ModernTransactionForm.jsx     # Formularios principales
│   │   ├── MissionControlDashboard.jsx   # Dashboard principal
│   │   └── MobileBottomNav.jsx           # Navegación mobile
│   ├── contexts/
│   │   └── AmountVisibilityContext.jsx   # Estado global (ocultar/mostrar montos)
│   ├── hooks/
│   │   └── use-mobile.js                 # Custom hooks
│   ├── services/
│   │   ├── api.js                        # API client principal
│   │   ├── config-service.js             # Configuración
│   │   └── yfinanceService.js            # Cotizaciones
│   ├── utils/
│   │   └── imageCompression.js           # Utilidades de compresión
│   ├── App.jsx                           # Entry point
│   └── main.jsx                          # Vite entry
├── public/                               # Assets estáticos
├── .env.example                          # Template de variables de entorno
├── vite.config.js                        # Configuración de Vite
├── tailwind.config.js                    # Configuración de Tailwind
└── package.json
```

---

## 🛠️ TECH STACK

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **React** | 19.x | Framework UI |
| **Vite** | 5.x | Build tool |
| **Tailwind CSS** | 3.x | Styling |
| **shadcn/ui** | Latest | Sistema de componentes |
| **Recharts** | 2.x | Visualización de datos |
| **Lucide React** | Latest | Iconos |
| **React Router DOM** | 6.x | Routing (si aplica) |

---

## 📦 COMANDOS

```bash
# Desarrollo
cd frontend
npm install
npm run dev              # Puerto 5173

# Build
npm run build            # Build para producción
npm run preview          # Preview del build

# Linting (si existe)
npm run lint             # ESLint
npm run lint:fix         # Fix automático

# Docker
docker build -t frontend .
docker run -p 80:80 frontend
```

---

## ✅ CHECKLIST PRE-COMMIT

Antes de hacer commit, verificar:

### UI/UX
- [ ] El componente se ve bien en mobile (< 768px)
- [ ] El componente se ve bien en tablet (768px - 1024px)
- [ ] El componente se ve bien en desktop (> 1024px)
- [ ] Los modales tienen `z-[9999]` y scroll lock
- [ ] Los colores siguen la paleta del proyecto
- [ ] Las animaciones son suaves (duration-300 o duration-500)
- [ ] Los hover states están implementados
- [ ] Los active states están implementados (active:scale-95)

### Funcionalidad
- [ ] Los estados de carga están manejados (loading spinner)
- [ ] Los estados de error están manejados (mensajes claros)
- [ ] Los estados vacíos están manejados ("No hay datos")
- [ ] Las validaciones de formularios funcionan
- [ ] Las llamadas API tienen manejo de errores
- [ ] Los console.log de debug fueron removidos (o comentados)

### Accesibilidad
- [ ] Los botones tienen labels descriptivos
- [ ] Los inputs tienen labels/placeholders
- [ ] Los iconos decorativos tienen aria-hidden="true"
- [ ] Los elementos interactivos tienen hover/focus visible

### Performance
- [ ] Las imágenes están comprimidas (< 2MB)
- [ ] No hay re-renders innecesarios (verificar con React DevTools)
- [ ] Los componentes grandes usan `React.lazy()` si aplica
- [ ] Los fetch se hacen con cleanup apropiado (useEffect return)

### Código
- [ ] No hay credenciales hardcodeadas
- [ ] Las variables de entorno están en `.env` (no en código)
- [ ] Los estilos inline solo se usan para valores dinámicos
- [ ] Las clases de Tailwind están ordenadas (layout → spacing → colors)
- [ ] Los comentarios explican el "por qué", no el "qué"

---

## 🔍 ANTI-PATRONES A EVITAR

### ❌ Modal sin scroll lock

```javascript
// ❌ MAL - El fondo puede hacer scroll
{modalOpen && (
  <div className="fixed inset-0 z-50">
    <div>{/* content */}</div>
  </div>
)}
```

```javascript
// ✅ BIEN - Scroll bloqueado
useEffect(() => {
  if (modalOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
  return () => { document.body.style.overflow = ''; };
}, [modalOpen]);
```

---

### ❌ Cards sin glass-morphism

```javascript
// ❌ MAL - Fondo sólido, sin blur
<div className="bg-gray-800 border border-gray-700 p-4">

// ✅ BIEN - Glass-morphism estándar
<div className="bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 p-4">
```

---

### ❌ Z-index bajo para modales

```javascript
// ❌ MAL - Se superpone con el menu
<div className="fixed inset-0 z-50">

// ✅ BIEN - Siempre por encima
<div className="fixed inset-0 z-[9999]">
```

---

### ❌ Colores hardcodeados en lugar de clases

```javascript
// ❌ MAL - Color hardcodeado
<div style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>

// ✅ BIEN - Clases de Tailwind
<div className="bg-[#1a1a1a] text-white">
```

---

### ❌ Números sin formatear

```javascript
// ❌ MAL - 25000.50 (difícil de leer)
<span>${transaction.monto}</span>

// ✅ BIEN - $25.0K o $25,000.50
<span>{formatAmount(transaction.monto)}</span>
```

---

## 🎨 ESTILOS GLOBALES (Referencia Rápida)

### Glass Panel (Usar en todos los widgets)
```css
.glass-panel {
  @apply bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 rounded-xl p-6;
}
```

### Botón Primario
```javascript
<button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
  Acción
</button>
```

### Botón Secundario
```javascript
<button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg transition-colors">
  Cancelar
</button>
```

### Input
```javascript
<input 
  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500 transition-colors"
  placeholder="Ingresa un valor"
/>
```

---

## 📚 RECURSOS ADICIONALES

- [React 19 Docs](https://react.dev/blog/2024/04/25/react-19)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Recharts Examples](https://recharts.org/en-US/examples)
- [Lucide Icons](https://lucide.dev/)

---

## 🤝 FLUJO DE TRABAJO CON LA IA

### Ejemplo de Prompt Optimizado

```
"Quiero agregar un widget de 'Proyección de Gastos' al dashboard que:
- Muestre los próximos 3 meses
- Use un gráfico de líneas (Recharts)
- Tenga estilo glass-panel consistente con otros widgets
- Sea responsive (col-span-2 en desktop, full en mobile)
- Incluya botón 'Ver todo' que abra una vista completa

Por favor, consulta las Skills necesarias y genera el código."
```

**La IA deberá:**
1. Leer `react-modern-ui.md` para estilos
2. Leer `recharts-data-viz.md` para el gráfico
3. Generar el widget siguiendo los patrones
4. Generar la vista completa con el modal system
5. Verificar checklist pre-commit

---

**Última Actualización**: 2026-01-24  
**Versión**: v1.0  
**Autor**: Sistema Financiero Personal Team

