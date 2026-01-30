# modal-system

## 📋 Propósito
Establecer un sistema jerárquico de z-index para asegurar que los modales siempre se muestren por encima del contenido principal y el menú de navegación, evitando superposiciones no deseadas.

## 🎯 Cuándo Usar
- Al crear un nuevo modal, dialog, drawer o overlay
- Al modificar componentes de UI base (shadcn/ui)
- Al detectar que un modal queda detrás del menú móvil
- Al implementar componentes flotantes (tooltips, popovers)

## 📐 Patrón de Diseño
**Layered UI Pattern** con z-index jerárquico

## 💻 Implementación

### Jerarquía de Z-Index

```
┌─────────────────────────────────────┐
│ z-[9999]: Modal Content             │ ← Contenido del modal
├─────────────────────────────────────┤
│ z-[9998]: Modal Backdrop/Overlay    │ ← Fondo oscuro del modal
├─────────────────────────────────────┤
│ z-50: Menu Mobile Panel             │ ← Panel del menú móvil
├─────────────────────────────────────┤
│ z-40: Menu Mobile Overlay           │ ← Overlay del menú móvil
├─────────────────────────────────────┤
│ z-20: Sticky Headers                │ ← Headers fijos al scrollear
├─────────────────────────────────────┤
│ z-10: Floating Buttons/Tooltips     │ ← Botones flotantes, tooltips
├─────────────────────────────────────┤
│ z-0 o sin z-index: Contenido normal │ ← Dashboard, cards, etc.
└─────────────────────────────────────┘
```

### 1. Dialog/Modal Base (shadcn/ui)

```jsx
// frontend/src/components/ui/dialog.jsx
import * as DialogPrimitive from "@radix-ui/react-dialog"

const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[9998] bg-black/80",  // ✅ z-[9998] para overlay
      "data-[state=open]:animate-in",
      "data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0",
      "data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))

const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-[9999]",  // ✅ z-[9999] para contenido
        "grid w-full max-w-2xl max-h-[90vh]",
        "translate-x-[-50%] translate-y-[-50%]",
        "gap-4 border bg-background p-6",
        "shadow-lg duration-200 overflow-y-auto modal-scroll",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 z-10 ...">
        <X className="h-4 w-4" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
```

### 2. Alert Dialog Base

```jsx
// frontend/src/components/ui/alert-dialog.jsx
const AlertDialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-[9998] bg-black/80",  // ✅ Mismo z-index que dialog
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      className
    )}
    {...props}
    ref={ref}
  />
))

const AlertDialogContent = React.forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-[9999]",  // ✅ Mismo z-index que dialog
        "grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%]",
        "gap-4 border bg-background p-6 shadow-lg duration-200",
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
))
```

### 3. Modal Custom (sin shadcn/ui)

```jsx
// Ej: ModernPaymentForm.jsx, ModernConfirmDialog.jsx
const CustomModal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            {/* ✅ z-[9999] para todo el modal */}
            <div className="bg-[#1a1a1a] rounded-2xl max-w-2xl w-full shadow-2xl border border-white/10">
                {children}
            </div>
        </div>
    );
};
```

### 4. Drawer (Panel desde abajo)

```jsx
// frontend/src/components/ui/drawer.jsx
const DrawerOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-[9998] bg-black/80", className)}
    {...props}
  />
))

const DrawerContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-[9999]",  // ✅ z-[9999]
        "mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",
        className
      )}
      {...props}
    >
      {children}
    </DrawerPrimitive.Content>
  </DrawerPortal>
))
```

### 5. Sheet (Panel lateral)

```jsx
// frontend/src/components/ui/sheet.jsx
const SheetOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-[9998] bg-black/80",  // ✅ Overlay
      "data-[state=open]:animate-in",
      className
    )}
    {...props}
    ref={ref}
  />
))

const sheetVariants = cva(
  "fixed z-[9999] gap-4 bg-background p-6 shadow-lg transition ease-in-out",  // ✅ Contenido
  {
    variants: {
      side: {
        top: "inset-x-0 top-0",
        bottom: "inset-x-0 bottom-0",
        left: "inset-y-0 left-0 h-full w-3/4",
        right: "inset-y-0 right-0 h-full w-3/4"
      }
    }
  }
)
```

## ✅ Checklist Pre-Commit

- [ ] ¿El overlay tiene `z-[9998]`?
- [ ] ¿El contenido del modal tiene `z-[9999]`?
- [ ] ¿Usé `fixed` positioning para modales?
- [ ] ¿Agregué `backdrop-blur-sm` al overlay?
- [ ] ¿El modal cubre toda la pantalla con `inset-0`?
- [ ] ¿Implementé animación de entrada/salida?
- [ ] ¿El botón de cerrar está dentro del modal con `z-10` relativo?
- [ ] ¿Probé abrir el modal con el menú móvil abierto?

## ❌ Anti-Patrones

- ❌ **NO usar z-index < 9998 para modales**  
  ✅ **SÍ usar** `z-[9998]` (overlay) y `z-[9999]` (content)

- ❌ **NO usar `z-50` para modales** (conflicto con menú móvil)  
  ✅ **SÍ reservar** `z-50` para menú principal

- ❌ **NO olvidar el backdrop/overlay oscuro**  
  ✅ **SÍ agregar** `bg-black/80 backdrop-blur-sm`

- ❌ **NO usar `absolute` positioning para modales**  
  ✅ **SÍ usar** `fixed` para que cubra toda la ventana

- ❌ **NO poner estilos inline de z-index**  
  ```jsx
  <div style={{zIndex: 999}}> // MAL
  ```
  ✅ **SÍ usar clases de Tailwind** `z-[9999]`

## 🐛 Troubleshooting

### Modal detrás del menú móvil
```jsx
// ANTES (MAL)
<div className="fixed inset-0 z-50 ...">

// DESPUÉS (BIEN)
<div className="fixed inset-0 z-[9999] ...">
```

### Modal no cubre toda la pantalla
```jsx
// ANTES (MAL)
<div className="absolute top-0 left-0 w-full h-full ...">

// DESPUÉS (BIEN)
<div className="fixed inset-0 ...">
```

### Contenido del modal no scrolleable
```jsx
// BIEN
<div className="max-h-[90vh] overflow-y-auto modal-scroll">
    {/* Contenido largo */}
</div>

// Agregar estilo para scrollbar
<style>
.modal-scroll::-webkit-scrollbar {
    width: 6px;
}
.modal-scroll::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.2);
    border-radius: 3px;
}
</style>
```

## 📊 Testing

```jsx
// Test manual para verificar z-index
describe('Modal System', () => {
  test('Modal should be above mobile menu', () => {
    // 1. Abrir menú móvil (z-50)
    // 2. Abrir modal (z-9999)
    // 3. Verificar que modal está visible y menu detrás
    
    const modal = screen.getByRole('dialog');
    const computedStyle = window.getComputedStyle(modal);
    
    expect(parseInt(computedStyle.zIndex)).toBeGreaterThan(50);
  });
});
```

## 🔗 Recursos

- [Radix UI Dialog](https://www.radix-ui.com/docs/primitives/components/dialog)
- [Tailwind Z-Index](https://tailwindcss.com/docs/z-index)
- [CSS Positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/position)

