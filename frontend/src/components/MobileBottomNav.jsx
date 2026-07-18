import { useState } from 'react';
import {
  Home,
  ArrowLeftRight,
  Calendar,
  MoreHorizontal,
  X,
  Target,
  TrendingUp,
  Settings,
  Upload,
  LogOut,
  Sun,
  Moon,
  Eye,
  EyeOff,
} from 'lucide-react';

/**
 * MobileBottomNav — nav inferior mobile del tema "Kanagawa". Los 3 ítems
 * principales + "Más" son el mismo esquema de 6 secciones que ModernTopNav
 * (ver design_handoff_rediseno_papel/README.md "Mapa de migración"):
 * Inicio/Movimientos/Vencimientos van fijos abajo, Objetivos/Inversiones/
 * Ajustes viven en la hoja "Más" junto con la acción rápida de
 * Carga Masiva (que no tiene otro entry point en mobile).
 */
const MobileBottomNav = ({
  currentView,
  onNavigate,
  isDarkMode = false,
  onToggleTheme,
  amountsVisible = true,
  onToggleAmountVisibility,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const mainNavItems = [
    { id: 'dashboard', icon: Home, label: 'Inicio' },
    { id: 'transactions-full', icon: ArrowLeftRight, label: 'Movimientos' },
    { id: 'pending-payments-full', icon: Calendar, label: 'Vencimientos' },
    { id: 'menu', icon: MoreHorizontal, label: 'Más' }
  ];

  const menuItems = [
    { id: 'objetivos-full', icon: Target, label: 'Objetivos' },
    { id: 'inversiones', icon: TrendingUp, label: 'Inversiones' },
    { id: 'ajustes', icon: Settings, label: 'Ajustes' },
    { id: 'bulk-upload', icon: Upload, label: 'Carga Masiva' },
  ];

  const handleNavClick = (viewId) => {
    if (viewId === 'menu') {
      setIsMenuOpen(true);
    } else {
      onNavigate(viewId);
      setIsMenuOpen(false);
    }
  };

  const handleMenuItemClick = (viewId) => {
    onNavigate(viewId);
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      // Limpiar el localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      // Recargar la página para ir al login
      window.location.reload();
    }
  };

  return (
    <>
      {/* Overlay del menú deslizable */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-[#545464]/40 z-40"
          onClick={() => setIsMenuOpen(false)}
          style={{ animation: 'fadeIn 0.3s ease-out' }}
        />
      )}

      {/* Menú deslizable desde abajo */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-out ${
          isMenuOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '70vh' }}
      >
          <div className="kanagawa-card kanagawa-bottom-sheet">
          {/* Handle para arrastrar */}
          <div className="flex justify-center py-3">
            <div className="w-12 h-1.5 rounded-full bg-muted" />
          </div>

          {/* Header del menú */}
          <div className="flex items-center justify-between px-6 pb-4">
            <div>
              <h3 className="text-xl font-serif font-semibold text-foreground">Menú</h3>
              <p className="text-sm text-muted-foreground">Gestiona tu aplicación</p>
            </div>
            <button
              type="button"
              onClick={() => setIsMenuOpen(false)}
              className="kanagawa-interactive flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary transition-colors hover:bg-card-hover"
              aria-label="Cerrar menú"
              title="Cerrar menú"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Grid de opciones del menú */}
          <div className="px-4 pb-24 overflow-y-auto" style={{ maxHeight: 'calc(70vh - 120px)' }}>
            <div className="grid grid-cols-2 gap-3">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuItemClick(item.id)}
                    className="kanagawa-interactive rounded-md border border-border bg-secondary p-4 active:scale-95 active:bg-card-hover"
                  >
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-card text-primary">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                    </div>
                  </button>
                );
              })}

              {onToggleTheme && (
                <button
                  onClick={() => { onToggleTheme(); }}
                  className="kanagawa-interactive rounded-md border border-border bg-secondary p-4 active:scale-95 active:bg-card-hover"
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-card text-primary">
                      {isDarkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {isDarkMode ? 'Modo claro' : 'Modo oscuro'}
                    </span>
                  </div>
                </button>
              )}

              {onToggleAmountVisibility && (
                <button
                  type="button"
                  onClick={onToggleAmountVisibility}
                  className="kanagawa-interactive rounded-md border border-border bg-secondary p-4 active:scale-95 active:bg-card-hover"
                  aria-label={amountsVisible ? 'Ocultar montos' : 'Mostrar montos'}
                  title={amountsVisible ? 'Ocultar montos' : 'Mostrar montos'}
                >
                  <div className="flex flex-col items-center space-y-3 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-card text-primary">
                      {amountsVisible ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {amountsVisible ? 'Ocultar montos' : 'Mostrar montos'}
                    </span>
                  </div>
                </button>
              )}
            </div>

            {/* Botón de Cerrar Sesión */}
            <div className="mt-4">
              <button
                onClick={handleLogout}
                className="kanagawa-callout-warning kanagawa-interactive w-full rounded-md border p-4 active:scale-95"
              >
                <div className="flex items-center justify-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-accent">
                    <LogOut className="h-5 w-5 text-destructive" />
                  </div>
                  <span className="text-base font-medium text-destructive">Cerrar Sesión</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

  {/* Bottom Navigation Bar */}
  <nav className="kanagawa-card kanagawa-bottom-bar safe-area-bottom fixed bottom-0 left-0 right-0 z-50">
    <div className="flex items-center justify-between px-6 py-4">
      {mainNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        const isMenuButton = item.id === 'menu';

        return (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={`flex flex-col items-center justify-center gap-1.5 transition-colors duration-150 ${
              isActive || (isMenuButton && isMenuOpen)
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon
              className="h-6 w-6"
              strokeWidth={isActive ? 2.5 : 2}
            />
            <span className="text-[10px] font-medium font-sans">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  </nav>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }

        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .safe-area-bottom {
            padding-bottom: calc(0.5rem + env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </>
  );
};

export default MobileBottomNav;
