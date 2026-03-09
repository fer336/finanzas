import { useState } from 'react';
import { X, Target, DollarSign, Loader2 } from 'lucide-react';
import apiServices from '../../services/api';

/**
 * Modal para asignar dinero a un objetivo de ahorro
 */
export const AsignarDineroModal = ({
  isOpen,
  onClose,
  objetivo,
  onSuccess,
  balanceDisponible = 0,
  balancePorMoneda = {},
}) => {
  const [monto, setMonto] = useState('');
  const [nota, setNota] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !objetivo) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const montoNum = parseFloat(monto);
    if (!montoNum || montoNum <= 0) {
      setError('Ingresá un monto válido');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiServices.objetivosApi.addContribution({
        objetivo_id: objetivo.id || objetivo.Id,
        monto: montoNum,
        nota,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err?.message || 'Error al asignar dinero');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount || 0);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-[#1a1a1a] border border-white/10 rounded-xl w-full max-w-md shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Target className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Asignar dinero</h2>
              <p className="text-sm text-white/50 truncate max-w-[220px]">
                {objetivo.nombre || objetivo.Nombre || 'Objetivo'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Balance disponible */}
          <div className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm text-white/50">Balance disponible</span>
            <span className="text-sm font-semibold text-green-400">
              {formatAmount(balanceDisponible)}
            </span>
          </div>

          {/* Monto */}
          <div>
            <label className="block text-sm text-white/70 mb-1.5">Monto a asignar</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="number"
                min="1"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-green-500/50 transition-colors"
                autoFocus
              />
            </div>
          </div>

          {/* Nota opcional */}
          <div>
            <label className="block text-sm text-white/70 mb-1.5">Nota (opcional)</label>
            <input
              type="text"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Ej: Ahorro de este mes"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-green-500/50 transition-colors"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !monto}
              className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Asignando...
                </>
              ) : (
                'Asignar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AsignarDineroModal;
