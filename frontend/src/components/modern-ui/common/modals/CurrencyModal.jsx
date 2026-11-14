import { useState, useEffect } from 'react';
import { X, Save, DollarSign, AlertCircle } from 'lucide-react';

/**
 * CurrencyModal — alta/edición de moneda personalizada, tema "Kanagawa".
 * Mismo patrón visual que PaymentMethodModal/CategoryModal (overlay
 * rgba(32,36,44,.4), panel #e5ddb0, radius 12px). `icono`/`color` se
 * mandan tal cual al backend (nombre de ícono Lucide + clases de
 * gradiente Tailwind) — la lista de monedas no los renderiza, así que
 * solo se reskinea el picker, no se cambia el contrato de datos.
 */
const ICON_OPTIONS = [
  { value: 'DollarSign', label: '💵 Dollar Sign', emoji: '💵' },
  { value: 'Euro', label: '💶 Euro', emoji: '💶' },
  { value: 'PoundSterling', label: '💷 Pound', emoji: '💷' },
  { value: 'Banknote', label: '💴 Banknote', emoji: '💴' },
  { value: 'Bitcoin', label: '₿ Bitcoin', emoji: '₿' },
  { value: 'Coins', label: '🪙 Coins', emoji: '🪙' },
  { value: 'Wallet', label: '👛 Wallet', emoji: '👛' },
  { value: 'CreditCard', label: '💳 Card', emoji: '💳' },
];

const COLOR_OPTIONS = [
  { value: 'from-blue-500 dark:from-[var(--primary)] to-cyan-500 dark:to-[var(--primary)]', label: 'Azul → Cyan' },
  { value: 'from-green-500 dark:from-[var(--primary)] to-emerald-500 dark:to-[var(--primary)]', label: 'Verde → Esmeralda' },
  { value: 'from-purple-500 dark:from-[var(--primary)] to-pink-500 dark:to-[var(--primary)]', label: 'Púrpura → Rosa' },
  { value: 'from-yellow-500 dark:from-[var(--warning)] to-orange-500 dark:to-[var(--warning)]', label: 'Amarillo → Naranja' },
  { value: 'from-indigo-500 dark:from-[var(--primary)] to-violet-500 dark:to-[var(--primary)]', label: 'Índigo → Violeta' },
  { value: 'from-red-500 dark:from-[var(--destructive)] to-rose-500 dark:to-[var(--destructive)]', label: 'Rojo → Rosado' },
  { value: 'from-teal-500 dark:from-[var(--primary)] to-cyan-500 dark:to-[var(--primary)]', label: 'Teal → Cyan' },
  { value: 'from-amber-500 dark:from-[var(--warning)] to-yellow-500 dark:to-[var(--warning)]', label: 'Ámbar → Amarillo' },
];

