import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, Save, Calendar, DollarSign, Tag, FileText } from 'lucide-react';

/**
 * PendingPaymentModal - Modal para crear/editar pagos pendientes
 */
export const PendingPaymentModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  payment = null,
  categories = []
}) => {
  const [formData, setFormData] = useState({
    nombre: '',
    monto: '',
    moneda: 'ARS',
    fecha_vencimiento: '',
    categoria_id: '',
    descripcion: '',
    comprobante: ''
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (payment && isOpen) {
      console.log('📝 Cargando pago para editar:', payment);
      setFormData({
        nombre: payment.nombre || payment.Nombre || '',
        monto: payment.monto || payment.Monto || '',
        moneda: payment.moneda || payment.Moneda || 'ARS',
        fecha_vencimiento: payment.fechaVencimiento || payment.fecha_vencimiento || payment.Fechavencimiento || '',
        categoria_id: payment.categoria_id || payment.categorias_id || '',
        descripcion: payment.descripcion || payment.Descripcion || '',
        comprobante: payment.comprobante || payment.Comprobante || ''
      });
    } else if (!payment && isOpen) {
      // Resetear para nuevo
      setFormData({
        nombre: '',
        monto: '',
        moneda: 'ARS',
        fecha_vencimiento: new Date().toISOString().split('T')[0],
        categoria_id: '',
        descripcion: '',
        comprobante: ''
      });
    }
  }, [payment, isOpen]);

  // Block scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error en submit:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        className="bg-[#18181b] rounded-3xl border border-white/10 w-full max-w-2xl shadow-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">
            {payment ? 'Editar Pago Pendiente' : 'Nuevo Pago Pendiente'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Nombre del Pago
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              placeholder="Ej: Netflix, Alquiler, Luz"
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#10b981]/50"
              required
            />
          </div>

          {/* Monto y Moneda */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Monto
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.monto}
                onChange={(e) => setFormData({...formData, monto: e.target.value})}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#10b981]/50"
                required
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Moneda</label>
              <select
                value={formData.moneda}
                onChange={(e) => setFormData({...formData, moneda: e.target.value})}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-white focus:outline-none"
              >
                <option value="ARS">ARS - Pesos</option>
                <option value="USD">USD - Dólares</option>
                <option value="EUR">EUR - Euros</option>
              </select>
            </div>
          </div>

          {/* Fecha de Vencimiento */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Fecha de Vencimiento
            </label>
            <input
              type="date"
              value={formData.fecha_vencimiento}
              onChange={(e) => setFormData({...formData, fecha_vencimiento: e.target.value})}
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-white focus:outline-none"
              required
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Categoría
            </label>
            <select
              value={formData.categoria_id}
              onChange={(e) => setFormData({...formData, categoria_id: e.target.value})}
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-white focus:outline-none"
            >
              <option value="">Sin categoría</option>
              {categories.map(cat => (
                <option key={cat.id || cat.Id} value={cat.id || cat.Id}>
                  {cat.nombre || cat.Nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Descripción */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Descripción / Notas</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              placeholder="Detalles adicionales (opcional)"
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none"
              rows={3}
            />
          </div>

          {/* Comprobante URL */}
          {formData.comprobante && (
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Comprobante</label>
              <a 
                href={formData.comprobante}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#10b981] hover:underline flex items-center gap-1"
              >
                <FileText className="w-4 h-4" />
                Ver archivo adjunto
              </a>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-white hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#10b981] to-[#34d399] rounded-xl text-white font-medium hover:shadow-lg transition-all disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

PendingPaymentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  payment: PropTypes.object,
  categories: PropTypes.array
};
