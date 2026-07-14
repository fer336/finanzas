import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { X, Save, Landmark, DollarSign } from 'lucide-react';

/**
 * PrestamoModal — alta/edición de Préstamo, tema "Papel" (mismos tokens
 * que StitchPendingPaymentModal: modal fondo #faf7ef, overlay
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
        <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-[#ddd5c2] bg-[#faf7ef] dark:border-[#2e3844] dark:bg-[#1a2029]">
          <div className="flex items-center justify-between border-b border-[#ddd5c2] bg-[#faf7ef] px-6 py-5 sm:px-8 dark:border-[#2e3844] dark:bg-[#1a2029]">
            <div className="flex items-center gap-3">
              <div className="rounded-sm bg-[#f0ead9] p-2 dark:bg-[#212836]">
                <Landmark className="h-5 w-5 text-primary" />
              </div>
              <h2 className="font-serif text-[19px] font-bold text-foreground sm:text-[21px]">
                {prestamo ? 'Editar préstamo' : 'Nuevo préstamo'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm p-2 text-[#8a8677] transition-colors hover:bg-black/5 hover:text-foreground dark:text-[#93a0af]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 space-y-5 overflow-y-auto p-6 sm:p-8">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-medium text-[#5d6470] dark:text-[#93a0af]">¿Quién te prestó?</label>
              <input
                type="text"
                value={formData.nombre_fuente}
                onChange={(e) => setFormData({ ...formData, nombre_fuente: e.target.value })}
                className="rounded-sm border border-[#ddd5c2] bg-white px-3.5 py-2.5 text-[13.5px] text-foreground placeholder:text-[#8a8677] focus:outline-none focus:ring-2 focus:ring-ring dark:border-[#2e3844] dark:bg-[#212836] dark:placeholder:text-[#93a0af]"
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
                <label className="text-[12.5px] font-medium text-[#5d6470] dark:text-[#93a0af]">Monto prestado</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.monto_prestado}
                  onChange={(e) => setFormData({ ...formData, monto_prestado: e.target.value })}
                  className="rounded-sm border border-[#ddd5c2] bg-white px-3.5 py-2.5 font-mono text-[13.5px] text-foreground placeholder:text-[#8a8677] focus:outline-none focus:ring-2 focus:ring-ring dark:border-[#2e3844] dark:bg-[#212836] dark:placeholder:text-[#93a0af]"
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium text-[#5d6470] dark:text-[#93a0af]">Monto a devolver</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.monto_a_devolver}
                  onChange={(e) => setFormData({ ...formData, monto_a_devolver: e.target.value })}
                  className="rounded-sm border border-[#ddd5c2] bg-white px-3.5 py-2.5 font-mono text-[13.5px] text-foreground placeholder:text-[#8a8677] focus:outline-none focus:ring-2 focus:ring-ring dark:border-[#2e3844] dark:bg-[#212836] dark:placeholder:text-[#93a0af]"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <p className="-mt-3 text-[11.5px] text-[#8a8677] dark:text-[#93a0af]">Puede diferir del monto prestado si hay interés.</p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium text-[#5d6470] dark:text-[#93a0af]">Moneda</label>
                <select
                  value={formData.moneda}
                  onChange={(e) => setFormData({ ...formData, moneda: e.target.value })}
                  className="rounded-sm border border-[#ddd5c2] bg-white px-3.5 py-2.5 text-[13.5px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring dark:border-[#2e3844] dark:bg-[#212836]"
                >
                  <option value="ARS">ARS - Pesos Argentinos</option>
                  <option value="USD">USD - Dólares</option>
                  <option value="EUR">EUR - Euros</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium text-[#5d6470] dark:text-[#93a0af]">Fecha del préstamo</label>
                <input
                  type="date"
                  value={formData.fecha_prestamo}
                  onChange={(e) => setFormData({ ...formData, fecha_prestamo: e.target.value })}
                  className="rounded-sm border border-[#ddd5c2] bg-white px-3.5 py-2.5 font-mono text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring dark:border-[#2e3844] dark:bg-[#212836]"
                  required
                />
                <p className="text-[11px] text-[#8a8677] dark:text-[#93a0af]">Cuándo recibiste el dinero — se registra como ingreso en Movimientos.</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium text-[#5d6470] dark:text-[#93a0af]">Fecha de vencimiento</label>
                <input
                  type="date"
                  value={formData.fecha_vencimiento}
                  onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
                  className="rounded-sm border border-[#ddd5c2] bg-white px-3.5 py-2.5 font-mono text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring dark:border-[#2e3844] dark:bg-[#212836]"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-medium text-[#5d6470] dark:text-[#93a0af]">Notas (opcional)</label>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                className="resize-none rounded-sm border border-[#ddd5c2] bg-white px-3.5 py-2.5 text-[13.5px] text-foreground placeholder:text-[#8a8677] focus:outline-none focus:ring-2 focus:ring-ring dark:border-[#2e3844] dark:bg-[#212836] dark:placeholder:text-[#93a0af]"
                placeholder="Añadir una nota..."
                rows={3}
              />
            </div>
          </form>

          <div className="flex items-center justify-end gap-3 border-t border-[#ddd5c2] bg-[#faf7ef] px-6 py-5 sm:px-8 dark:border-[#2e3844] dark:bg-[#1a2029]">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-sm border border-[#ddd5c2] bg-white px-5 py-2.5 text-[13.5px] font-medium text-foreground transition-colors duration-150 hover:bg-[#f0ead9] disabled:opacity-50 dark:border-[#2e3844] dark:bg-[#212836] dark:hover:bg-[#212836]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-[#4f7047] disabled:opacity-50 dark:hover:bg-[#7d9970]"
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