export const CurrencyModal = ({ isOpen, onClose, onSave, currency = null }) => {
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    simbolo: '',
    icono: 'DollarSign',
    color: 'from-blue-500 dark:from-[var(--primary)] to-cyan-500 dark:to-[var(--primary)]',
    activa: true,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (currency) {
      setFormData({
        codigo: currency.codigo || '',
        nombre: currency.nombre || '',
        simbolo: currency.simbolo || '',
        icono: currency.icono || 'DollarSign',
        color: currency.color || 'from-blue-500 dark:from-[var(--primary)] to-cyan-500 dark:to-[var(--primary)]',
        activa: currency.activa !== undefined ? currency.activa : true,
      });
    } else {
      setFormData({
        codigo: '',
        nombre: '',
        simbolo: '',
        icono: 'DollarSign',
        color: 'from-blue-500 dark:from-[var(--primary)] to-cyan-500 dark:to-[var(--primary)]',
        activa: true,
      });
    }
    setErrors({});
  }, [currency, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.codigo.trim()) {
      nextErrors.codigo = 'El código es obligatorio';
    } else if (formData.codigo.length > 10) {
      nextErrors.codigo = 'El código debe tener máximo 10 caracteres';
    } else if (!/^[A-Z]{3,10}$/.test(formData.codigo)) {
      nextErrors.codigo = 'El código debe ser 3-10 letras mayúsculas (ej: USD, BTC)';
    }

    if (!formData.nombre.trim()) nextErrors.nombre = 'El nombre es obligatorio';
    if (!formData.simbolo.trim()) nextErrors.simbolo = 'El símbolo es obligatorio';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      setErrors({ submit: error.message || 'Error al guardar la moneda' });
    } finally {
      setSaving(false);
    }
  };

  const previewEmoji = ICON_OPTIONS.find((i) => i.value === formData.icono)?.emoji || '💵';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: 'rgba(32,36,44,.4)' }}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#c8bf91] dark:border-[var(--border)] bg-[#e5ddb0] dark:bg-[var(--background)]">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#c8bf91] dark:border-[var(--border)] bg-[#e5ddb0] dark:bg-[var(--background)] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-sm bg-[#e4d794] dark:bg-[var(--card)] p-2">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-serif text-[19px] font-bold text-foreground sm:text-[21px]">
                {currency ? 'Editar moneda' : 'Nueva moneda'}
              </h2>
              <p className="text-[12.5px] text-[#625f55] dark:text-[var(--foreground)]">
                {currency ? 'Modificá los datos de la moneda' : 'Agregá una moneda personalizada'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm p-2 text-[#625f55] dark:text-[var(--foreground)] transition-colors hover:bg-black/5 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
          {/* Vista previa */}
          <div className="flex items-center gap-3 rounded-sm border border-[#c8bf91] dark:border-[var(--border)] bg-white dark:bg-[var(--card)] px-4 py-3">
            <div className="rounded-sm bg-[#e4d794] dark:bg-[var(--card)] p-2 text-xl leading-none">{previewEmoji}</div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.08em] text-[#625f55] dark:text-[var(--foreground)]">Vista previa</p>
              <p className="font-serif text-[15px] font-semibold text-foreground">
                {formData.codigo || 'XXX'} — {formData.nombre || 'Nombre'}
              </p>
              <p className="text-[12px] text-[#625f55] dark:text-[var(--foreground)]">Símbolo: {formData.simbolo || '?'}</p>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-[#43436c] dark:text-[var(--foreground)]">Código ISO *</label>
            <input
              type="text"
              value={formData.codigo}
              onChange={(e) => handleChange('codigo', e.target.value.toUpperCase())}
              placeholder="USD, EUR, BTC..."
              maxLength={10}
              className="w-full rounded-sm border border-[#c8bf91] dark:border-[var(--border)] bg-white dark:bg-[var(--card)] px-3.5 py-2.5 text-[13.5px] text-foreground placeholder:text-[#625f55] dark:placeholder:text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.codigo && (
              <p className="mt-1 flex items-center gap-1 text-[11.5px] text-[#b83245] dark:text-[var(--destructive)]">
                <AlertCircle className="h-3 w-3" /> {errors.codigo}
              </p>
            )}
            <p className="mt-1 text-[11.5px] text-[#625f55] dark:text-[var(--foreground)]">Código de 3-10 letras mayúsculas (ej: USD, EUR, BTC, USDT)</p>
          </div>

          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-[#43436c] dark:text-[var(--foreground)]">Nombre *</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Dólar Estadounidense, Bitcoin..."
              className="w-full rounded-sm border border-[#c8bf91] dark:border-[var(--border)] bg-white dark:bg-[var(--card)] px-3.5 py-2.5 text-[13.5px] text-foreground placeholder:text-[#625f55] dark:placeholder:text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.nombre && (
              <p className="mt-1 flex items-center gap-1 text-[11.5px] text-[#b83245] dark:text-[var(--destructive)]">
                <AlertCircle className="h-3 w-3" /> {errors.nombre}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-[#43436c] dark:text-[var(--foreground)]">Símbolo *</label>
            <input
              type="text"
              value={formData.simbolo}
              onChange={(e) => handleChange('simbolo', e.target.value)}
              placeholder="$, €, £, ₿..."
              maxLength={10}
              className="w-full rounded-sm border border-[#c8bf91] dark:border-[var(--border)] bg-white dark:bg-[var(--card)] px-3.5 py-2.5 text-[13.5px] text-foreground placeholder:text-[#625f55] dark:placeholder:text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.simbolo && (
              <p className="mt-1 flex items-center gap-1 text-[11.5px] text-[#b83245] dark:text-[var(--destructive)]">
                <AlertCircle className="h-3 w-3" /> {errors.simbolo}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-[#43436c] dark:text-[var(--foreground)]">Ícono</label>
              <select
                value={formData.icono}
                onChange={(e) => handleChange('icono', e.target.value)}
                className="w-full rounded-sm border border-[#c8bf91] dark:border-[var(--border)] bg-white dark:bg-[var(--card)] px-3.5 py-2.5 text-[13.5px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {ICON_OPTIONS.map((icon) => (
                  <option key={icon.value} value={icon.value}>{icon.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-[#43436c] dark:text-[var(--foreground)]">Color</label>
              <select
                value={formData.color}
                onChange={(e) => handleChange('color', e.target.value)}
                className="w-full rounded-sm border border-[#c8bf91] dark:border-[var(--border)] bg-white dark:bg-[var(--card)] px-3.5 py-2.5 text-[13.5px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {COLOR_OPTIONS.map((color) => (
                  <option key={color.value} value={color.value}>{color.label}</option>
                ))}
              </select>
            </div>
          </div>

          {errors.submit && (
            <div className="rounded-sm border border-[#b83245]/40 dark:border-[var(--overdue-pill)] bg-[#b83245]/5 dark:bg-[var(--overdue-pill)] p-3.5 text-[12.5px] text-[#b83245] dark:text-[var(--destructive)]">
              {errors.submit}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-sm border border-[#c8bf91] dark:border-[var(--border)] bg-white dark:bg-[var(--card)] px-4 py-2.5 text-[13.5px] font-medium text-foreground transition-colors duration-150 hover:bg-[#e4d794] dark:hover:bg-[var(--card)]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-[#5f7841] dark:hover:bg-[var(--primary-hover)] disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Guardando…' : 'Guardar moneda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
