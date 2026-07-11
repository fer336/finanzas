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
} from 'lucide-react';

/**
 * MobileBottomNav — nav inferior mobile del tema "Papel". Los 3 ítems
 * principales + "Más" son el mismo esquema de 6 secciones que ModernTopNav
 * (ver design_handoff_rediseno_papel/README.md "Mapa de migración"):
 * Inicio/Movimientos/Vencimientos van fijos abajo, Objetivos/Inversiones/
 * Ajustes viven en la hoja "Más" junto con la acción rápida de
 * Carga Masiva (que no tiene otro entry point en mobile).
 */
const MobileBottomNav = ({ currentView, onNavigate }) => {
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
          className="fixed inset-0 bg-[#20242c]/40 z-40"
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
        <div className="bg-card rounded-t-lg border-t border-[#ddd5c2]">
          {/* Handle para arrastrar */}
          <div className="flex justify-center py-3">
            <div className="w-12 h-1.5 bg-[#e7e0cf] rounded-full" />
          </div>

          {/* Header del menú */}
          <div className="flex items-center justify-between px-6 pb-4">
            <div>
              <h3 className="text-xl font-serif font-semibold text-foreground">Menú</h3>
              <p className="text-sm text-[#8a8677]">Gestiona tu aplicación</p>
            </div>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="w-10 h-10 rounded-full bg-white border border-[#ddd5c2] hover:bg-[#f0ead9] flex items-center justify-center transition-colors"
            >
              <X className="h-5 w-5 text-[#5d6470]" />
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
                    className="p-4 rounded-md bg-white border border-[#ddd5c2] active:scale-95 active:bg-[#f0ead9] transition-all hover:border-[#20242c]/20"
                  >
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="w-12 h-12 rounded-md flex items-center justify-center bg-[#faf7ef] border border-[#ddd5c2] text-[#5a7d52]">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Botón de Cerrar Sesión */}
            <div className="mt-4">
              <button
                onClick={handleLogout}
                className="w-full p-4 rounded-md bg-white border border-[#e0c98a] active:scale-95 transition-all hover:bg-[#fdf6e3]"
              >
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-10 h-10 rounded-md bg-[#fdf6e3] border border-[#e0c98a] flex items-center justify-center">
                    <LogOut className="h-5 w-5 text-[#a04a34]" />
                  </div>
                  <span className="text-base font-medium text-[#a04a34]">Cerrar Sesión</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

  {/* Bottom Navigation Bar */}
  <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-[#ddd5c2] z-50 safe-area-bottom">
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
                ? 'text-[#20242c]'
                : 'text-[#8a8677] hover:text-[#5d6470]'
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
