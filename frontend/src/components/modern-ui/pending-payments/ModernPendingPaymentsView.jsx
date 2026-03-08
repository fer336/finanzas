import { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import ConfirmModal from '../common/ConfirmModal';
import LoadingSpinner from '../common/LoadingSpinner';
import { usePendingPayments, useUpdatePendingPayment, useDeletePendingPayment, QUERY_KEYS } from '../../../hooks/useFinancialData';
import { useRefresh } from '../../../hooks/useRefresh';
import { 
  Eye,
  Plus, 
  Calendar, 
  Check, 
  AlertCircle, 
  Clock, 
  Edit, 
  Trash2, 
  Tag,
  ArrowDownLeft,
  CheckCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  FileText,
  RefreshCw
} from 'lucide-react';

const ModernPendingPaymentsView = ({ 
  onNewPago, 
  onMarcarPagado,
  onEditPago,
  onDeletePago
}) => {
  const getCurrentMonthValue = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${now.getFullYear()}-${month}`;
  };

  const parseDateSafe = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  // ====== REACT QUERY ======
  const { data: pagosData, isLoading, error } = usePendingPayments();
  const updateMutation = useUpdatePendingPayment();
  const deleteMutation = useDeletePendingPayment();
  const { refresh, isRefreshing } = useRefresh([QUERY_KEYS.pendingPayments]);

  // Datos normalizados desde React Query
  const pagos = useMemo(() => {
    if (!pagosData) return [];
    return (pagosData.list || pagosData || []).map(p => {
      const categoriaObj = p.Categorias || p.categorias1 || p.categoria || null;
      const categoriaNombre = categoriaObj?.nombre || categoriaObj?.Nombre || 'Sin categoría';
      
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const fechaVenc = parseDateSafe(p.fecha_vencimiento || p.FechaVencimiento || p.fechavencimiento || p.Fechavencimiento);
      if (fechaVenc) {
        fechaVenc.setHours(0, 0, 0, 0);
      }
      const dias = fechaVenc ? Math.ceil((fechaVenc - hoy) / (1000 * 60 * 60 * 24)) : 999;
      
      return {
        ...p,
        nombre: p.nombre || p.Nombre || 'Sin nombre',
        monto: parseFloat(p.monto || p.Monto || 0),
        moneda: p.moneda || p.Moneda || 'ARS',
        fechaVencimiento: p.fecha_vencimiento || p.FechaVencimiento || p.fechavencimiento || p.Fechavencimiento,
        diasRestantes: dias,
        estado: (p.estado || p.Estado || 'pendiente').toString().toLowerCase(),
        categoria: categoriaNombre
      };
    });
  }, [pagosData]);
  
  // ====== STATE ======
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('pending'); // all, pending, overdue, paid
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly' o 'accumulated'
  const [selectedMonthFilter, setSelectedMonthFilter] = useState(getCurrentMonthValue());
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pagoToDelete, setPagoToDelete] = useState(null);
  const itemsPerPage = 20;

  // Helper para calcular días restantes
  const calcularDiasRestantes = (fechaVencimiento) => {
    if (!fechaVencimiento) return 999;
    const fecha = new Date(fechaVencimiento);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fecha.setHours(0, 0, 0, 0);
    return Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', { 
      style: 'currency', 
      currency: 'ARS', 
      minimumFractionDigits: 0 
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);
    const manana = new Date(hoy);
    manana.setDate(hoy.getDate() + 1);
    
    const fechaSola = new Date(date);
    fechaSola.setHours(0, 0, 0, 0);
    
    if (fechaSola.getTime() === hoy.getTime()) return 'Hoy';
    if (fechaSola.getTime() === manana.getTime()) return 'Mañana';
    if (fechaSola.getTime() === ayer.getTime()) return 'Ayer';
    
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Loading state
  if (isLoading) {
    return <LoadingSpinner message="Cargando pagos pendientes..." />;
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Error al cargar pagos</h2>
          <p className="text-gray-400">{error.message}</p>
        </div>
      </div>
    );
  }

  // Normalizar datos del backend (ya normalizado arriba pero agregamos campos extra)
  const normalizedData = pagos.map(p => ({
    ...p,
    id: p.id || p.Id,
    descripcion: p.descripcion || p.Descripcion || '',
    comprobante: p.comprobante || p.Comprobante || p.archivo_adjunto || p.ArchivoAdjunto,
    notas: p.notas || p.Notas || ''
  }));

  // Aplicar filtros
  let filteredData = normalizedData;

  // Filtro de vista mensual/acumulativa
  if (viewMode === 'monthly') {
    const [selectedYear, selectedMonth] = selectedMonthFilter.split('-').map(Number);

    filteredData = filteredData.filter(p => {
      const fechaVenc = parseDateSafe(p.fechaVencimiento);
      if (!fechaVenc) return false;
      return fechaVenc.getMonth() === (selectedMonth - 1) && fechaVenc.getFullYear() === selectedYear;
    });
  }

  // Filtro de búsqueda
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredData = filteredData.filter(p =>
      p.nombre.toLowerCase().includes(query) ||
      p.descripcion.toLowerCase().includes(query) ||
      p.categoria.toLowerCase().includes(query)
    );
  }

  // Filtro de estado
  if (selectedStatus !== 'all') {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    filteredData = filteredData.filter(p => {
      const isPaid = p.estado === 'pagado' || p.estado === 'true' || p.pagada === true;
      const fechaVenc = parseDateSafe(p.fechaVencimiento);
      if (!fechaVenc) return false;
      fechaVenc.setHours(0, 0, 0, 0);
      const isOverdue = !isPaid && fechaVenc < now;

      if (selectedStatus === 'paid') return isPaid;
      if (selectedStatus === 'pending') return !isPaid && !isOverdue;
      if (selectedStatus === 'overdue') return isOverdue;
      return true;
    });
  }

// Ordenar por urgencia (vencidos primero, luego por fecha)
  const sortedData = [...filteredData].sort((a, b) => {
    const diasA = calcularDiasRestantes(a.fechaVencimiento);
    const diasB = calcularDiasRestantes(b.fechaVencimiento);
    return diasA - diasB;
  });

  // Paginación
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calcular totales
  const totales = useMemo(() => {
    const pendientes = filteredData.filter(p => {
      const isPaid = p.estado === 'pagado' || p.estado === 'true' || p.pagada === true;
      return !isPaid;
    });

    const urgentes = pendientes.filter(p => {
      const dias = calcularDiasRestantes(p.fechaVencimiento);
      return dias <= 5 && dias >= 0;
    });

    const vencidos = pendientes.filter(p => {
      const dias = calcularDiasRestantes(p.fechaVencimiento);
      return dias < 0;
    });

    const totalMonto = pendientes.reduce((sum, p) => sum + p.monto, 0);

    return {
      total: totalMonto,
      cantidad: pendientes.length,
      urgentes: urgentes.length,
      vencidos: vencidos.length
    };
  }, [filteredData]);

  // Reset página cuando cambian filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatus, viewMode, selectedMonthFilter]);

  const getStatusInfo = (pago) => {
    const isPaid = pago.estado === 'pagado' || pago.estado === 'true' || pago.pagada === true;
    const dias = calcularDiasRestantes(pago.fechaVencimiento);
    const isVencido = dias < 0;
    const isUrgente = dias <= 5 && dias >= 0;

    if (isPaid) {
      return {
        badge: { text: 'Pagado', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
        border: 'border-white/5',
        icon: CheckCircle
      };
    }
    if (isVencido) {
      return {
        badge: { text: `Vencido hace ${Math.abs(dias)} día${Math.abs(dias) !== 1 ? 's' : ''}`, color: 'bg-red-500/10 text-red-500 border-red-500/20' },
        border: 'border-[#ec4899] border-2 shadow-lg shadow-[#ec4899]/10',
        icon: AlertCircle
      };
    }
    if (isUrgente) {
      const text = dias === 0 ? 'VENCE HOY' : `${dias} día${dias !== 1 ? 's' : ''}`;
      return {
        badge: { text, color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
        border: 'border-[#ffd60a] border-2 shadow-lg shadow-[#ffd60a]/10',
        icon: Clock
      };
    }
    return {
      badge: { text: `${dias} días`, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
      border: 'border-white/5',
      icon: Calendar
    };
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-3 pb-28 sm:p-5">
      {/* Header con Estadísticas */}
      <div className="mb-4 rounded-3xl border border-white/10 bg-gradient-to-br from-[#102033] via-[#171b28] to-[#1b1523] p-3.5 sm:mb-5 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-white sm:text-2xl">Pagos Pendientes</h1>
            <p className="mt-0.5 text-[11px] text-white/60 sm:text-sm">Controlá vencimientos sin perder contexto</p>
          </div>
          <button
            onClick={refresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-2.5 py-1.5 bg-black/30 hover:bg-white/5 border border-white/10 rounded-xl text-xs text-gray-300 hover:text-white transition-all disabled:opacity-50 sm:px-3 sm:py-2 sm:text-sm"
            title="Actualizar datos"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'Actualizando...' : 'Actualizar'}</span>
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3">
          <div className="bg-black/25 rounded-2xl border border-white/10 p-2.5 sm:p-3.5">
            <p className="text-[10px] sm:text-xs text-white/50 mb-1">TOTAL A PAGAR</p>
            <p className="text-base font-bold text-white sm:text-xl">{formatCurrency(totales.total)}</p>
          </div>
          <div className="bg-black/25 rounded-2xl border border-white/10 p-2.5 sm:p-3.5">
            <p className="text-[10px] sm:text-xs text-white/50 mb-1">CANTIDAD</p>
            <p className="text-base font-bold text-white sm:text-xl">{totales.cantidad}</p>
          </div>
          <div className="bg-[#f59e0b]/10 rounded-2xl border border-[#f59e0b]/25 p-2.5 sm:p-3.5">
            <p className="text-[10px] sm:text-xs text-yellow-200/70 mb-1">URGENTES (≤5 días)</p>
            <p className="text-base font-bold text-[#ffd60a] sm:text-xl">{totales.urgentes}</p>
          </div>
          <div className="bg-[#ef4444]/10 rounded-2xl border border-[#ef4444]/25 p-2.5 sm:p-3.5">
            <p className="text-[10px] sm:text-xs text-red-200/70 mb-1">VENCIDOS</p>
            <p className="text-base font-bold text-[#ec4899] sm:text-xl">{totales.vencidos}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-3.5 rounded-2xl border border-white/10 bg-[#131722]/70 p-2.5 sm:p-3.5">
        <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            placeholder="Buscar pago..." 
            className="w-full pl-11 pr-4 py-2 bg-[#0f1219] text-white text-sm border border-white/10 rounded-xl placeholder:text-gray-500 focus:outline-none focus:border-[#10b981]/40 transition-colors" 
          />
        </div>
        <select 
          value={selectedStatus} 
          onChange={(e) => setSelectedStatus(e.target.value)} 
          className="w-full px-3.5 py-2 bg-[#0f1219] text-white text-sm border border-white/10 rounded-xl focus:outline-none sm:w-auto"
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="overdue">Vencidos</option>
          <option value="paid">Pagados</option>
        </select>
      </div>
      </div>

      {/* Toggle Mensual/Acumulativo */}
      <div className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-[#131722]/70 p-2.5 sm:p-3.5">
        <span className="text-sm text-white/65">Vista:</span>
        <div className="bg-[#0f1219] rounded-xl border border-white/10 p-1 flex gap-1">
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
              viewMode === 'monthly'
                ? 'bg-gradient-to-r from-[#10b981] to-[#06b6d4] text-white font-medium'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setViewMode('accumulated')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
              viewMode === 'accumulated'
                ? 'bg-gradient-to-r from-[#10b981] to-[#06b6d4] text-white font-medium'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Acumulado
          </button>
        </div>
        {viewMode === 'monthly' && (
          <input
            type="month"
            value={selectedMonthFilter}
            onChange={(e) => setSelectedMonthFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#0f1219] text-white text-sm border border-white/10 rounded-xl focus:outline-none focus:border-[#10b981]/40"
          />
        )}
        <span className="w-full text-xs text-white/50 sm:ml-2 sm:w-auto">
          {viewMode === 'monthly'
            ? `Mostrando ${new Date(`${selectedMonthFilter}-01T00:00:00`).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}`
            : 'Mostrando todos los pagos históricos'}
        </span>
      </div>

      {/* Lista de Pagos */}
      {sortedData.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            {searchQuery ? 'No se encontraron pagos' : 'No hay pagos pendientes'}
          </h3>
          <p className="text-gray-400 mb-6">
            {searchQuery 
              ? `No hay pagos que coincidan con "${searchQuery}"`
              : '¡Genial! No tienes pagos pendientes por el momento'
            }
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2.5 mb-5">
            {paginatedData.map((pago) => {
              const statusInfo = getStatusInfo(pago);
              const StatusIcon = statusInfo.icon;
              const isPaid = pago.estado === 'pagado' || pago.estado === 'true' || pago.pagada === true;
              const dias = calcularDiasRestantes(pago.fechaVencimiento);

              return (
                <div
                  key={pago.id}
                  className={`rounded-2xl border p-3.5 transition-all sm:p-4 ${
                    statusInfo.border.includes('border-2')
                      ? `bg-gradient-to-br from-[#1c1114] to-[#161825] ${statusInfo.border}`
                      : `bg-gradient-to-br from-[#18181b] via-[#161924] to-[#141823] ${statusInfo.border}`
                  }`}
                >
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3.5">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2 sm:gap-3">
                        <h3 className="text-[15px] font-bold text-white sm:text-lg">{pago.nombre}</h3>
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full border flex items-center gap-1 flex-shrink-0 ${statusInfo.badge.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.badge.text}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5 text-xs text-white/65 sm:gap-3.5 sm:text-sm">
                        <span className="flex items-center gap-1">
                          <Tag className="w-4 h-4" />
                          {pago.categoria}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Vence: {formatDate(pago.fechaVencimiento)}
                        </span>
                        {pago.comprobante && (
                          <a 
                            href={pago.comprobante}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-[#10b981] transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FileText className="w-4 h-4" />
                            Ver comprobante
                          </a>
                        )}
                      </div>
                      {pago.descripcion && (
                        <p className="text-xs text-white/40 mt-2 truncate">
                          {pago.descripcion}
                        </p>
                      )}
                    </div>

                    {/* Monto y Acciones */}
                      <div className="flex items-center justify-between gap-2.5 sm:justify-end sm:gap-3.5">
                        <div className="text-right">
                          <p className="text-[11px] text-white/50 mb-1">MONTO</p>
                          <p className="text-lg font-bold text-white sm:text-2xl">
                            {formatCurrency(pago.monto)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                        {/* Botón Pagar (solo si está pendiente) */}
                        {!isPaid && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('💰 Marcando pago como pagado:', pago);
                              onMarcarPagado && onMarcarPagado(pago);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-[#10b981] to-[#06b6d4] text-white text-xs font-medium hover:shadow-lg hover:shadow-cyan-500/20 transition-all flex items-center gap-1.5 sm:px-3 sm:py-2 sm:text-sm"
                            title="Marcar como Pagado"
                          >
                            <Check className="w-4 h-4" />
                            Pagar
                          </button>
                        )}

                        {/* Botones de acción (simétricos) */}
                         <div className="flex gap-1.5">
                          {/* Ver Factura */}
                          {(pago.comprobante || pago.Comprobante || pago.url_pdf) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const url = pago.comprobante || pago.Comprobante || pago.url_pdf;
                                window.open(url, '_blank');
                              }}
                              className="p-1.5 hover:bg-blue-500/15 rounded-lg transition-colors"
                              title="Ver Factura"
                            >
                              <Eye className="w-4 h-4 text-blue-400" />
                            </button>
                          )}

                          {/* Editar */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('✏️ Editando pago pendiente:', pago);
                              onEditPago && onEditPago(pago);
                            }}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4 text-gray-400 hover:text-white" />
                          </button>

                          {/* Eliminar */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPagoToDelete(pago);
                              setShowDeleteConfirm(true);
                            }}
                            className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#151922] rounded-xl border border-white/10 sm:px-5 sm:py-3.5">
              <p className="text-sm text-white/60">
                Página {currentPage} de {totalPages} ({sortedData.length} resultado{sortedData.length !== 1 ? 's' : ''})
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg transition-colors ${
                    currentPage === 1 
                      ? 'opacity-30 cursor-not-allowed' 
                      : 'hover:bg-white/5 cursor-pointer'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5 text-gray-400" />
                </button>
                <span className="text-sm text-white px-3 font-medium">
                  {currentPage}
                </span>
                <button
                  onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className={`p-2 rounded-lg transition-colors ${
                    currentPage >= totalPages 
                      ? 'opacity-30 cursor-not-allowed' 
                      : 'hover:bg-white/5 cursor-pointer'
                  }`}
                >
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Botón Flotante */}
      <button 
        onClick={onNewPago} 
        className="fixed bottom-24 right-4 h-12 w-12 rounded-full bg-gradient-to-br from-[#10b981] to-[#34d399] flex items-center justify-center shadow-xl shadow-green-500/30 hover:shadow-2xl transition-all z-40 sm:right-8 sm:h-14 sm:w-14"
        title="Nuevo Pago Pendiente"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setPagoToDelete(null);
        }}
        onConfirm={() => {
          if (pagoToDelete) {
            onDeletePago && onDeletePago(pagoToDelete.id);
          }
        }}
        title="¿Eliminar pago?"
        message={`¿Estás seguro de eliminar "${pagoToDelete?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

ModernPendingPaymentsView.propTypes = { 
  pagos: PropTypes.array,
  onNewPago: PropTypes.func, 
  onMarcarPagado: PropTypes.func,
  onEditPago: PropTypes.func,
  onDeletePago: PropTypes.func
};

export default ModernPendingPaymentsView;
