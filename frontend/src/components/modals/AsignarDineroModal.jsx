import { useEffect, useState } from 'react';
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
  aporte = null,
  balanceDisponible = 0,
  balancePorMoneda = {},
}) => {
  const [monto, setMonto] = useState('');
  const [nota, setNota] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setMonto(aporte ? String(aporte.monto ?? '') : '');
    setNota(aporte?.notas || aporte?.descripcion || '');
    setError('');
  }, [aporte, isOpen]);

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
      const payload = aporte
        ? { monto: montoNum, notas: nota }
        : { objetivo_id: objetivo.id || objetivo.Id, monto: montoNum, notas: nota };
      if (aporte) {
        await apiServices.objetivosApi.updateContribution(aporte.id, payload);
      } else {
        await apiServices.objetivosApi.addContribution(payload);
      }
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
        className="bg-[#e5ddb0] border border-[#c8bf91] rounded-xl w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300 dark:bg-[#181820] dark:border-[#363646]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#d5cea3] dark:border-[#363646]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#e4d794] rounded-lg dark:bg-[#2a2a37]">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{aporte ? 'Editar aporte' : 'Asignar dinero'}</h2>
              <p className="text-sm text-[#43436c] truncate max-w-[220px] dark:text-[#c8c093]">
                {objetivo.nombre || objetivo.Nombre || 'Objetivo'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/5 rounded-lg transition-colors text-[#625f55] hover:text-foreground dark:text-[#c8c093] dark:hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Balance disponible */}
          <div className="bg-[#e4d794] rounded-lg p-3 flex items-center justify-between dark:bg-[#2a2a37]">
            <span className="text-sm text-[#43436c] dark:text-[#c8c093]">Balance disponible</span>
            <span className="text-sm font-semibold text-primary">
              {formatAmount(balanceDisponible)}
            </span>
          </div>

          {/* Monto */}
          <div>
            <label className="block text-sm text-[#43436c] mb-1.5 dark:text-[#c8c093]">Monto a asignar</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#625f55] dark:text-[#c8c093]" />
              <input
                type="number"
                min="1"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#c8bf91] rounded-lg text-foreground placeholder:text-[#625f55] focus:outline-none focus:ring-2 focus:ring-ring transition-colors dark:bg-[#2a2a37] dark:border-[#363646] dark:placeholder:text-[#c8c093]"
                autoFocus
              />
            </div>
          </div>

          {/* Nota opcional */}
          <div>
            <label className="block text-sm text-[#43436c] mb-1.5 dark:text-[#c8c093]">Nota (opcional)</label>
            <input
              type="text"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Ej: Ahorro de este mes"
              className="w-full px-4 py-2.5 bg-white border border-[#c8bf91] rounded-lg text-foreground placeholder:text-[#625f55] focus:outline-none focus:ring-2 focus:ring-ring transition-colors dark:bg-[#2a2a37] dark:border-[#363646] dark:placeholder:text-[#c8c093]"
            />
          </div>

          {error && (
            <p className="text-sm text-[#b83245] bg-[#f9d791] rounded-lg px-3 py-2 dark:text-[#e46876] dark:bg-[rgba(230,195,132,0.14)]">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white hover:bg-[#e4d794] border border-[#c8bf91] rounded-lg text-foreground transition-colors dark:bg-[#2a2a37] dark:hover:bg-[#363646] dark:border-[#363646]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !monto}
              className="flex-1 px-4 py-2.5 bg-primary hover:bg-[#5f7841] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-primary-foreground font-medium transition-colors flex items-center justify-center gap-2 dark:hover:bg-[#76946a]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Asignando...
                </>
              ) : (
                aporte ? 'Guardar cambios' : 'Asignar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AsignarDineroModal;
