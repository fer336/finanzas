import { useState } from 'react';
import PropTypes from 'prop-types';
import { Plus, Home, Plane, Car, Target, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import { useRefresh } from '../../../hooks/useRefresh';
import { QUERY_KEYS } from '../../../hooks/useFinancialData';
import { useAmountVisibility } from '../../../contexts/AmountVisibilityContext';
import ConfirmModal from '../common/ConfirmModal';

const ICONS = { Home, Plane, Car };

const parseDateSafe = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const ModernObjetivosView = ({ objetivos = [], onNewObjetivo, onEditObjetivo, onDeleteObjetivo, onAportar }) => {
  const { refresh, isRefreshing } = useRefresh([QUERY_KEYS.objetivos]);
  const { formatAmount } = useAmountVisibility();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [objetivoToDelete, setObjetivoToDelete] = useState(null);

  // Normalizar objetivos del API (soporta variantes de casing del backend).
  const data = objetivos.map((obj) => {
    const montoObjetivo = parseFloat(obj.monto_objetivo || obj.MontoObjetivo || obj.montoObjetivo || 0);
    const montoActual = parseFloat(obj.monto_actual || obj.MontoActual || obj.montoActual || 0);
    const porcentaje = montoObjetivo > 0 ? Math.round((montoActual / montoObjetivo) * 100) : 0;
    const fechaObjetivo = obj.fecha_objetivo || obj.FechaObjetivo || obj.fechaObjetivo || null;

    return {
      id: obj.id || obj.Id,
      nombre: obj.nombre || obj.Nombre,
      montoObjetivo,
      montoActual,
      porcentaje,
      icono: obj.icono || obj.Icono || 'Home',
      fechaObjetivo,
    };
  });

  const handleDeleteConfirm = () => {
    if (objetivoToDelete) onDeleteObjetivo && onDeleteObjetivo(objetivoToDelete.id);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1100px] px-4 py-5 sm:px-[34px] sm:py-[28px]">
        <div className="mb-4 flex items-end justify-between gap-3 border-b-[3px] border-double border-[#cfc6ae] pb-3 sm:mb-[22px] sm:pb-[18px]">
          <h1 className="font-serif text-[26px] font-bold leading-none text-foreground sm:text-[42px]">Objetivos</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 rounded-sm border border-[#ddd5c2] bg-white px-3 py-[7px] font-sans text-[13px] text-foreground transition-colors duration-150 hover:bg-[#f0ead9] disabled:opacity-50"
              title="Actualizar objetivos"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isRefreshing ? 'Actualizando…' : 'Actualizar'}</span>
            </button>
            <button
              type="button"
              onClick={onNewObjetivo}
              className="flex items-center gap-1.5 rounded-sm bg-primary px-3.5 py-[7px] font-sans text-[13px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-[#4f7047]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nuevo objetivo</span>
            </button>
          </div>
        </div>

        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-[#ddd5c2] bg-card py-14 text-center">
            <p className="text-[13.5px] italic text-muted-foreground">Sin objetivos activos</p>
            <button
              type="button"
              onClick={onNewObjetivo}
              className="rounded-sm border border-[#ddd5c2] bg-white px-4 py-[9px] font-sans text-[13px] font-medium text-foreground transition-colors duration-150 hover:bg-[#f0ead9]"
            >
              Crear objetivo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {data.map((obj) => {
              const Icon = ICONS[obj.icono] || Target;
              const fechaMeta = parseDateSafe(obj.fechaObjetivo);

              return (
                <div key={obj.id} className="rounded-md border border-[#ddd5c2] bg-card p-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#f0ead9]">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="truncate font-serif text-[17px] font-semibold text-foreground">{obj.nombre}</h3>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => onEditObjetivo && onEditObjetivo(obj)}
                        className="rounded-sm p-1.5 text-[#8a8677] transition-colors hover:bg-black/5 hover:text-foreground"
                        title="Editar objetivo"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setObjetivoToDelete(obj); setShowDeleteConfirm(true); }}
                        className="rounded-sm p-1.5 text-[#8a8677] transition-colors hover:bg-black/5 hover:text-[#a04a34]"
                        title="Eliminar objetivo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[12px] text-[#8a8677]">Progreso</span>
                    <span className="font-mono text-[13px] font-semibold text-primary">{obj.porcentaje}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: '#e7e0cf' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(obj.porcentaje, 100)}%`, background: '#5a7d52' }}
                    />
                  </div>

                  <div className="mt-4 flex items-baseline justify-between font-mono text-[13.5px]">
                    <span className="font-semibold text-foreground">{formatAmount(obj.montoActual, { decimals: 0 })}</span>
                    <span className="text-[#8a8677]">/ {formatAmount(obj.montoObjetivo, { decimals: 0 })}</span>
                  </div>

                  <div className="mt-1.5 font-mono text-[11px] text-[#8a8677]">
                    {fechaMeta ? `Meta: ${fechaMeta.toLocaleDateString('es-AR')}` : <span className="italic">Sin fecha meta</span>}
                  </div>

                  <button
                    type="button"
                    onClick={() => onAportar && onAportar(obj)}
                    className="mt-4 w-full rounded-sm bg-primary px-4 py-2 font-sans text-[13px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-[#4f7047]"
                  >
                    Aportar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setObjetivoToDelete(null); }}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar objetivo?"
        message={`¿Estás seguro de eliminar "${objetivoToDelete?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

ModernObjetivosView.propTypes = {
  objetivos: PropTypes.array,
  onNewObjetivo: PropTypes.func,
  onEditObjetivo: PropTypes.func,
  onDeleteObjetivo: PropTypes.func,
  onAportar: PropTypes.func,
};

export default ModernObjetivosView;
