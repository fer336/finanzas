import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, DollarSign, Palette, Eye, AlertCircle } from 'lucide-react';

/**
 * Modal para agregar/editar monedas personalizadas
 * @param {boolean} isOpen - Si el modal está visible
 * @param {Function} onClose - Callback al cerrar
 * @param {Function} onSave - Callback al guardar
 * @param {Object} currency - Moneda a editar (null para nueva)
 */
export const CurrencyModal = ({ isOpen, onClose, onSave, currency = null }) => {
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    simbolo: '',
    icono: 'DollarSign',
    color: 'from-blue-500 to-cyan-500',
    activa: true
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Iconos disponibles (Lucide React)
  const iconOptions = [
    { value: 'DollarSign', label: '💵 Dollar Sign', emoji: '💵' },
    { value: 'Euro', label: '💶 Euro', emoji: '💶' },
    { value: 'PoundSterling', label: '💷 Pound', emoji: '💷' },
    { value: 'BanknoteIcon', label: '💴 Banknote', emoji: '💴' },
    { value: 'Bitcoin', label: '₿ Bitcoin', emoji: '₿' },
    { value: 'Coins', label: '🪙 Coins', emoji: '🪙' },
    { value: 'Wallet', label: '👛 Wallet', emoji: '👛' },
    { value: 'CreditCard', label: '💳 Card', emoji: '💳' }
  ];

  // Colores disponibles (gradients)
  const colorOptions = [
    { value: 'from-blue-500 to-cyan-500', label: 'Azul',label2: 'Cyan' },
    { value: 'from-green-500 to-emerald-500', label: 'Verde', label2: 'Esmeralda' },
    { value: 'from-purple-500 to-pink-500', label: 'Púrpura', label2: 'Rosa' },
    { value: 'from-yellow-500 to-orange-500', label: 'Amarillo', label2: 'Naranja' },
    { value: 'from-indigo-500 to-violet-500', label: 'Índigo', label2: 'Violeta' },
    { value: 'from-red-500 to-rose-500', label: 'Rojo', label2: 'Rosado' },
    { value: 'from-teal-500 to-cyan-500', label: 'Teal', label2: 'Cyan' },
    { value: 'from-amber-500 to-yellow-500', label: 'Ámbar', label2: 'Amarillo' }
  ];

  useEffect(() => {
    if (currency) {
      setFormData({
        codigo: currency.codigo || '',
        nombre: currency.nombre || '',
        simbolo: currency.simbolo || '',
        icono: currency.icono || 'DollarSign',
        color: currency.color || 'from-blue-500 to-cyan-500',
        activa: currency.activa !== undefined ? currency.activa : true
      });
    } else {
      setFormData({
        codigo: '',
        nombre: '',
        simbolo: '',
        icono: 'DollarSign',
        color: 'from-blue-500 to-cyan-500',
        activa: true
      });
    }
    setErrors({});
  }, [currency, isOpen]);

  const validate = () => {
    const newErrors = {};

    if (!formData.codigo || formData.codigo.trim().length === 0) {
      newErrors.codigo = 'El código es obligatorio';
    } else if (formData.codigo.length > 10) {
      newErrors.codigo = 'El código debe tener máximo 10 caracteres';
    } else if (!/^[A-Z]{3,10}$/.test(formData.codigo)) {
      newErrors.codigo = 'El código debe ser 3-10 letras mayúsculas (ej: USD, BTC)';
    }

    if (!formData.nombre || formData.nombre.trim().length === 0) {
      newErrors.nombre = 'El nombre es obligatorio';
    }

    if (!formData.simbolo || formData.simbolo.trim().length === 0) {
      newErrors.simbolo = 'El símbolo es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving currency:', error);
      setErrors({ submit: error.message || 'Error al guardar la moneda' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-br from-zinc-900 to-zinc-800 border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <DollarSign className="w-6 h-6 text-cyan-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {currency ? 'Editar Moneda' : 'Nueva Moneda'}
              </h2>
              <p className="text-sm text-zinc-400">
                {currency ? 'Modifica los datos de la moneda' : 'Agrega una moneda personalizada'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Preview Card */}
          <div className="glass-panel p-4 bg-gradient-to-br ${formData.color} bg-opacity-10">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${formData.color} bg-opacity-20`}>
                <span className="text-2xl">
                  {iconOptions.find(i => i.value === formData.icono)?.emoji || '💵'}
                </span>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Vista previa</p>
                <p className="text-lg font-bold text-white">
                  {formData.codigo || 'XXX'} - {formData.nombre || 'Nombre'}
                </p>
                <p className="text-sm text-zinc-400">
                  Símbolo: {formData.simbolo || '?'}
                </p>
              </div>
            </div>
          </div>

          {/* Código */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Código ISO <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.codigo}
              onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value.toUpperCase() }))}
              placeholder="USD, EUR, BTC..."
              maxLength={10}
              className={`w-full px-4 py-3 bg-white/5 border ${
                errors.codigo ? 'border-red-500/50' : 'border-white/10'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white placeholder-zinc-500`}
            />
            {errors.codigo && (
              <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.codigo}
              </p>
            )}
            <p className="mt-1 text-xs text-zinc-500">
              Código de 3-10 letras mayúsculas (ej: USD, EUR, BTC, USDT)
            </p>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Nombre <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              placeholder="Dólar Estadounidense, Bitcoin..."
              className={`w-full px-4 py-3 bg-white/5 border ${
                errors.nombre ? 'border-red-500/50' : 'border-white/10'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white placeholder-zinc-500`}
            />
            {errors.nombre && (
              <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.nombre}
              </p>
            )}
          </div>

          {/* Símbolo */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Símbolo <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.simbolo}
              onChange={(e) => setFormData(prev => ({ ...prev, simbolo: e.target.value }))}
              placeholder="$, €, £, ₿..."
              maxLength={10}
              className={`w-full px-4 py-3 bg-white/5 border ${
                errors.simbolo ? 'border-red-500/50' : 'border-white/10'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white placeholder-zinc-500`}
            />
            {errors.simbolo && (
              <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.simbolo}
              </p>
            )}
          </div>

          {/* Icono y Color */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Icono */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Icono
              </label>
              <select
                value={formData.icono}
                onChange={(e) => setFormData(prev => ({ ...prev, icono: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white"
              >
                {iconOptions.map(icon => (
                  <option key={icon.value} value={icon.value}>
                    {icon.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Color
              </label>
              <select
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white"
              >
                {colorOptions.map(color => (
                  <option key={color.value} value={color.value}>
                    {color.label} → {color.label2}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error de submit */}
          {errors.submit && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {errors.submit}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors border border-zinc-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl font-bold transition-all shadow-lg shadow-cyan-500/30 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Moneda
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

