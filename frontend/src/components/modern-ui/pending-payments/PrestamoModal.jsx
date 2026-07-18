import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { X, Save, Landmark, DollarSign } from 'lucide-react';

/**
 * PrestamoModal — alta/edición de Préstamo, tema "Kanagawa" (mismos tokens
 * que StitchPendingPaymentModal: modal fondo #e5ddb0, overlay
 * rgba(32,36,44,.4), radius 12px).
 */
const PrestamoModal = ({ isOpen, onClose, onSave, prestamo = null }) => {
  const [formData, setFormData] = useState({
    nombre_fuente: '',
    monto_prestado: '',
    monto_a_devolver: '',
    moneda: 'ARS',
    fecha_prestamo: new Date().toISOString().split('T')[0],
    fecha_vencimiento: new Date().toISOString().split('T')[0],
    notas: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        nombre_fuente: prestamo?.nombre_fuente || '',
        monto_prestado: prestamo?.monto_prestado ?? '',
        monto_a_devolver: prestamo?.monto_a_devolver ?? '',
        moneda: prestamo?.moneda || 'ARS',
        fecha_prestamo: (prestamo?.fecha_prestamo || '').split('T')[0] || new Date().toISOString().split('T')[0],
        fecha_vencimiento: (prestamo?.fecha_vencimiento || '').split('T')[0] || new Date().toISOString().split('T')[0],
        notas: prestamo?.notas || '',
      });
    }
  }, [prestamo, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...formData,
        monto_prestado: parseFloat(formData.monto_prestado) || 0,
        monto_a_devolver: parseFloat(formData.monto_a_devolver) || 0,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[9998]" style={{ background: 'rgba(32,36,44,.4)' }} onClick={onClose} />

      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-[#c8bf91] bg-[#e5ddb0] dark:border-[#363646] dark:bg-[#181820]">
          <div className="flex items-center justify-between border-b border-[#c8bf91] bg-[#e5ddb0] px-6 py-5 sm:px-8 dark:border-[#363646] dark:bg-[#181820]">
            <div className="flex items-center gap-3">
              <div className="rounded-sm bg-[#e4d794] p-2 dark:bg-[#2a2a37]">
                <Landmark className="h-5 w-5 text-primary" />
              </div>
              <h2 className="font-serif text-[19px] font-bold text-foreground sm:text-[21px]">
                {prestamo ? 'Editar préstamo' : 'Nuevo préstamo'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm p-2 text-[#625f55] transition-colors hover:bg-black/5 hover:text-foreground dark:text-[#c8c093]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 space-y-5 overflow-y-auto p-6 sm:p-8">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-medium text-[#43436c] dark:text-[#c8c093]">¿Quién te prestó?</label>
              <input
                type="text"
                value={formData.nombre_fuente}
                onChange={(e) => setFormData({ ...formData, nombre_fuente: e.target.value })}
                className="rounded-sm border border-[#c8bf91] bg-white px-3.5 py-2.5 text-[13.5px] text-foreground placeholder:text-[#625f55] focus:outline-none focus:ring-2 focus:ring-ring dark:border-[#363646] dark:bg-[#2a2a37] dark:placeholder:text-[#c8c093]"
                placeholder="Ej: Banco Nación, Juan Pérez..."
                required
              />
            </div>

            <div className="mb-1 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <h3 className="font-serif text-[15px] font-semibold text-foreground">Montos</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium text-[#43436c] dark:text-[#c8c093]">Monto prestado</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.monto_prestado}
                  onChange={(e) => setFormData({ ...formData, monto_prestado: e.target.value })}
                  className="rounded-sm border border-[#c8bf91] bg-white px-3.5 py-2.5 font-mono text-[13.5px] text-foreground placeholder:text-[#625f55] focus:outline-none focus:ring-2 focus:ring-ring dark:border-[#363646] dark:bg-[#2a2a37] dark:placeholder:text-[#c8c093]"
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium text-[#43436c] dark:text-[#c8c093]">Monto a devolver</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.monto_a_devolver}
                  onChange={(e) => setFormData({ ...formData, monto_a_devolver: e.target.value })}
                  className="rounded-sm border border-[#c8bf91] bg-white px-3.5 py-2.5 font-mono text-[13.5px] text-foreground placeholder:text-[#625f55] focus:outline-none focus:ring-2 focus:ring-ring dark:border-[#363646] dark:bg-[#2a2a37] dark:placeholder:text-[#c8c093]"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <p className="-mt-3 text-[11.5px] text-[#625f55] dark:text-[#c8c093]">Puede diferir del monto prestado si hay interés.</p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium text-[#43436c] dark:text-[#c8c093]">Moneda</label>
                <select
                  value={formData.moneda}
                  onChange={(e) => setFormData({ ...formData, moneda: e.target.value })}
                  className="rounded-sm border border-[#c8bf91] bg-white px-3.5 py-2.5 text-[13.5px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring dark:border-[#363646] dark:bg-[#2a2a37]"
                >
                  <option value="ARS">ARS - Pesos Argentinos</option>
                  <option value="USD">USD - Dólares</option>
                  <option value="EUR">EUR - Euros</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium text-[#43436c] dark:text-[#c8c093]">Fecha del préstamo</label>
                <input
                  type="date"
                  value={formData.fecha_prestamo}
                  onChange={(e) => setFormData({ ...formData, fecha_prestamo: e.target.value })}
                  className="rounded-sm border border-[#c8bf91] bg-white px-3.5 py-2.5 font-mono text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring dark:border-[#363646] dark:bg-[#2a2a37]"
                  required
                />
                <p className="text-[11px] text-[#625f55] dark:text-[#c8c093]">Cuándo recibiste el dinero — se registra como ingreso en Movimientos.</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium text-[#43436c] dark:text-[#c8c093]">Fecha de vencimiento</label>
                <input
                  type="date"
                  value={formData.fecha_vencimiento}
                  onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
                  className="rounded-sm border border-[#c8bf91] bg-white px-3.5 py-2.5 font-mono text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring dark:border-[#363646] dark:bg-[#2a2a37]"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-medium text-[#43436c] dark:text-[#c8c093]">Notas (opcional)</label>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                className="resize-none rounded-sm border border-[#c8bf91] bg-white px-3.5 py-2.5 text-[13.5px] text-foreground placeholder:text-[#625f55] focus:outline-none focus:ring-2 focus:ring-ring dark:border-[#363646] dark:bg-[#2a2a37] dark:placeholder:text-[#c8c093]"
                placeholder="Añadir una nota..."
                rows={3}
              />
            </div>
          </form>

          <div className="flex items-center justify-end gap-3 border-t border-[#c8bf91] bg-[#e5ddb0] px-6 py-5 sm:px-8 dark:border-[#363646] dark:bg-[#181820]">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-sm border border-[#c8bf91] bg-white px-5 py-2.5 text-[13.5px] font-medium text-foreground transition-colors duration-150 hover:bg-[#e4d794] disabled:opacity-50 dark:border-[#363646] dark:bg-[#2a2a37] dark:hover:bg-[#2a2a37]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-[#5f7841] disabled:opacity-50 dark:hover:bg-[#76946a]"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

PrestamoModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  prestamo: PropTypes.object,
};

export default PrestamoModal;
