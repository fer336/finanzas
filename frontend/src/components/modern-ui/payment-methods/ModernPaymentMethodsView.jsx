import PropTypes from 'prop-types';
import { Plus, Edit, Trash2, Eye, EyeOff, RefreshCw, CreditCard, Wallet, Landmark } from 'lucide-react';
import { useRefresh } from '../../../hooks/useRefresh';
import { QUERY_KEYS } from '../../../hooks/useFinancialData';

const ModernPaymentMethodsView = ({ 
  paymentMethods = [], 
  onNewPaymentMethod,
  onEditPaymentMethod,
  onDeletePaymentMethod 
}) => {
  const { refresh, isRefreshing } = useRefresh([QUERY_KEYS.paymentMethods]);

  // Normalizar métodos de pago
  const normalized = paymentMethods.map(pm => ({
    id: pm.id || pm.Id,
    nombre: pm.nombre || pm.Nombre,
    tipo: pm.tipo || pm.Tipo || 'otro',
    color: pm.color || pm.Color || '#10b981',
    icono: pm.icono || pm.Icono || '💳',
    activo: pm.activo !== undefined ? pm.activo : (pm.Activo !== undefined ? pm.Activo : true),
    descripcion: pm.descripcion || pm.Descripcion || ''
  }));

  const activosCount = normalized.filter(pm => pm.activo).length;
  const inactivosCount = normalized.filter(pm => !pm.activo).length;

  const formatTypeLabel = (tipo = '') => {
    const clean = tipo.toString().replace(/_/g, ' ').trim();
    if (!clean) return 'Otro';
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  };

  const renderPaymentIcon = (icono = '', tipo = '') => {
    const iconText = (icono || '').toString().trim();
    const tipoText = (tipo || '').toString().toLowerCase();

    if (iconText && iconText.length <= 2) {
      return <span className="text-xl leading-none">{iconText}</span>;
    }

    if (iconText.toLowerCase().includes('wallet') || tipoText.includes('efectivo')) {
      return <Wallet className="w-6 h-6 text-[#10b981]" />;
    }

    if (iconText.toLowerCase().includes('bank') || tipoText.includes('transfer')) {
      return <Landmark className="w-6 h-6 text-[#10b981]" />;
    }

    return <CreditCard className="w-6 h-6 text-[#10b981]" />;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-3 pb-28 sm:p-5">
      <div className="mb-4 rounded-3xl border border-white/10 bg-gradient-to-br from-[#0e1f1a] via-[#14161f] to-[#111827] p-3.5 sm:mb-5 sm:p-5">
        <div className="mb-3 flex items-start justify-between gap-2.5">
          <div>
            <h1 className="text-lg font-bold text-white sm:text-2xl">Métodos de Pago</h1>
            <p className="mt-0.5 text-[11px] text-white/60 sm:text-sm">Organizá cómo registrás cada movimiento</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#18181b]/90 px-2.5 py-1.5 text-xs text-gray-300 transition-all hover:bg-white/5 hover:text-white disabled:opacity-50 sm:px-3 sm:py-2 sm:text-sm"
              title="Actualizar métodos de pago"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isRefreshing ? 'Actualizando...' : 'Actualizar'}</span>
            </button>
            <button onClick={onNewPaymentMethod} className="flex items-center gap-1.5 rounded-xl bg-[#10b981] px-3 py-1.5 text-xs font-semibold text-white transition-all hover:scale-[1.02] hover:bg-[#0ea572] active:scale-[0.98] sm:gap-2 sm:px-4 sm:py-2 sm:text-sm">
              <Plus className="w-4 h-4" />
              <span>Nuevo</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-2.5 sm:p-3">
            <p className="text-[10px] tracking-wide text-white/50">TOTAL</p>
            <div className="mt-0.5 flex items-center justify-between">
              <p className="text-xl font-bold text-white sm:text-2xl">{normalized.length}</p>
              <CreditCard className="w-4 h-4 text-cyan-300 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="rounded-2xl border border-[#10b981]/30 bg-[#10b981]/10 p-2.5 sm:p-3">
            <p className="text-[10px] tracking-wide text-[#10b981]/80">ACTIVOS</p>
            <div className="mt-0.5 flex items-center justify-between">
              <p className="text-xl font-bold text-[#10b981] sm:text-2xl">{activosCount}</p>
              <Eye className="w-4 h-4 text-[#10b981] sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-2.5 sm:p-3">
            <p className="text-[10px] tracking-wide text-white/50">INACTIVOS</p>
            <div className="mt-0.5 flex items-center justify-between">
              <p className="text-xl font-bold text-[#f87171] sm:text-2xl">{inactivosCount}</p>
              <EyeOff className="w-4 h-4 text-white/40 sm:w-5 sm:h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Métodos de Pago */}
      {normalized.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-6xl mb-4 block">💳</span>
          <h3 className="text-xl font-bold text-white mb-2">No hay métodos de pago</h3>
          <p className="text-gray-400 mb-6">
            Crea métodos de pago para organizar tus transacciones
          </p>
          <button 
            onClick={onNewPaymentMethod}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#10b981] to-[#34d399] text-white font-medium hover:shadow-lg transition-all"
          >
            Crear Primer Método
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 md:gap-4">
          {normalized.map((pm) => (
            <div 
              key={pm.id} 
              className={`relative rounded-3xl border p-4 transition-all ${
                pm.activo
                  ? 'border-white/10 bg-gradient-to-br from-[#18181b] via-[#151824] to-[#121823] hover:border-[#10b981]/40'
                  : 'border-white/10 bg-[#18181b]/60 opacity-70'
              } sm:p-5`}
            >
              <div className="mb-3 flex items-start justify-between gap-2.5">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div 
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10" 
                    style={{ backgroundColor: `${pm.color}1f` }}
                  >
                    {renderPaymentIcon(pm.icono, pm.tipo)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="break-words text-[15px] font-bold leading-tight text-white sm:text-base">{pm.nombre}</h3>
                    <p className="mt-0.5 break-all text-xs text-white/60">{formatTypeLabel(pm.tipo)}</p>
                  </div>
                </div>
              </div>

              <div className="mb-3 flex items-center justify-between">
                <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                  pm.activo 
                    ? 'border-[#10b981]/30 bg-[#10b981]/10 text-[#10b981]' 
                    : 'border-zinc-500/30 bg-zinc-500/10 text-zinc-400'
                }`}>
                  {pm.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              {pm.descripcion && (
                <p className="mb-3 line-clamp-2 text-[11px] text-white/45">{pm.descripcion}</p>
              )}

              <div className="flex gap-1.5">
                <button
                  onClick={() => onEditPaymentMethod && onEditPaymentMethod(pm)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white transition-colors hover:bg-white/10"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`¿Eliminar método "${pm.nombre}"?`)) {
                      onDeletePaymentMethod && onDeletePaymentMethod(pm.id);
                    }
                  }}
                  className="rounded-xl border border-red-500/30 bg-red-500/10 p-2 transition-colors hover:bg-red-500/20"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Botón Flotante */}
      <button 
        onClick={onNewPaymentMethod}
        className="fixed bottom-24 right-8 w-14 h-14 rounded-full bg-gradient-to-br from-[#10b981] to-[#34d399] flex items-center justify-center shadow-xl shadow-green-500/30 hover:shadow-2xl hover:scale-110 transition-all z-40"
        title="Nuevo Método de Pago"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>
    </div>
  );
};

ModernPaymentMethodsView.propTypes = { 
  paymentMethods: PropTypes.array, 
  onNewPaymentMethod: PropTypes.func,
  onEditPaymentMethod: PropTypes.func,
  onDeletePaymentMethod: PropTypes.func
};

export default ModernPaymentMethodsView;
