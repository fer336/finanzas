import { useEffect, useState } from 'react';
import { FolderOpen, Save, X } from 'lucide-react';
import { CATEGORY_ICON_OPTIONS } from '../categoryIcons';

/**
 * CategoryModal — alta/edición de categoría, tema "Kanagawa" (ver
 * design_handoff_rediseno_papel/README.md "Interactions & Behavior":
 * "modal fondo #e5ddb0, overlay rgba(32,36,44,.4), radius 12px").
 * El picker de íconos usa el set curado reicon-react de
 * ../categoryIcons — `icono` guarda el `name` del ícono elegido
 * (string libre igual que antes, cuando guardaba un emoji).
 */
export const CategoryModal = ({ isOpen, onClose, onSave, category = null }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'gasto',
    color: 'var(--success)',
    icono: CATEGORY_ICON_OPTIONS[0].name,
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
        color: category.Color || category.color || 'var(--success)',
        icono: category.Icono || category.icono || CATEGORY_ICON_OPTIONS[0].name,
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
        color: 'var(--success)',
        icono: CATEGORY_ICON_OPTIONS[0].name,
        descripcion: '',
        activa: true,
      });
    }

    setErrors({});
  }, [category, isOpen]);

  if (!isOpen) return null;

  const colorOptions = [
    'var(--success)', 'var(--success)', 'var(--destructive)', 'var(--destructive)', 'var(--info)',
    'var(--violet)', '#f9d791', 'var(--warning)', 'var(--muted-foreground)', '#43436c',
    'var(--foreground)', '#6b8e7a', '#c17a52', '#4a7a9d', '#a37fb8',
  ];

  const typeOptions = [
    { value: 'gasto', label: 'Gasto' },
    { value: 'ingreso', label: 'Ingreso' },
  ];

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.nombre.trim()) nextErrors.nombre = 'El nombre es requerido';
    if (!formData.icono) nextErrors.icono = 'Elegí un ícono';
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: 'rgba(32,36,44,.4)' }}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#c8bf91] bg-[#e5ddb0] dark:border-[#363646] dark:bg-[#181820]">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#c8bf91] bg-[#e5ddb0] px-5 py-4 sm:px-6 dark:border-[#363646] dark:bg-[#181820]">
          <div className="flex items-center gap-3">
            <div className="rounded-sm bg-[#e4d794] p-2 dark:bg-[#2a2a37]">
              <FolderOpen className="h-5 w-5 text-primary" />
            </div>
            <h2 className="font-serif text-[19px] font-bold text-foreground sm:text-[21px]">
              {category ? 'Editar categoría' : 'Nueva categoría'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm p-2 text-[#625f55] transition-colors hover:bg-black/5 hover:text-foreground dark:text-[#c8c093] dark:hover:bg-white/5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-[#43436c] dark:text-[#c8c093]">Nombre *</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              className="w-full rounded-sm border border-[#c8bf91] bg-white px-3.5 py-2.5 text-[13.5px] text-foreground placeholder:text-[#625f55] focus:outline-none focus:ring-2 focus:ring-ring dark:border-[#363646] dark:bg-[#2a2a37] dark:placeholder:text-[#c8c093]"
              placeholder="Ej: Combustible"
            />
            {errors.nombre && <p className="mt-1 text-[11.5px] text-[#b83245] dark:text-[#e46876]">{errors.nombre}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-[#43436c] dark:text-[#c8c093]">Tipo</label>
            <div className="inline-flex items-center gap-[3px] rounded-full border border-[#c8bf91] bg-card p-[3px] dark:border-[#363646]">
              {typeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange('tipo', option.value)}
                  className={`rounded-full px-4 py-1.5 font-mono text-[12px] transition-colors duration-150 ${
                    formData.tipo === option.value
                      ? 'bg-[#4d699b] font-semibold text-[#e5ddb0]'
                      : 'text-[#43436c] hover:text-foreground dark:text-[#c8c093]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-[#43436c] dark:text-[#c8c093]">Ícono</label>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
              {CATEGORY_ICON_OPTIONS.map(({ name, label, Icon }) => {
                const isSelected = formData.icono === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleChange('icono', name)}
                    title={label}
                    className="flex h-11 items-center justify-center rounded-sm border transition-all"
                    style={
                      isSelected
                        ? { borderColor: formData.color, backgroundColor: `${formData.color}22` }
                        : { borderColor: 'var(--border)', backgroundColor: 'var(--secondary)' }
                    }
                  >
                    <Icon size={18} color={isSelected ? formData.color : '#43436c'} />
                  </button>
                );
              })}
            </div>
            {errors.icono && <p className="mt-1 text-[11.5px] text-[#b83245] dark:text-[#e46876]">{errors.icono}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-[#43436c] dark:text-[#c8c093]">Color</label>
            <div className="grid grid-cols-8 gap-2 sm:grid-cols-10">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleChange('color', color)}
                  className={`h-8 rounded-sm border-2 transition-all ${
                    formData.color === color ? 'scale-105 border-[#545464] dark:border-[#dcd7ba]' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            {errors.color && <p className="mt-1 text-[11.5px] text-[#b83245] dark:text-[#e46876]">{errors.color}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-[#43436c] dark:text-[#c8c093]">Descripción</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              rows={3}
              className="w-full resize-none rounded-sm border border-[#c8bf91] bg-white px-3.5 py-2.5 text-[13.5px] text-foreground placeholder:text-[#625f55] focus:outline-none focus:ring-2 focus:ring-ring dark:border-[#363646] dark:bg-[#2a2a37] dark:placeholder:text-[#c8c093]"
              placeholder="Descripción opcional"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <input
              id="categoria-activa"
              type="checkbox"
              checked={formData.activa}
              onChange={(e) => handleChange('activa', e.target.checked)}
              className="h-4 w-4 rounded-sm border-[#c8bf91] text-primary focus:ring-ring dark:border-[#363646]"
            />
            <label htmlFor="categoria-activa" className="text-[13px] text-[#43436c] dark:text-[#c8c093]">
              Categoría activa
            </label>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-sm border border-[#c8bf91] bg-white px-4 py-2.5 text-[13.5px] font-medium text-foreground transition-colors duration-150 hover:bg-[#e4d794] dark:border-[#363646] dark:bg-[#2a2a37] dark:hover:bg-[#363646]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex flex-1 items-center justify-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-[#5f7841] dark:hover:bg-[#76946a]"
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
