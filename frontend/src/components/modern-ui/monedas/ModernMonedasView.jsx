import { Plus, Edit, Trash2, Eye, EyeOff, RefreshCw } from 'lucide-react';
import PropTypes from 'prop-types';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import KpiCard from '../common/KpiCard';
import { useRefresh } from '../../../hooks/useRefresh';
import { QUERY_KEYS } from '../../../hooks/useFinancialData';

/**
 * ModernMonedasView — tab "Monedas" dentro de Inversiones (tema "Papel").
 * Se renderiza embebido en ModernInversionesView. Ver
 * design_handoff_rediseno_papel/README.md sección "6. Inversiones".
 *
 * Desvío del spec: el drag handle de reordenamiento de la versión anterior
 * no estaba conectado a lógica real (onReorder solo hacía console.log), así
 * que se retira en el restyle — no había funcionalidad que preservar.
 */
const ModernMonedasView = ({
  monedas = [],
  onNewMoneda,
  onEditMoneda,
  onDeleteMoneda,
  onToggleActive,
  onInitializeDefault,
}) => {
  const { refresh, isRefreshing } = useRefresh([QUERY_KEYS.monedas]);

  // Normalizar monedas del backend
  const normalizedMonedas = monedas.map((m) => ({
    id: m.id || m.Id,
    codigo: m.codigo || m.Codigo || 'N/A',
    nombre: m.nombre || m.Nombre || 'Sin nombre',
    simbolo: m.simbolo || m.Simbolo || '$',
    activa: m.activa !== undefined ? m.activa : (m.Activa !== undefined ? m.Activa : true),
    esPredeterminada: m.es_predeterminada || m.EsPredeterminada || false,
    tasaCambioARS: parseFloat(m.tasa_cambio_a_ars || m.TasaCambioARS || 1),
    orden: m.orden || m.Orden || 0,
  }));

  const activasCount = normalizedMonedas.filter((m) => m.activa).length;
  const inactivasCount = normalizedMonedas.filter((m) => !m.activa).length;
  const personalizadasCount = normalizedMonedas.filter((m) => !m.esPredeterminada).length;

  const sorted = [...normalizedMonedas].sort((a, b) => a.orden - b.orden);

  return (
    <div>
      {/* Barra superior */}
      <div className="mb-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={refresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 rounded-sm border border-[#ddd5c2] dark:border-[#2e3844] bg-white dark:bg-[#212836] px-3 py-[7px] font-sans text-[13px] text-foreground transition-colors duration-150 hover:bg-[#f0ead9] dark:hover:bg-[#212836] disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Actualizando…' : 'Actualizar'}
        </button>
        {onNewMoneda && (
          <Button type="button" size="sm" onClick={onNewMoneda}>
            <Plus className="h-3.5 w-3.5" />
            Nueva moneda
          </Button>
        )}
      </div>

      {/* KPIs */}
      <div className="mb-5 grid grid-cols-2 gap-3.5 md:grid-cols-4">
        <KpiCard label="Total monedas" value={normalizedMonedas.length} borderColor="#3d5a80" valueColor="#20242c" />
        <KpiCard label="Activas" value={activasCount} borderColor="#5a7d52" valueColor="#476442" />
        <KpiCard label="Inactivas" value={inactivasCount} borderColor="#b35a42" valueColor="#a04a34" />
        <KpiCard label="Personalizadas" value={personalizadasCount} borderColor="#8a6fa0" valueColor="#20242c" />
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-md border border-[#ddd5c2] dark:border-[#2e3844] bg-card py-14">
          <p className="text-[13.5px] italic text-muted-foreground">Sin monedas configuradas.</p>
          {onInitializeDefault && (
            <Button type="button" variant="outline" size="sm" onClick={onInitializeDefault}>
              Inicializar monedas predeterminadas
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden overflow-x-auto rounded-md border border-[#ddd5c2] dark:border-[#2e3844] bg-card">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b-2 border-[#ddd5c2] dark:border-[#2e3844]">
                <th className="px-3.5 py-2.5 text-left font-mono text-[10.5px] uppercase text-[#8a8677] dark:text-[#93a0af]" style={{ letterSpacing: '.08em' }}>Código</th>
                <th className="px-3.5 py-2.5 text-left font-mono text-[10.5px] uppercase text-[#8a8677] dark:text-[#93a0af]" style={{ letterSpacing: '.08em' }}>Nombre</th>
                <th className="px-3.5 py-2.5 text-right font-mono text-[10.5px] uppercase text-[#8a8677] dark:text-[#93a0af]" style={{ letterSpacing: '.08em' }}>Tasa ARS</th>
                <th className="px-3.5 py-2.5 text-left font-mono text-[10.5px] uppercase text-[#8a8677] dark:text-[#93a0af]" style={{ letterSpacing: '.08em' }}>Estado</th>
                <th className="px-3.5 py-2.5 text-right font-mono text-[10.5px] uppercase text-[#8a8677] dark:text-[#93a0af]" style={{ letterSpacing: '.08em' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((moneda) => (
                <tr key={moneda.id} className="group border-b border-[#e7e0cf] dark:border-[#2e3844] transition-colors hover:bg-[#f0ead9] dark:hover:bg-[#212836]">
                  <td className="px-3.5 py-2.5">
                    <span className="font-mono text-[12px] font-semibold text-foreground">{moneda.codigo}</span>
                    {moneda.esPredeterminada && (
                      <Badge variant="outline" className="ml-2">Predet.</Badge>
                    )}
                  </td>
                  <td className="px-3.5 py-2.5 text-[13.5px] text-foreground">
                    {moneda.nombre} <span className="text-[#8a8677] dark:text-[#93a0af]">({moneda.simbolo})</span>
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-mono text-[12px] text-foreground">
                    {moneda.tasaCambioARS && moneda.tasaCambioARS !== 1
                      ? `1 ${moneda.codigo} = $ ${moneda.tasaCambioARS.toLocaleString('es-AR')}`
                      : '—'}
                  </td>
                  <td className="px-3.5 py-2.5">
                    {moneda.activa ? (
                      <Badge variant="outline" className="border-[#476442] text-[#476442] dark:border-[#8fae7f] dark:text-[#8fae7f]">Activa</Badge>
                    ) : (
                      <Badge variant="outline" className="border-[#ddd5c2] text-[#8a8677] dark:border-[#2e3844] dark:text-[#93a0af]">Inactiva</Badge>
                    )}
                  </td>
                  <td className="px-3.5 py-2.5">
                    <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => onToggleActive && onToggleActive(moneda.id)}
                        className="rounded-sm p-1.5 transition-colors hover:bg-black/5"
                        title={moneda.activa ? 'Desactivar' : 'Activar'}
                      >
                        {moneda.activa ? (
                          <EyeOff className="h-4 w-4 text-[#8a8677] dark:text-[#93a0af]" />
                        ) : (
                          <Eye className="h-4 w-4 text-[#476442] dark:text-[#8fae7f]" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditMoneda && onEditMoneda(moneda)}
                        className="rounded-sm p-1.5 transition-colors hover:bg-black/5"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4 text-[#8a8677] dark:text-[#93a0af]" />
                      </button>
                      {!moneda.esPredeterminada && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`¿Eliminar moneda ${moneda.codigo}?`)) {
                              onDeleteMoneda && onDeleteMoneda(moneda.id);
                            }
                          }}
                          className="rounded-sm p-1.5 transition-colors hover:bg-black/5"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4 text-[#8a8677] dark:text-[#93a0af] hover:text-[#a04a34] dark:hover:text-[#c26a52]" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

ModernMonedasView.propTypes = {
  monedas: PropTypes.array,
  onNewMoneda: PropTypes.func,
  onEditMoneda: PropTypes.func,
  onDeleteMoneda: PropTypes.func,
  onToggleActive: PropTypes.func,
  onInitializeDefault: PropTypes.func,
};

export default ModernMonedasView;
