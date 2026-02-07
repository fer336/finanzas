import { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, DollarSign, Calendar, Filter, Check, X, Pencil, Trash2 } from 'lucide-react';
import apiServices from '../../../services/api';
import { useIsMobile } from '../../../hooks/use-mobile';

const TarjetasFullView = ({ onBack, onPagarResumen, onEdit, onDelete }) => {
  const isMobile = useIsMobile();
  const [deudaData, setDeudaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, paid
  const [selectedTarjeta, setSelectedTarjeta] = useState('all'); // all, specific card
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    fetchDeuda();
  }, [selectedMonth]);

  useEffect(() => {
    fetchMonthlySummary();
  }, []);

  const fetchDeuda = async () => {
    try {
      setLoading(true);
      const data = await apiServices.tarjetasApi.getDeuda(selectedMonth);
      setDeudaData(data);
    } catch (error) {
      console.error('Error fetching deuda:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlySummary = async () => {
    try {
      setLoadingSummary(true);
      const data = await apiServices.tarjetasApi.getResumenMensual(12);
      setMonthlySummary(data?.resumen || []);
    } catch (error) {
      console.error('Error fetching monthly summary:', error);
    } finally {
      setLoadingSummary(false);
    }
  };

  const formatCurrency = (amount) => {
    return amount.toLocaleString('es-AR', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Filtrar transacciones
  const filteredTransacciones = deudaData?.transacciones?.filter(t => {
    // Filtrar por estado
    if (filter === 'pending' && t.fecha_pago_real) return false;
    if (filter === 'paid' && !t.fecha_pago_real) return false;

    // Filtrar por tarjeta
    if (selectedTarjeta !== 'all') {
      const metodoPago = t.MetodosPago?.nombre || t.metodos_pago1?.nombre;
      if (metodoPago !== selectedTarjeta) return false;
    }

    return true;
  }) || [];

  // Calcular deuda de transacciones filtradas
  const deudaFiltrada = filteredTransacciones
    .filter(t => !t.fecha_pago_real)
    .reduce((sum, t) => sum + Math.abs(t.monto), 0);

  // Obtener lista de tarjetas únicas
  const tarjetasUnicas = [...new Set(
    (deudaData?.transacciones || [])
      .map(t => t.MetodosPago?.nombre || t.metodos_pago1?.nombre)
      .filter(Boolean)
  )];

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/10 rounded w-48"></div>
            <div className="h-32 bg-white/10 rounded"></div>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-white/10 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const summaryMap = monthlySummary.reduce((acc, item) => {
    acc[item.mes] = item;
    return acc;
  }, {});

  const calendarMonths = (() => {
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mes = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        mes,
        label: date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
      });
    }
    return months;
  })();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-white" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-red-400" />
                  Deuda de Tarjetas
                </h1>
                <p className="text-xs text-zinc-400">
                  {filteredTransacciones.length} transacciones
                </p>
              </div>
            </div>
            
            {deudaData?.cantidad_pendientes > 0 && (
              <button
                onClick={() => {
                  if (!onPagarResumen || !deudaData) return;
                  const pendientes = (deudaData.transacciones || []).filter(t => !t.fecha_pago_real);
                  onPagarResumen({ ...deudaData, transacciones: pendientes });
                }}
                className="px-3 py-2 text-xs bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-lg transition-all flex items-center gap-2"
              >
                <DollarSign size={14} />
                Pagar Resumen
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 pb-24 md:pb-6 space-y-4">
        {/* Selector de Mes */}
        <div className="bg-[#162028] border border-white/10 rounded-2xl p-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-zinc-400">Mes seleccionado</p>
              <p className="text-sm text-white font-semibold">
                {new Date(`${selectedMonth}-01T00:00:00`).toLocaleDateString('es-ES', {
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 bg-zinc-800 border border-white/10 rounded-lg text-xs text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Calendario de Consumos */}
        <div className="bg-[#162028] border border-white/10 rounded-2xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-white text-sm font-semibold">
              <Calendar size={14} className="text-blue-400" />
              Calendario de Consumos
            </div>
            <span className="text-[10px] text-zinc-500">Últimos 12 meses</span>
          </div>
          {loadingSummary ? (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {Array.from({ length: 12 }).map((_, idx) => (
                <div key={idx} className="h-12 rounded-lg bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {calendarMonths.map((item) => {
                const summary = summaryMap[item.mes];
                const total = summary?.total || 0;
                const isActive = item.mes === selectedMonth;
                return (
                  <button
                    key={item.mes}
                    onClick={() => setSelectedMonth(item.mes)}
                    className={`rounded-lg border p-2 text-left transition-all ${
                      isActive
                        ? 'border-blue-500/50 bg-blue-500/10'
                        : 'border-white/5 bg-[#1a1a1a] hover:border-white/10'
                    }`}
                  >
                    <p className="text-[10px] text-zinc-400">{item.label}</p>
                    <p className="text-xs font-semibold text-white">
                      ${formatCurrency(total)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Resumen Global */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-2xl p-4">
            <p className="text-xs text-zinc-400 mb-1">Deuda Total</p>
            <p className="text-2xl font-bold text-white">
              ${formatCurrency(deudaData?.deuda_total || 0)}
            </p>
          </div>
          
          <div className="bg-[#162028] border border-white/10 rounded-2xl p-4">
            <p className="text-xs text-zinc-400 mb-1">Transacciones Pendientes</p>
            <p className="text-2xl font-bold text-white">
              {deudaData?.transacciones?.filter(t => !t.fecha_pago_real).length || 0}
            </p>
          </div>
          
          <div className="bg-[#162028] border border-white/10 rounded-2xl p-4">
            <p className="text-xs text-zinc-400 mb-1">Tarjetas Activas</p>
            <p className="text-2xl font-bold text-white">
              {deudaData?.deuda_por_tarjeta?.length || 0}
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-[#162028] border border-white/10 rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Filtro por Estado */}
            <div className="flex-1">
              <label className="text-xs text-zinc-400 block mb-2">Estado</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'pending'
                      ? 'bg-red-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  Pendientes
                </button>
                <button
                  onClick={() => setFilter('paid')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'paid'
                      ? 'bg-green-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  Pagadas
                </button>
              </div>
            </div>

            {/* Filtro por Tarjeta */}
            {tarjetasUnicas.length > 1 && (
              <div className="flex-1">
                <label className="text-xs text-zinc-400 block mb-2">Tarjeta</label>
                <select
                  value={selectedTarjeta}
                  onChange={(e) => setSelectedTarjeta(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">Todas las tarjetas</option>
                  {tarjetasUnicas.map(tarjeta => (
                    <option key={tarjeta} value={tarjeta}>{tarjeta}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Deuda Filtrada */}
        {filter === 'pending' && deudaFiltrada > 0 && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-orange-300">Deuda Seleccionada</span>
              <span className="text-xl font-bold text-orange-400">
                ${formatCurrency(deudaFiltrada)}
              </span>
            </div>
          </div>
        )}

        {/* Lista de Transacciones */}
        {filteredTransacciones.length === 0 ? (
          <div className="text-center py-12 bg-[#162028] rounded-2xl border border-white/10">
            <CreditCard className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">No hay transacciones con estos filtros</p>
          </div>
        ) : (
          <div className="space-y-3">
              {filteredTransacciones.map((transaccion) => {
              const transaccionId = transaccion.id || transaccion.Id;
              const isPending = !transaccion.fecha_pago_real;
              const metodoPago = transaccion.MetodosPago || transaccion.metodos_pago1;
              
              return (
                <div
                  key={transaccion.id}
                  className={`bg-[#162028] border rounded-2xl p-4 transition-all ${
                    isPending
                      ? 'border-red-500/30 hover:border-red-500/50'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {isPending ? (
                          <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-400">
                            Pendiente
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-400 flex items-center gap-1">
                            <Check size={12} />
                            Pagada
                          </span>
                        )}
                        {metodoPago && (
                          <span className="text-xs text-zinc-500">
                            {metodoPago.icono} {metodoPago.nombre}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-white font-medium mb-1 truncate">
                        {transaccion.descripcion || 'Sin descripción'}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(transaccion.fecha_transaccion)}
                        </span>
                        {transaccion.fecha_pago_real && (
                          <span className="text-green-500">
                            Pagada: {formatDate(transaccion.fecha_pago_real)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Monto */}
                    <div className="text-right shrink-0">
                      <p className={`text-xl font-bold ${isPending ? 'text-red-400' : 'text-zinc-400'}`}>
                        ${formatCurrency(Math.abs(transaccion.monto))}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {transaccion.moneda}
                      </p>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit && onEdit({ ...transaccion, id: transaccionId })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/80 hover:bg-white/10 transition-colors"
                    >
                      <Pencil size={12} />
                      Editar
                    </button>
                    <button
                      onClick={() => onDelete && onDelete(transaccionId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 size={12} />
                      Eliminar
                    </button>
                  </div>

                  {/* Notas */}
                  {transaccion.notas && (
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <p className="text-xs text-zinc-500">{transaccion.notas}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TarjetasFullView;

