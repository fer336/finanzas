import React, { useEffect, useState } from 'react';
import { FolderOpen, Save, X } from 'lucide-react';

export const CategoryModal = ({ isOpen, onClose, onSave, category = null }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'gasto',
    color: '#10b981',
    icono: '📁',
    descripcion: '',
    activa: true,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;

    if (category) {
      setFormData({
        nombre: category.Nombre || category.nombre || '',
        tipo: category.Tipo || category.tipo || 'gasto',
        color: category.Color || category.color || '#10b981',
        icono: category.Icono || category.icono || '📁',
        descripcion: category.Descripcion || category.descripcion || '',
        activa:
          category.Activa !== undefined
            ? category.Activa
            : category.activa !== undefined
              ? category.activa
              : true,
      });
    } else {
      setFormData({
        nombre: '',
        tipo: 'gasto',
        color: '#10b981',
        icono: '📁',
        descripcion: '',
        activa: true,
      });
    }

    setErrors({});
  }, [category, isOpen]);

  if (!isOpen) return null;

  const emojiOptions = [
    '📁', '🛒', '🚗', '⛽', '💡', '🏠', '🍔', '💊', '🎬', '📚',
    '💼', '💰', '📈', '🏦', '🎯', '✈️', '👕', '🐾', '🧾', '📦',
  ];

  const colorOptions = [
    '#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1',
    '#8b5cf6', '#ec4899', '#f43f5e', '#ef4444', '#f97316',
    '#f59e0b', '#84cc16', '#22c55e', '#64748b', '#94a3b8',
  ];

  const typeOptions = [
    { value: 'gasto', label: 'Gasto', icon: '📉' },
    { value: 'ingreso', label: 'Ingreso', icon: '📈' },
  ];

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.nombre.trim()) nextErrors.nombre = 'El nombre es requerido';
    if (!formData.icono) nextErrors.icono = 'Elegí un emoji';
    if (!formData.color) nextErrors.color = 'Elegí un color';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    await onSave({
      nombre: formData.nombre.trim(),
      tipo: formData.tipo,
      color: formData.color,
      icono: formData.icono,
      descripcion: formData.descripcion.trim(),
      activa: formData.activa,
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#18181b]">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-[#18181b] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-cyan-500/20 p-2">
              <FolderOpen className="h-5 w-5 text-cyan-400" />
            </div>
            <h2 className="text-lg font-bold text-white sm:text-xl">
              {category ? 'Editar Categoría' : 'Nueva Categoría'}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 transition-colors hover:bg-white/10">
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">Nombre *</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-cyan-500 focus:outline-none"
              placeholder="Ej: Combustible"
            />
            {errors.nombre && <p className="mt-1 text-xs text-red-400">{errors.nombre}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              {typeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange('tipo', option.value)}
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                    formData.tipo === option.value
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                      : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {option.icon} {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">Emoji</label>
            <div className="grid grid-cols-10 gap-2 sm:grid-cols-12">
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleChange('icono', emoji)}
                  className={`h-10 rounded-lg border text-xl transition-all ${
                    formData.icono === emoji
                      ? 'scale-105 border-cyan-500 bg-cyan-500/20'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            {errors.icono && <p className="mt-1 text-xs text-red-400">{errors.icono}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">Color</label>
            <div className="grid grid-cols-8 gap-2 sm:grid-cols-10">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleChange('color', color)}
                  className={`h-9 rounded-lg border-2 transition-all ${
                    formData.color === color ? 'scale-105 border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            {errors.color && <p className="mt-1 text-xs text-red-400">{errors.color}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">Descripción</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-cyan-500 focus:outline-none"
              placeholder="Descripción opcional"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              id="categoria-activa"
              type="checkbox"
              checked={formData.activa}
              onChange={(e) => handleChange('activa', e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-white/10 text-cyan-500"
            />
            <label htmlFor="categoria-activa" className="text-sm text-white/80">
              Categoría activa
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white transition-colors hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-cyan-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-cyan-600 flex items-center justify-center gap-2"
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
