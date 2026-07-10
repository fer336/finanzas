import { useEffect, useState } from 'react';
import { Save, Wallet, X } from 'lucide-react';

/**
 * PaymentMethodModal — alta/edición de método de pago, tema "Papel".
 * Mismo patrón visual que CategoryModal (overlay rgba(32,36,44,.4),
 * panel #faf7ef, radius 12px, pills de tipo, paleta de color en tonos
 * tierra). El ícono sigue siendo un emoji libre — set curado chico,
 * no amerita el picker reicon-react usado en categorías.
 */
const TYPE_OPTIONS = [
  { value: 'tarjeta', label: 'Tarjeta', icon: '💳' },
  { value: 'efectivo', label: 'Efectivo', icon: '💵' },
  { value: 'transferencia', label: 'Transferencia', icon: '🏦' },
  { value: 'debito', label: 'Débito', icon: '💰' },
  { value: 'credito', label: 'Crédito', icon: '💎' },
  { value: 'otro', label: 'Otro', icon: '📋' },
];

const COLOR_OPTIONS = [
  '#5a7d52', '#476442', '#b35a42', '#a04a34', '#3d5a80',
  '#8a6fa0', '#e9c46a', '#8a6a1f', '#9aa2ad', '#5d6470',
  '#20242c', '#6b8e7a', '#c17a52', '#4a7a9d', '#a37fb8',
];

const ICON_OPTIONS = ['💳', '💵', '🏦', '💰', '💎', '📋', '🪙', '💸', '🏧', '📱'];

export const PaymentMethodModal = ({ isOpen, onClose, onSave, paymentMethod = null }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'tarjeta',
    color: '#5a7d52',
    icono: '💳',
    descripcion: '',
    activo: true,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;

    if (paymentMethod) {
      setFormData({
        nombre: paymentMethod.Nombre || paymentMethod.nombre || '',
        tipo: paymentMethod.Tipo || paymentMethod.tipo || 'tarjeta',
        color: paymentMethod.Color || paymentMethod.color || '#5a7d52',
        icono: paymentMethod.Icono || paymentMethod.icono || '💳',
        descripcion: paymentMethod.Descripcion || paymentMethod.descripcion || '',
        activo:
          paymentMethod.Activo !== undefined
            ? paymentMethod.Activo
            : paymentMethod.activo !== undefined
              ? paymentMethod.activo
              : true,
      });
    } else {
      setFormData({
        nombre: '',
        tipo: 'tarjeta',
        color: '#5a7d52',
        icono: '💳',
        descripcion: '',
        activo: true,
      });
    }

    setErrors({});
  }, [paymentMethod, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.nombre.trim()) nextErrors.nombre = 'El nombre es requerido';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      setErrors({ general: error.message });
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: 'rgba(32,36,44,.4)' }}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#ddd5c2] bg-[#faf7ef]">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#ddd5c2] bg-[#faf7ef] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-sm bg-[#f0ead9] p-2">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <h2 className="font-serif text-[19px] font-bold text-foreground sm:text-[21px]">
              {paymentMethod ? 'Editar método de pago' : 'Nuevo método de pago'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm p-2 text-[#8a8677] transition-colors hover:bg-black/5 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
          {errors.general && (
            <div className="rounded-sm border border-[#a04a34]/40 bg-[#a04a34]/5 p-3.5 text-[12.5px] text-[#a04a34]">
              {errors.general}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-[#5d6470]">Nombre *</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              className="w-full rounded-sm border border-[#ddd5c2] bg-white px-3.5 py-2.5 text-[13.5px] text-foreground placeholder:text-[#8a8677] focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Ej: Tarjeta Visa, Efectivo, Transferencia"
            />
            {errors.nombre && <p className="mt-1 text-[11.5px] text-[#a04a34]">{errors.nombre}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-[#5d6470]">Tipo</label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {TYPE_OPTIONS.map((option) => {
                const isSelected = formData.tipo === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleChange('tipo', option.value)}
                    className="flex h-16 flex-col items-center justify-center gap-1 rounded-sm border transition-all"
                    style={
                      isSelected
                        ? { borderColor: formData.color, backgroundColor: `${formData.color}22` }
                        : { borderColor: '#ddd5c2', backgroundColor: '#fff' }
                    }
                  >
                    <span className="text-lg leading-none">{option.icon}</span>
                    <span className="text-[11px] leading-tight text-[#5d6470]">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-[#5d6470]">Ícono</label>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
              {ICON_OPTIONS.map((icon) => {
                const isSelected = formData.icono === icon;
                return (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => handleChange('icono', icon)}
                    className="flex h-11 items-center justify-center rounded-sm border text-xl transition-all"
                    style={
                      isSelected
                        ? { borderColor: formData.color, backgroundColor: `${formData.color}22` }
                        : { borderColor: '#ddd5c2', backgroundColor: '#fff' }
                    }
                  >
                    {icon}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-[#5d6470]">Color</label>
            <div className="grid grid-cols-8 gap-2 sm:grid-cols-10">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleChange('color', color)}
                  className={`h-8 rounded-sm border-2 transition-all ${
                    formData.color === color ? 'scale-105 border-[#20242c]' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-[#5d6470]">Descripción</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              rows={3}
              className="w-full resize-none rounded-sm border border-[#ddd5c2] bg-white px-3.5 py-2.5 text-[13.5px] text-foreground placeholder:text-[#8a8677] focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Descripción opcional"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <input
              id="metodo-pago-activo"
              type="checkbox"
              checked={formData.activo}
              onChange={(e) => handleChange('activo', e.target.checked)}
              className="h-4 w-4 rounded-sm border-[#ddd5c2] text-primary focus:ring-ring"
            />
            <label htmlFor="metodo-pago-activo" className="text-[13px] text-[#5d6470]">
              Método activo
            </label>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-sm border border-[#ddd5c2] bg-white px-4 py-2.5 text-[13.5px] font-medium text-foreground transition-colors duration-150 hover:bg-[#f0ead9]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex flex-1 items-center justify-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-[#4f7047]"
            >
              <Save className="h-4 w-4" />
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
