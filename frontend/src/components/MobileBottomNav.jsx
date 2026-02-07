import { useState } from 'react';
import { 
  Home,
  CreditCard,
  PieChart,
  MoreHorizontal,
  X,
  DollarSign,
  Landmark,
  Calendar,
  BotMessageSquare,
  Tags,
  LogOut,
  PiggyBank,
  Activity,
  Target,
  Coins,
  Upload
} from 'lucide-react';

const MobileBottomNav = ({ currentView, onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const mainNavItems = [
    { id: 'dashboard', icon: Home, label: 'Inicio' },
    { id: 'transactions', icon: CreditCard, label: 'Transacciones' },
    { id: 'pending-payments', icon: Calendar, label: 'Pagos' },
    { id: 'menu', icon: MoreHorizontal, label: 'Más' }
  ];

  const menuItems = [
    { id: 'bulk-upload', icon: Upload, label: 'Carga Masiva', color: 'purple' },
    { id: 'agent', icon: BotMessageSquare, label: 'Agente IA', color: 'purple' },
    { id: 'ai-usage', icon: Activity, label: 'Consumo API', color: 'orange' },
    { id: 'objetivos-full', icon: Target, label: 'Objetivos', color: 'blue' },
    { id: 'currency-management', icon: Coins, label: 'Monedas', color: 'yellow' },
    { id: 'dollar', icon: DollarSign, label: 'Dólar', color: 'green' },
    { id: 'budgets', icon: PiggyBank, label: 'Presupuestos', color: 'cyan' },
    { id: 'cedears', icon: PieChart, label: 'Bolsa', color: 'indigo' },
    { id: 'resumen-bancario', icon: Landmark, label: 'Resumen General', color: 'teal' },
    { id: 'categories', icon: Tags, label: 'Categorías', color: 'pink' },
    { id: 'payment-methods', icon: CreditCard, label: 'Métodos de Pago', color: 'orange' }
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

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-500/10 text-blue-400',
      purple: 'bg-purple-500/10 text-purple-400',
      orange: 'bg-orange-500/10 text-orange-400',
      green: 'bg-green-500/10 text-green-400',
      pink: 'bg-pink-500/10 text-pink-400',
      cyan: 'bg-cyan-500/10 text-cyan-400',
      indigo: 'bg-indigo-500/10 text-indigo-400',
      teal: 'bg-teal-500/10 text-teal-400',
      yellow: 'bg-yellow-500/10 text-yellow-400'
    };
    return colors[color] || colors.blue;
  };

  return (
    <>
      {/* Overlay del menú deslizable */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
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
        <div className="bg-[#121212] rounded-t-3xl shadow-2xl border-t border-white/10">
          {/* Handle para arrastrar */}
          <div className="flex justify-center py-3">
            <div className="w-12 h-1.5 bg-zinc-800 rounded-full" />
          </div>

          {/* Header del menú */}
          <div className="flex items-center justify-between px-6 pb-4">
            <div>
              <h3 className="text-xl font-bold text-white">Menú</h3>
              <p className="text-sm text-zinc-400">Gestiona tu aplicación</p>
            </div>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="w-10 h-10 rounded-full bg-zinc-800/50 hover:bg-zinc-800 flex items-center justify-center transition-colors"
            >
              <X className="h-5 w-5 text-zinc-400" />
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
                    className="p-4 rounded-2xl bg-[#1a1a1a] border border-white/5 active:scale-95 active:bg-[#222] transition-all hover:border-white/10"
                  >
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${getColorClasses(item.color)}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-medium text-white/90">{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Botón de Cerrar Sesión */}
            <div className="mt-4">
              <button
                onClick={handleLogout}
                className="w-full p-4 rounded-2xl bg-[#1a0f0f] border border-red-500/10 active:scale-95 transition-all hover:bg-red-950/20"
              >
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <LogOut className="h-5 w-5 text-red-400" />
                  </div>
                  <span className="text-base font-medium text-red-400">Cerrar Sesión</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

  {/* Bottom Navigation Bar */}
  <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/10 z-50 safe-area-bottom">
    <div className="flex items-center justify-between px-6 py-4">
      {mainNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        const isMenuButton = item.id === 'menu';

        return (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={`flex flex-col items-center justify-center gap-1.5 transition-colors ${
              isActive || (isMenuButton && isMenuOpen)
                ? 'text-white'
                : 'text-zinc-600 hover:text-zinc-400'
            }`}
          >
            <Icon 
              className={`h-6 w-6 ${isActive ? 'fill-current' : ''}`}
              strokeWidth={isActive ? 0 : 2}
            />
            <span className="text-[10px] font-medium">
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
