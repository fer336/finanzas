# 🎨 Modern UI - Stitch Design System

Implementación del nuevo diseño generado con **Stitch AI** para el Sistema de Gastos Inteligente.

## 📋 Estructura

```
modern-ui/
├── common/               # Componentes reutilizables
│   ├── GlassCard.jsx    # Card con glass-morphism
│   ├── ModernButton.jsx # Botón moderno con variantes
│   └── StatCard.jsx     # Tarjeta de estadísticas
├── dashboard/           # Dashboard principal
│   └── ModernDashboard.jsx
├── transactions/        # Vista de transacciones
├── tarjetas/           # Vista de tarjetas de crédito
├── agent/              # Chat con agente IA
├── objetivos/          # Objetivos de ahorro
└── cotizaciones/       # Cotizaciones del dólar
```

## 🎨 Paleta de Colores

### Dark Mode (Principal)
- **Background:** `#0a0a0a` (Negro profundo)
- **Cards:** `#1a1a1a` (Gris oscuro con glass-morphism)
- **Verde Neón:** `#00ff88` (Acentos positivos, ingresos)
- **Cyan:** `#00d9ff` (Acentos secundarios)
- **Rojo/Rosa:** `#ff4d6d` (Gastos, alertas)
- **Texto Primario:** `#ffffff`
- **Texto Secundario:** `#a0a0a0`

### Light Mode
- **Background:** `#f8f9fa` (Blanco suave)
- **Cards:** `#ffffff` (Blanco con glass-morphism)
- **Verde Vibrante:** `#00d98e`
- **Azul Cyan:** `#00b4d8`
- **Rojo:** `#ff4d6d`
- **Texto Primario:** `#1a1a1a`
- **Texto Secundario:** `#6b7280`

## 🧩 Componentes Creados

### 1. GlassCard
Card con efecto glass-morphism.

```jsx
import GlassCard from './common/GlassCard';

<GlassCard 
  hover 
  glow="green" 
  className="p-6"
>
  Contenido
</GlassCard>
```

**Props:**
- `hover` (bool): Efecto hover
- `glow` ('green' | 'cyan' | null): Efecto glow
- `gradient` ('green' | 'cyan' | 'red' | null): Gradiente de fondo

### 2. ModernButton
Botón moderno con variantes y gradientes.

```jsx
import ModernButton from './common/ModernButton';
import { Plus } from 'lucide-react';

<ModernButton 
  variant="primary" 
  size="md"
  icon={Plus}
  fullWidth
>
  Nuevo Gasto
</ModernButton>
```

**Variantes:**
- `primary`: Verde neón con gradiente
- `secondary`: Gris con borde
- `danger`: Rojo con gradiente
- `ghost`: Transparente

### 3. StatCard
Tarjeta de estadística con ícono y tendencia.

```jsx
import StatCard from './common/StatCard';
import { Wallet } from 'lucide-react';

<StatCard
  title="Balance Total"
  value="$1.234.567"
  subtitle="≈ $1.523 USD"
  icon={Wallet}
  color="green"
  trend="up"
  trendValue="+12.5%"
/>
```

**Colors:**
- `green`: Verde (positivo)
- `cyan`: Cyan (neutral positivo)
- `red`: Rojo (negativo)
- `yellow`: Amarillo (advertencia)

### 4. ModernDashboard
Dashboard principal con el nuevo diseño.

```jsx
import ModernDashboard from './dashboard/ModernDashboard';

<ModernDashboard 
  user={user}
  dashboardData={data}
  onNavigate={(view) => setCurrentView(view)}
/>
```

## 🎭 Efectos Glass-Morphism

### CSS Classes disponibles:
- `.glass-card`: Card base con glass-morphism
- `.glass-card-hover`: Efecto hover (translateY + shadow)
- `.glass-card-glow-green`: Glow verde en hover
- `.glass-card-glow-cyan`: Glow cyan en hover

### Gradientes:
- `.gradient-bg-green`: Gradiente verde oscuro
- `.gradient-bg-cyan`: Gradiente cyan a azul
- `.gradient-bg-red`: Gradiente rojo a rosa
- `.text-gradient-green-cyan`: Texto con gradiente verde-cyan

## 🔄 Animaciones

```css
.animate-fade-in         /* Fade in suave */
.animate-slide-in-right  /* Slide desde derecha */
.animate-pulse-glow      /* Pulse con glow verde */
```

## 📦 Implementación Paso a Paso

### 1. Importar el tema en App.jsx o index.css

```css
@import './styles/stitch-theme.css';
```

### 2. Usar el ModernDashboard

```jsx
import ModernDashboard from './components/modern-ui/dashboard/ModernDashboard';

// En tu componente principal:
{currentView === 'dashboard' && (
  <ModernDashboard 
    user={user}
    dashboardData={dashboardData}
    onNavigate={setCurrentView}
  />
)}
```

### 3. Migrar componentes existentes gradualmente

Puedes crear versiones "modern" de tus componentes actuales:
- `ModernTransactionsView` (basado en `TransactionsFullView`)
- `ModernTarjetasView` (basado en `TarjetasFullView`)
- `ModernAgentChat` (basado en `FinancialAgentChat`)

## 🎯 Próximos Pasos

1. [ ] Integrar el tema CSS en `index.css`
2. [ ] Crear componente `ModernSidebar`
3. [ ] Implementar `ModernTransactionsView`
4. [ ] Implementar `ModernTarjetasView`
5. [ ] Implementar `ModernAgentChat`
6. [ ] Implementar `ModernObjetivosView`
7. [ ] Implementar `ModernCotizacionesView`
8. [ ] Agregar toggle para cambiar entre diseño actual y moderno
9. [ ] Conectar con APIs reales (reemplazar datos mock)
10. [ ] Tests E2E con Playwright

## 📸 Screenshots de Stitch

Las pantallas generadas en Stitch están disponibles en el proyecto:
- **ID del proyecto:** `846968943535333149`
- **Pantallas generadas:** 9 (Dashboard Light/Dark, Transacciones, Tarjetas, IA, Objetivos, Cotizaciones)

## 🛠️ Variables CSS Personalizadas

Todas las variables están en `stitch-theme.css` y usan el sistema de CSS custom properties:

```css
var(--bg-primary)        /* Background principal */
var(--bg-card)           /* Background de cards */
var(--text-primary)      /* Texto principal */
var(--accent-green)      /* Verde neón/vibrante */
var(--accent-cyan)       /* Cyan */
var(--shadow-glow-green) /* Sombra con glow verde */
```

## 🔗 Integración con el sistema actual

El diseño está pensado para **coexistir** con el diseño actual. Podés:

1. **Activar el nuevo diseño** en la configuración del usuario
2. **Migrar gradualmente** pantalla por pantalla
3. **Usar componentes mixtos** (sidebar actual + dashboard nuevo)

---

**Creado con:** Stitch AI Design System  
**Fecha:** 18 de Febrero 2026  
**Autor:** Fernando
