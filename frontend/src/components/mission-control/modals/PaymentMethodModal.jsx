import React, { useState, useEffect } from 'react';
import { X, Save, CreditCard } from 'lucide-react';

export const PaymentMethodModal = ({ isOpen, onClose, onSave, paymentMethod = null }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'tarjeta',
    color: '#3b82f6',
    icono: '💳',
    descripcion: '',
    activo: true
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (paymentMethod) {
      setFormData({
        nombre: paymentMethod.Nombre || paymentMethod.nombre || '',
        tipo: paymentMethod.Tipo || paymentMethod.tipo || 'tarjeta',
        color: paymentMethod.Color || paymentMethod.color || '#3b82f6',
        icono: paymentMethod.Icono || paymentMethod.icono || '💳',
        descripcion: paymentMethod.Descripcion || paymentMethod.descripcion || '',
        activo: paymentMethod.Activo !== undefined ? paymentMethod.Activo : (paymentMethod.activo !== undefined ? paymentMethod.activo : true)
      });
    } else {
      setFormData({
        nombre: '',
        tipo: 'tarjeta',
        color: '#3b82f6',
        icono: '💳',
        descripcion: '',
        activo: true
      });
    }
  }, [paymentMethod, isOpen]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  if (!isOpen) return null;

  const typeOptions = [
    { value: 'tarjeta', label: 'Tarjeta', icon: '💳' },
    { value: 'efectivo', label: 'Efectivo', icon: '💵' },
    { value: 'transferencia', label: 'Transferencia', icon: '🏦' },
    { value: 'debito', label: 'Débito', icon: '💰' },
    { value: 'credito', label: 'Crédito', icon: '💎' },
    { value: 'otro', label: 'Otro', icon: '📋' }
  ];

  const colorOptions = [
    '#3b82f6', '#059467', '#ef4444', '#f59e0b', '#8b5cf6',
    '#ec4899', '#10b981', '#f97316', '#06b6d4', '#84cc16'
  ];

  const iconOptions = ['💳', '💵', '🏦', '💰', '💎', '📋', '🪙', '💸', '🏧', '📱'];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-background border border-primary rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-white/10 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#3b82f6]/20 rounded-lg">
              <CreditCard className="w-6 h-6 text-[#3b82f6]" />
            </div>
            <h2 className="text-white text-xl font-bold">
              {paymentMethod ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.general && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {errors.general}
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary transition-colors"
              placeholder="ej., Tarjeta Visa, Efectivo, Transferencia"
            />
            {errors.nombre && <p className="text-red-400 text-sm mt-1">{errors.nombre}</p>}
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Tipo
            </label>
            <div className="grid grid-cols-3 gap-2">
              {typeOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange('tipo', option.value)}
                  className={`px-4 py-3 rounded-lg border transition-colors flex items-center gap-2 ${formData.tipo === option.value
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                >
                  <span className="text-xl">{option.icon}</span>
                  <span className="text-sm">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Color
            </label>
            <div className="grid grid-cols-10 gap-2">
              {colorOptions.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleChange('color', color)}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${formData.color === color ? 'border-white scale-110' : 'border-transparent'
                    }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Ícono */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Ícono
            </label>
            <div className="grid grid-cols-10 gap-2">
              {iconOptions.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => handleChange('icono', icon)}
                  className={`w-10 h-10 rounded-lg border transition-all text-2xl ${formData.icono === icon
                      ? 'bg-primary/20 border-primary scale-110'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary transition-colors resize-none"
              placeholder="Descripción opcional..."
            />
          </div>

          {/* Activo */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="activo"
              checked={formData.activo}
              onChange={(e) => handleChange('activo', e.target.checked)}
              className="w-5 h-5 rounded border-white/10 bg-white/5 text-primary focus:ring-primary focus:ring-offset-0"
            />
            <label htmlFor="activo" className="text-white text-sm">
              Activo
            </label>
          </div>

          {/* Acciones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

