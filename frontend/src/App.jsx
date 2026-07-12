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
  <div className="flex h-screen w-full items-center justify-center bg-background">
    <p className="text-[13px] text-muted-foreground">Cargando…</p>
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-[13px] text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Marca */}
          <div className="text-center mb-10 animate-in fade-in zoom-in duration-500">
            <div
              className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl"
              style={{ backgroundColor: '#20242c' }}
            >
              <img src="/favicon.svg" alt="" className="h-[26px] w-[26px]" />
            </div>
            <h1 className="font-serif text-[28px] font-bold text-foreground tracking-tight">
              Finance<span className="text-[#b35a42]">.</span>
            </h1>
            <p className="mt-1.5 text-[13px] text-muted-foreground">
              Tu libreta contable, en un solo lugar.
            </p>
          </div>

          {/* Card login */}
          <div
            className="rounded-xl border border-[#ddd5c2] bg-card p-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: '100ms' }}
          >
            <LoginButton />
          </div>

          {/* Footer */}
          <div className="text-center mt-8 space-y-2 animate-in fade-in duration-500" style={{ animationDelay: '300ms' }}>
            <p className="text-[11px] text-[#8a8677]">
              © 2026 Finance
            </p>
            <div className="flex items-center justify-center gap-1.5 text-[11px]">
              <span className="text-[#8a8677]">hecho por</span>
              <a
                href="https://qeva.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#5d6470] hover:text-foreground transition-colors font-medium inline-flex items-center gap-1 group"
              >
                Qeva AI
                <svg className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
