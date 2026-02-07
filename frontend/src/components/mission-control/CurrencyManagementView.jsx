import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Plus, Edit2, Trash2, Eye, EyeOff,
  DollarSign, Check, Loader2, Coins, ToggleLeft, ToggleRight
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { CurrencyModal } from './modals/CurrencyModal';
import apiServices from '../../services/api';

/**
 * Vista compacta para gestionar monedas del usuario
 * UX/UI optimizada para mobile
 */
const CurrencyManagementView = ({ onBack }) => {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadCurrencies();
  }, []);

  const loadCurrencies = async () => {
    setLoading(true);
    try {
      const data = await apiServices.monedasApi.getAll({ orden_by: 'orden' });
      if (!data || data.length === 0) {
        await apiServices.monedasApi.initializeDefault();
        const newData = await apiServices.monedasApi.getAll({ orden_by: 'orden' });
        setCurrencies(newData);
      } else {
        setCurrencies(data);
      }
    } catch (error) {
      console.error('❌ Error cargando monedas:', error);
      setCurrencies([
        { id: '1', codigo: 'ARS', nombre: 'Peso Argentino', simbolo: '$', icono: 'DollarSign', color: 'from-blue-500 to-cyan-500', es_predeterminada: true, activa: true, orden: 1 },
        { id: '2', codigo: 'USD', nombre: 'Dólar Estadounidense', simbolo: 'U$D', icono: 'DollarSign', color: 'from-green-500 to-emerald-500', es_predeterminada: true, activa: true, orden: 2 },
        { id: '3', codigo: 'EUR', nombre: 'Euro', simbolo: '€', icono: 'Euro', color: 'from-purple-500 to-pink-500', es_predeterminada: true, activa: true, orden: 3 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCurrency = () => {
    setEditingCurrency(null);
    setShowModal(true);
  };

  const handleEditCurrency = (currency) => {
    setEditingCurrency(currency);
    setShowModal(true);
  };

  const handleSaveCurrency = async (currencyData) => {
    try {
      if (editingCurrency) {
        await apiServices.monedasApi.update(editingCurrency.id, currencyData);
      } else {
        await apiServices.monedasApi.create(currencyData);
      }
      await loadCurrencies();
      setShowModal(false);
      setEditingCurrency(null);
    } catch (error) {
      console.error('❌ Error guardando moneda:', error);
      throw error;
    }
  };

  const handleToggleActive = async (currency) => {
    try {
      await apiServices.monedasApi.toggleActive(currency.id);
      setCurrencies(prev =>
        prev.map(c =>
          c.id === currency.id ? { ...c, activa: !c.activa } : c
        )
      );
    } catch (error) {
      console.error('❌ Error cambiando estado:', error);
      alert('Error al cambiar estado: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleDeleteCurrency = async (currencyId) => {
    const currencyName = deleteConfirm?.nombre || '';
    try {
      await apiServices.monedasApi.delete(currencyId);
      setCurrencies(prev => prev.filter(c => c.id !== currencyId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('❌ Error eliminando moneda:', error);
      alert(`Error al eliminar: ${error.message || 'Error inesperado'}`);
      setDeleteConfirm(null);
    }
  };

  const getIconComponent = (iconName) => {
    if (!iconName) return DollarSign;
    const IconComponent = LucideIcons[iconName];
    return IconComponent || DollarSign;
  };

  const renderIcon = (iconName, className = "w-4 h-4") => {
    const IconComponent = getIconComponent(iconName);
    return <IconComponent className={className} />;
  };

  const activeCurrencies = currencies.filter(c => c.activa);
  const customCurrencies = currencies.filter(c => !c.es_predeterminada);

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-zinc-400">Cargando monedas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header compacto ── */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-white/10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <Coins className="w-4 h-4 text-cyan-400" />
                Monedas
              </h1>
              <p className="text-xs text-zinc-500">{currencies.length} configuradas</p>
            </div>
          </div>
          <button
            onClick={handleAddCurrency}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nueva
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 py-4 pb-24 space-y-4">

        {/* Stats compactos en una fila */}
        <div className="flex gap-2">
          <div className="flex-1 bg-[#162028] border border-white/10 rounded-xl px-3 py-2.5 text-center">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Total</p>
            <p className="text-lg font-bold text-white">{currencies.length}</p>
          </div>
          <div className="flex-1 bg-[#162028] border border-white/10 rounded-xl px-3 py-2.5 text-center">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Activas</p>
            <p className="text-lg font-bold text-emerald-400">{activeCurrencies.length}</p>
          </div>
          <div className="flex-1 bg-[#162028] border border-white/10 rounded-xl px-3 py-2.5 text-center">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Custom</p>
            <p className="text-lg font-bold text-cyan-400">{customCurrencies.length}</p>
          </div>
        </div>

        {/* ── Lista de monedas ── */}
        {currencies.length === 0 ? (
          <div className="bg-[#162028] border border-white/10 rounded-xl p-8 text-center">
            <DollarSign className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-400 mb-3">No tienes monedas configuradas</p>
            <button
              onClick={handleAddCurrency}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white text-sm rounded-lg transition-colors"
            >
              Agregar moneda
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {currencies.map(currency => (
              <div
                key={currency.id}
                className={`bg-[#162028] border border-white/10 rounded-xl p-3 transition-all ${
                  !currency.activa ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Icono con gradiente */}
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${currency.color} flex items-center justify-center flex-shrink-0`}>
                    {renderIcon(currency.icono, "w-4 h-4 text-white")}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white">{currency.codigo}</span>
                      <span className="text-xs text-zinc-500">({currency.simbolo})</span>
                      {currency.es_predeterminada && (
                        <span className="px-1.5 py-0.5 bg-blue-500/15 border border-blue-500/25 rounded text-[10px] text-blue-400">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 truncate">{currency.nombre}</p>
                  </div>

                  {/* Toggle activo/inactivo */}
                  <button
                    onClick={() => handleToggleActive(currency)}
                    className="flex-shrink-0 p-1"
                    title={currency.activa ? 'Desactivar' : 'Activar'}
                  >
                    {currency.activa ? (
                      <ToggleRight className="w-7 h-7 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-zinc-600" />
                    )}
                  </button>

                  {/* Acciones */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleEditCurrency(currency)}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-blue-400"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(currency)}
                      className="p-1.5 hover:bg-red-500/15 rounded-lg transition-colors text-zinc-400 hover:text-red-400"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Currency Modal ── */}
      <CurrencyModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingCurrency(null);
        }}
        onSave={handleSaveCurrency}
        currency={editingCurrency}
      />

      {/* ── Delete Confirmation ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative bg-[#1a1a1a] border border-white/10 rounded-xl p-5 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-400" />
              </div>
              <h3 className="text-sm font-bold text-white">¿Eliminar moneda?</h3>
            </div>
            <p className="text-xs text-zinc-400 mb-1">
              Se eliminará <strong className="text-white">{deleteConfirm.nombre} ({deleteConfirm.codigo})</strong>.
            </p>
            {deleteConfirm.es_predeterminada && (
              <div className="my-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-400 text-[11px]">
                  ⚠️ Moneda predeterminada. Podría afectar transacciones existentes.
                </p>
              </div>
            )}
            <p className="text-[11px] text-red-400/70 mb-4">
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-white text-xs rounded-lg transition-colors border border-white/10"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteCurrency(deleteConfirm.id)}
                className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-400 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencyManagementView;
