import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Target, AlertCircle } from 'lucide-react';
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

  const prioridades = [
    { value: 'baja', label: 'Baja' },
    { value: 'media', label: 'Media' },
    { value: 'alta', label: 'Alta' }
  ];

  if (!isOpen) return null;

  const inputClass = (hasError) =>
    `w-full px-3.5 py-2.5 bg-white border ${hasError ? 'border-[#b83245] dark:border-[#e46876]' : 'border-[#c8bf91] dark:border-[#363646]'} rounded-sm text-foreground text-[13.5px] placeholder:text-[#625f55] focus:outline-none focus:ring-2 focus:ring-ring transition-colors duration-150 dark:bg-[#2a2a37] dark:placeholder:text-[#c8c093]`;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(32,36,44,.4)' }}
      onClick={(event) => event.target === event.currentTarget && handleClose()}
    >
      <div className="w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-[12px] border border-[#c8bf91] bg-[#e5ddb0] dark:border-[#363646] dark:bg-[#181820]">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#d5cea3] bg-[#e5ddb0] p-5 dark:border-[#363646] dark:bg-[#181820]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-[#e4d794] dark:bg-[#2a2a37]">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-serif text-[20px] font-bold text-foreground">
                {objetivo ? 'Editar objetivo' : 'Nuevo objetivo'}
              </h2>
              <p className="mt-0.5 text-[12.5px] text-[#43436c] dark:text-[#c8c093]">
                {objetivo ? 'Actualizá los detalles de tu meta' : 'Definí tu meta de ahorro'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-sm p-2 transition-colors duration-150 hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X className="h-5 w-5 text-[#625f55] dark:text-[#c8c093]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {errors.general && (
            <div className="flex items-start gap-3 rounded-sm border border-[#de9800] bg-[#f9d791] px-3 py-2.5 dark:border-[#e6c384] dark:bg-[rgba(230,195,132,0.14)]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#b83245] dark:text-[#e46876]" />
              <p className="text-[12.5px] text-[#b83245] dark:text-[#e46876]">{errors.general}</p>
            </div>
          )}

          {/* Nombre */}
          <label className="block text-[12.5px] text-[#43436c] dark:text-[#c8c093]">
            <span className="mb-1 block">
              Nombre del objetivo <span className="text-[#b83245] dark:text-[#e46876]">*</span>
            </span>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
              placeholder="ej. Viaje a Europa, Comprar auto..."
              className={inputClass(errors.nombre)}
            />
            {errors.nombre && <p className="mt-1 text-[12px] text-[#b83245] dark:text-[#e46876]">{errors.nombre}</p>}
          </label>

          {/* Tipo de objetivo */}
          <label className="block text-[12.5px] text-[#43436c] dark:text-[#c8c093]">
            <span className="mb-1 block">Tipo de objetivo</span>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData((prev) => ({ ...prev, tipo: e.target.value }))}
              className={inputClass(false)}
            >
              {tiposObjetivo.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.icon} {tipo.label}
                </option>
              ))}
            </select>
          </label>

          {/* Icono */}
          <div className="text-[12.5px] text-[#43436c] dark:text-[#c8c093]">
            <span className="mb-1 block">Icono</span>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
              {iconos.map((icono) => (
                <button
                  key={icono}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, icono }))}
                  className={`rounded-sm border p-2.5 text-xl transition-colors duration-150 ${
                    formData.icono === icono
                      ? 'border-primary bg-[#e4d794] dark:bg-[#2a2a37]'
                      : 'border-[#c8bf91] bg-white hover:bg-[#e4d794] dark:border-[#363646] dark:bg-[#181820] dark:hover:bg-[#2a2a37]'
                  }`}
                >
                  {icono}
                </button>
              ))}
            </div>
          </div>

          {/* Monto y moneda */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block text-[12.5px] text-[#43436c] dark:text-[#c8c093]">
              <span className="mb-1 block">
                Monto objetivo <span className="text-[#b83245] dark:text-[#e46876]">*</span>
              </span>
              <input
                type="number"
                step="0.01"
                value={formData.monto_objetivo}
                onChange={(e) => setFormData((prev) => ({ ...prev, monto_objetivo: e.target.value }))}
                placeholder="0.00"
                className={`${inputClass(errors.monto_objetivo)} font-mono`}
              />
              {errors.monto_objetivo && <p className="mt-1 text-[12px] text-[#b83245] dark:text-[#e46876]">{errors.monto_objetivo}</p>}
            </label>

            <label className="block text-[12.5px] text-[#43436c] dark:text-[#c8c093]">
              <span className="mb-1 block">Moneda</span>
              <select
                value={formData.moneda}
                onChange={(e) => setFormData((prev) => ({ ...prev, moneda: e.target.value }))}
                className={inputClass(false)}
              >
                <option value="ARS">ARS - Peso Argentino</option>
                <option value="USD">USD - Dólar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="BRL">BRL - Real Brasileño</option>
                <option value="GBP">GBP - Libra Esterlina</option>
              </select>
            </label>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block text-[12.5px] text-[#43436c] dark:text-[#c8c093]">
              <span className="mb-1 block">Fecha de inicio</span>
              <input
                type="date"
                value={formData.fecha_inicio}
                onChange={(e) => setFormData((prev) => ({ ...prev, fecha_inicio: e.target.value }))}
                className={`${inputClass(false)} font-mono`}
              />
            </label>

            <label className="block text-[12.5px] text-[#43436c] dark:text-[#c8c093]">
              <span className="mb-1 block">Fecha objetivo (meta)</span>
              <input
                type="date"
                value={formData.fecha_objetivo}
                onChange={(e) => setFormData((prev) => ({ ...prev, fecha_objetivo: e.target.value }))}
                className={`${inputClass(false)} font-mono`}
              />
            </label>
          </div>

          {/* Prioridad */}
          <div className="text-[12.5px] text-[#43436c] dark:text-[#c8c093]">
            <span className="mb-1 block">Prioridad</span>
            <div className="grid grid-cols-3 gap-2.5">
              {prioridades.map((prioridad) => (
                <button
                  key={prioridad.value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, prioridad: prioridad.value }))}
                  className={`rounded-sm border px-3 py-2.5 text-[13px] transition-colors duration-150 ${
                    formData.prioridad === prioridad.value
                      ? 'border-primary bg-[#e4d794] font-semibold text-foreground dark:bg-[#2a2a37]'
                      : 'border-[#c8bf91] bg-white text-[#43436c] hover:bg-[#e4d794] dark:border-[#363646] dark:bg-[#181820] dark:text-[#c8c093] dark:hover:bg-[#2a2a37]'
                  }`}
                >
                  {prioridad.label}
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <label className="block text-[12.5px] text-[#43436c] dark:text-[#c8c093]">
            <span className="mb-1 block">Descripción</span>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData((prev) => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Describe tu objetivo..."
              rows={3}
              className={`${inputClass(false)} resize-none`}
            />
          </label>

          {/* Notas */}
          <label className="block text-[12.5px] text-[#43436c] dark:text-[#c8c093]">
            <span className="mb-1 block">Notas adicionales</span>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData((prev) => ({ ...prev, notas: e.target.value }))}
              placeholder="Notas, observaciones o recordatorios..."
              rows={2}
              className={`${inputClass(false)} resize-none`}
            />
          </label>

          {/* Buttons */}
          <div className="flex flex-col justify-end gap-3 border-t border-[#d5cea3] pt-4 dark:border-[#363646] sm:flex-row">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="w-full rounded-sm border border-[#c8bf91] bg-white px-[15px] py-[8px] text-[13px] text-foreground transition-colors duration-150 hover:bg-[#e4d794] disabled:opacity-50 dark:border-[#363646] dark:bg-[#2a2a37] dark:hover:bg-[#363646] sm:w-auto"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex w-full items-center justify-center gap-2 rounded-sm bg-primary px-[15px] py-[8px] text-[13px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-[#5f7841] disabled:opacity-50 dark:hover:bg-[#76946a] sm:w-auto"
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#e5ddb0] border-t-transparent dark:border-[#1f1f28]" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {objetivo ? 'Actualizar' : 'Crear objetivo'}
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
