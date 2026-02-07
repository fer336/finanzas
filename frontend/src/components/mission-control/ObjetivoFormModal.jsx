import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Target, DollarSign, Calendar, Tag, AlertCircle } from 'lucide-react';
import apiServices from '../../services/api';

const ObjetivoFormModal = ({ isOpen, onClose, onSuccess, objetivo = null, categorias = [] }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    monto_objetivo: '',
    moneda: 'ARS',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_objetivo: '',
    icono: '🎯',
    tipo: 'otro',
    prioridad: 'media',
    notas: '',
    categoria_id: ''
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (objetivo) {
      setFormData({
        nombre: objetivo.nombre || '',
        descripcion: objetivo.descripcion || '',
        monto_objetivo: objetivo.monto_objetivo || '',
        moneda: objetivo.moneda || 'ARS',
        fecha_inicio: objetivo.fecha_inicio || new Date().toISOString().split('T')[0],
        fecha_objetivo: objetivo.fecha_objetivo || '',
        icono: objetivo.icono || '🎯',
        tipo: objetivo.tipo || 'otro',
        prioridad: objetivo.prioridad || 'media',
        notas: objetivo.notas || '',
        categoria_id: objetivo.categoria_id || ''
      });
    }
  }, [objetivo]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre || formData.nombre.trim() === '') {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.monto_objetivo || parseFloat(formData.monto_objetivo) <= 0) {
      newErrors.monto_objetivo = 'El monto debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      const dataToSave = {
        ...formData,
        monto_objetivo: parseFloat(formData.monto_objetivo),
        categoria_id: formData.categoria_id || null
      };

      if (objetivo) {
        await apiServices.objetivosApi.update(objetivo.id, dataToSave);
      } else {
        await apiServices.objetivosApi.create(dataToSave);
      }

      onSuccess && onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error saving objetivo:', error);
      setErrors({ general: 'Error al guardar el objetivo: ' + error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      monto_objetivo: '',
      moneda: 'ARS',
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_objetivo: '',
      icono: '🎯',
      tipo: 'otro',
      prioridad: 'media',
      notas: '',
      categoria_id: ''
    });
    setErrors({});
    onClose();
  };

  const tiposObjetivo = [
    { value: 'viaje', label: 'Viaje', icon: '✈️' },
    { value: 'compra', label: 'Compra', icon: '🛒' },
    { value: 'inversion', label: 'Inversión', icon: '📈' },
    { value: 'emergencia', label: 'Emergencia', icon: '🚨' },
    { value: 'educacion', label: 'Educación', icon: '🎓' },
    { value: 'casa', label: 'Casa', icon: '🏠' },
    { value: 'auto', label: 'Auto', icon: '🚗' },
    { value: 'otro', label: 'Otro', icon: '🎯' }
  ];

  const iconos = ['🎯', '✈️', '🏠', '🚗', '💻', '📱', '🎓', '💰', '📈', '🏖️', '🎉', '💍', '🎮', '⚽', '🎸', '📷'];

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-[#09090b] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#09090b]/95 backdrop-blur-sm border-b border-white/10 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {objetivo ? 'Editar Objetivo' : 'Nuevo Objetivo'}
                </h2>
                <p className="text-sm text-zinc-500">
                  {objetivo ? 'Actualiza los detalles de tu meta' : 'Define tu meta de ahorro'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Error general */}
          {errors.general && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Nombre del Objetivo <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              placeholder="ej. Viaje a Europa, Comprar auto..."
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 border ${
                errors.nombre ? 'border-red-500/50' : 'border-white/10'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white placeholder-zinc-500 text-sm sm:text-base`}
            />
            {errors.nombre && <p className="mt-1 text-sm text-red-400">{errors.nombre}</p>}
          </div>

          {/* Tipo de Objetivo */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Tipo de Objetivo
            </label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white"
            >
              {tiposObjetivo.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.icon} {tipo.label}
                </option>
              ))}
            </select>
          </div>

          {/* Icono */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Icono
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
              {iconos.map((icono) => (
                <button
                  key={icono}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, icono }))}
                  className={`p-3 text-2xl rounded-lg border transition-all ${
                    formData.icono === icono
                      ? 'bg-cyan-500/20 border-cyan-500/50 scale-110'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {icono}
                </button>
              ))}
            </div>
          </div>

          {/* Monto y Moneda */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Monto Objetivo <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.monto_objetivo}
                onChange={(e) => setFormData(prev => ({ ...prev, monto_objetivo: e.target.value }))}
                placeholder="0.00"
                className={`w-full px-4 py-3 bg-white/5 border ${
                  errors.monto_objetivo ? 'border-red-500/50' : 'border-white/10'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white placeholder-zinc-500`}
              />
              {errors.monto_objetivo && (
                <p className="mt-1 text-sm text-red-400">{errors.monto_objetivo}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Moneda
              </label>
              <select
                value={formData.moneda}
                onChange={(e) => setFormData(prev => ({ ...prev, moneda: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white"
              >
                <option value="ARS">ARS - Peso Argentino</option>
                <option value="USD">USD - Dólar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="BRL">BRL - Real Brasileño</option>
                <option value="GBP">GBP - Libra Esterlina</option>
              </select>
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Fecha de Inicio
              </label>
              <input
                type="date"
                value={formData.fecha_inicio}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Fecha Objetivo (Meta)
              </label>
              <input
                type="date"
                value={formData.fecha_objetivo}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha_objetivo: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white"
              />
            </div>
          </div>

          {/* Prioridad */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Prioridad
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'baja', label: 'Baja', color: 'bg-gray-500/20 border-gray-500/30 text-gray-400' },
                { value: 'media', label: 'Media', color: 'bg-blue-500/20 border-blue-500/30 text-blue-400' },
                { value: 'alta', label: 'Alta', color: 'bg-red-500/20 border-red-500/30 text-red-400' }
              ].map((prioridad) => (
                <button
                  key={prioridad.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, prioridad: prioridad.value }))}
                  className={`px-4 py-3 rounded-lg border transition-all ${
                    formData.prioridad === prioridad.value
                      ? prioridad.color
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                  }`}
                >
                  {prioridad.label}
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
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Describe tu objetivo..."
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white placeholder-zinc-500 resize-none"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Notas Adicionales
            </label>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
              placeholder="Notas, observaciones o recordatorios..."
              rows={2}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white placeholder-zinc-500 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors disabled:opacity-50 text-sm sm:text-base"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-400 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {objetivo ? 'Actualizar' : 'Crear Objetivo'}
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

export default ObjetivoFormModal;

