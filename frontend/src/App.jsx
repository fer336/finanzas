import React, { Suspense, lazy } from 'react';
import { useAuth } from './components/auth/auth-provider';
import { LoginButton } from './components/auth/login-button';
import MobileBottomNav from './components/MobileBottomNav';
import { Menu } from 'lucide-react';
import { ConnectionStatus } from './components/connection-status';

// Lazy loading de componentes pesados
const MissionControlDashboard = lazy(() => import('./components/MissionControlDashboard'));
const ResumenGeneralView = lazy(() => import('./components/resumen-general-view').then(module => ({ default: module.ResumenGeneralView })));
const PaidInvoicesView = lazy(() => import('./components/paid-invoices-view'));
const CuotaAlimentariaView = lazy(() => import('./components/cuota-alimentaria-view').then(module => ({ default: module.CuotaAlimentariaView })));
// BudgetsFullView is now integrated in MissionControlDashboard
const ConverterView = lazy(() => import('./components/converter-view').then(module => ({ default: module.ConverterView })));
const MarketView = lazy(() => import('./components/market-view').then(module => ({ default: module.MarketView })));
// const CedearsView = lazy(() => import('./components/CedearsView').then(module => ({ default: module.CedearsView }))); // Ya integrado en MissionControl

// Loading Spinner para Suspense
const LoadingSpinner = () => (
  <div className="flex h-full w-full items-center justify-center p-8">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent"></div>
  </div>
);

function App() {
  const { isAuthenticated, loading } = useAuth();
  const [currentView, setCurrentView] = React.useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  // Detectar cambios en el tamaño de pantalla
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Escuchar eventos de navegación personalizados (para el DollarQuoteWidget)
  React.useEffect(() => {
    const handleNavigate = (event) => {
      if (event.detail && event.detail.view) {
        setCurrentView(event.detail.view);
      }
    };

    window.addEventListener('navigate', handleNavigate);
    return () => window.removeEventListener('navigate', handleNavigate);
  }, []);

  const renderCurrentView = () => {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        {(() => {
    switch (currentView) {
      case 'dashboard':
        return <MissionControlDashboard onNavigate={setCurrentView} />;
      case 'mission-control':
        return <MissionControlDashboard onNavigate={setCurrentView} />;
      case 'dollar':
      case 'dolar':
        return <MissionControlDashboard onNavigate={setCurrentView} initialView="dolar" />;
      case 'converter':
        return <ConverterView />;
      case 'market':
        return <MarketView />;
      case 'cedears':
        return <MissionControlDashboard onNavigate={setCurrentView} initialView="cedears" />;
      case 'transactions':
        return <MissionControlDashboard onNavigate={setCurrentView} initialView="transactions-full" />;
      case 'resumen-bancario':
        return <MissionControlDashboard onNavigate={setCurrentView} initialView="bank-summaries-full" />;
      case 'pending-payments':
        return <MissionControlDashboard onNavigate={setCurrentView} initialView="pending-payments-full" />;
      case 'paid-invoices':
        return <PaidInvoicesView />;
      case 'payment-methods':
        return <MissionControlDashboard onNavigate={setCurrentView} initialView="payment-methods-full" />;
      case 'categories':
        return <MissionControlDashboard onNavigate={setCurrentView} initialView="categories-full" />;
      case 'currency-management':
        return <MissionControlDashboard onNavigate={setCurrentView} initialView="currency-management" />;
      case 'budgets':
        return <MissionControlDashboard onNavigate={setCurrentView} initialView="budgets-full" />;
      case 'cuota-alimentaria':
        return <CuotaAlimentariaView />;
      case 'agent':
        // ✨ Ahora el agente está integrado en MissionControlDashboard
        // Para acceder: Dashboard → Menu (☰) → Financial Agent
        return <MissionControlDashboard onNavigate={setCurrentView} initialView="agent" />;
      case 'ai-usage':
        return <MissionControlDashboard onNavigate={setCurrentView} initialView="ai-usage" />;
      case 'objetivos-full':
        return <MissionControlDashboard onNavigate={setCurrentView} initialView="objetivos-full" />;
      case 'bulk-upload':
        return <MissionControlDashboard onNavigate={setCurrentView} initialView="bulk-upload" />;
      case 'goals':
        return <BudgetsView />;
      case 'reports':
        return <ResumenGeneralView />;
      default:
        return <MissionControlDashboard onNavigate={setCurrentView} />;
    }
        })()}
      </Suspense>
    );
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
          {/* Emoji pulpo con animación */}
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

          {/* Card minimalista */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '100ms' }}>
            <LoginButton />
          </div>
          
          {/* Footer minimalista */}
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

  // Views that use MissionControlDashboard and handle their own layout
  const missionControlViews = [
    'dashboard', 'mission-control', 'dollar', 'dolar', 'cedears', 
    'transactions', 'resumen-bancario', 'pending-payments', 
    'payment-methods', 'categories', 'agent', 'ai-usage', 
    'objetivos-full', 'budgets', 'bulk-upload', 'currency-management'
  ];

  // Si es Mission Control o una de sus sub-vistas, renderizar sin sidebar wrapper
  if (missionControlViews.includes(currentView)) {
    return (
      <>
        {renderCurrentView()}
        {isMobile && (
          <MobileBottomNav 
            currentView={currentView}
            onNavigate={setCurrentView}
          />
        )}
        {/* Indicadores de estado de conexión */}
        <ConnectionStatus />
      </>
    );
  }

  return (
    <div className="app-container bg-black h-screen supports-[height:100dvh]:h-[100dvh] flex flex-col overflow-hidden">
      {/* Main Content */}
      <main className={`flex-1 relative overflow-y-auto ${isMobile ? 'pb-28' : ''}`}>

        <div className="h-full">
                {renderCurrentView()}
        </div>
              </main>
      
      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <MobileBottomNav 
          currentView={currentView}
          onNavigate={setCurrentView}
        />
      )}
      
      {/* Indicadores de estado de conexión */}
      <ConnectionStatus />
    </div>
  );
}

export default App;