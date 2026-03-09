import { Suspense, lazy, useState, useEffect } from 'react';
import { useAuth } from './components/auth/auth-provider';
import { LoginButton } from './components/auth/login-button';
import { ConnectionStatus } from './components/connection-status';

// Lazy loading del componente moderno principal
const ModernMissionControl = lazy(() => import('./components/modern-ui/ModernMissionControl'));

// Vistas externas que viven fuera del ModernMissionControl
const ConverterView = lazy(() => import('./components/converter-view').then(m => ({ default: m.ConverterView })));
const MarketView = lazy(() => import('./components/market-view').then(m => ({ default: m.MarketView })));
const PaidInvoicesView = lazy(() => import('./components/paid-invoices-view'));
const CuotaAlimentariaView = lazy(() => import('./components/cuota-alimentaria-view').then(m => ({ default: m.CuotaAlimentariaView })));

const LoadingSpinner = () => (
  <div className="flex h-screen w-full items-center justify-center bg-black">
    <p className="text-white/50 text-sm">Cargando...</p>
  </div>
);

function App() {
  const { isAuthenticated, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  // Escuchar eventos de navegación personalizados (ej. DollarQuoteWidget)
  useEffect(() => {
    const handleNavigate = (event) => {
      if (event.detail?.view) {
        setCurrentView(event.detail.view);
      }
    };
    window.addEventListener('navigate', handleNavigate);
    return () => window.removeEventListener('navigate', handleNavigate);
  }, []);

  const renderView = () => {
    // Vistas externas al ModernMissionControl
    switch (currentView) {
      case 'converter':
        return <ConverterView />;
      case 'market':
        return <MarketView />;
      case 'paid-invoices':
        return <PaidInvoicesView />;
      case 'cuota-alimentaria':
        return <CuotaAlimentariaView />;
      default:
        // Todo lo demás lo maneja ModernMissionControl con su sidebar
        return <ModernMissionControl onNavigate={setCurrentView} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Pulpo con animación */}
          <div className="text-center mb-12 animate-in fade-in zoom-in duration-500">
            <div className="text-7xl mb-4 animate-bounce" style={{ animationDuration: '3s' }}>
              🐙
            </div>
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
              Sistema de Gastos
            </h1>
            <p className="text-white/40 text-sm">
              Gestiona tus finanzas de forma inteligente
            </p>
          </div>

          {/* Card login */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '100ms' }}>
            <LoginButton />
          </div>

          {/* Footer */}
          <div className="text-center mt-8 space-y-2 animate-in fade-in duration-500" style={{ animationDelay: '300ms' }}>
            <p className="text-white/20 text-xs">
              © 2026 Sistema de Gastos
            </p>
            <div className="flex items-center justify-center gap-1.5 text-xs">
              <span className="text-white/20">hecho por</span>
              <a
                href="https://qeva.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors font-medium inline-flex items-center gap-1 group"
              >
                Qeva AI
                <svg className="w-3 h-3 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Suspense fallback={<LoadingSpinner />}>
        {renderView()}
      </Suspense>
      <ConnectionStatus />
    </>
  );
}

export default App;
