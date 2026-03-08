import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  FileText,
  Plus,
  Upload,
  Download,
  Eye,
  Calendar,
  DollarSign,
  CreditCard,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import GlassCard from '../common/GlassCard';
import StatCard from '../common/StatCard';
import ModernButton from '../common/ModernButton';
import { useRefresh } from '../../../hooks/useRefresh';
import { QUERY_KEYS } from '../../../hooks/useFinancialData';
import { useIsMobile } from '../../../hooks/use-mobile';

/**
 * ModernResumenesView - Vista de Resúmenes Bancarios
 */
const ModernResumenesView = ({
  resumenes = [],
  onUploadResumen,
  onViewResumen,
  onDownloadPDF,
  loading = false
}) => {
  const [selectedEstado, setSelectedEstado] = useState('all'); // 'all' | 'pendiente' | 'pagado'
  const { refresh, isRefreshing } = useRefresh([QUERY_KEYS.resumenes]);
  const isMobile = useIsMobile();

  // Mock data
  const mockResumenes = [
    {
      id: 1,
      banco: 'ICBC',
      tipoTarjeta: 'Visa',
      numeroResumen: '001-0001234',
      periodo: 'Febrero 2026',
      cierre: '2026-02-15',
      vencimiento: '2026-02-23',
      saldoPesos: 45000,
      saldoDolares: 0,
      pagoMinimoPesos: 8000,
      estado: 'pendiente',
      urlPDF: '/resumenes/001.pdf'
    },
    {
      id: 2,
      banco: 'Galicia',
      tipoTarjeta: 'Mastercard',
      numeroResumen: '002-0005678',
      periodo: 'Febrero 2026',
      cierre: '2026-02-18',
      vencimiento: '2026-02-28',
      saldoPesos: 28500,
      saldoDolares: 0,
      pagoMinimoPesos: 5000,
      estado: 'pendiente',
      urlPDF: '/resumenes/002.pdf'
    },
    {
      id: 3,
      banco: 'Santander',
      tipoTarjeta: 'Visa',
      numeroResumen: '003-0009012',
      periodo: 'Enero 2026',
      cierre: '2026-01-15',
      vencimiento: '2026-01-25',
      saldoPesos: 35000,
      saldoDolares: 0,
      pagoMinimoPesos: 6000,
      estado: 'pagado',
      urlPDF: '/resumenes/003.pdf'
    }
  ];

  const normalizedResumenes = resumenes.map((r) => ({
    id: r.id || r.Id,
    banco: r.banco || r.Banco || 'Banco',
    tipoTarjeta: r.tipo_tarjeta || r.tipoTarjeta || r.TipoTarjeta || r.tarjeta || 'Tarjeta',
    periodo: r.periodo || r.Periodo || 'Sin período',
    cierre: r.fecha_cierre || r.cierre || r.Cierre || r.fechaCierre || r.fecha_vencimiento || r.Fechavencimiento,
    vencimiento: r.fecha_vencimiento || r.FechaVencimiento || r.fechavencimiento || r.Fechavencimiento,
    saldoPesos: parseFloat(r.saldo_pesos || r.saldoPesos || r.monto_total || r.MontoTotal || r.monto || r.Monto || 0),
    saldoDolares: parseFloat(r.saldo_dolares || r.saldoDolares || 0),
    pagoMinimoPesos: parseFloat(r.pago_minimo_pesos || r.pagoMinimoPesos || r.pago_minimo || r.pagoMinimo || 0),
    estado: (r.estado || r.Estado || 'pendiente').toString().toLowerCase(),
    urlPDF: r.url_pdf || r.urlPDF || r.comprobante || r.Comprobante || null,
  }));

  const allResumenes = normalizedResumenes.length > 0 ? normalizedResumenes : mockResumenes;

  // Filter
  const filteredResumenes = selectedEstado === 'all'
    ? allResumenes
    : allResumenes.filter(r => r.estado === selectedEstado);

  // Stats
  const stats = {
    total: allResumenes.length,
    pendientes: allResumenes.filter(r => r.estado === 'pendiente').length,
    pagados: allResumenes.filter(r => r.estado === 'pagado').length,
    deudaTotal: allResumenes.filter(r => r.estado === 'pendiente').reduce((sum, r) => sum + r.saldoPesos, 0)
  };

  const formatCurrency = (amount, currency = 'ARS') => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString || '');
    if (Number.isNaN(date.getTime())) return 'Sin fecha';

    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: { color: 'bg-yellow-500/10 text-yellow-500', label: 'Pendiente', icon: Clock },
      pagado: { color: 'bg-green-500/10 text-green-500', label: 'Pagado', icon: CheckCircle }
    };
    return badges[estado] || badges.pendiente;
  };

  return (
    <div className="space-y-3 md:space-y-6">
      {/* Page Header */}
      <div className={`flex ${isMobile ? 'flex-col gap-2.5' : 'items-center justify-between'}`}>
        <div className="min-w-0">
          <h1 className={`${isMobile ? 'text-xl leading-tight' : 'text-3xl'} font-bold text-[var(--text-primary)]`}>
            Resúmenes Bancarios
          </h1>
          <p className={`text-[var(--text-secondary)] mt-1 ${isMobile ? 'text-xs' : ''}`}>
            Administra tus resúmenes de tarjetas de crédito
          </p>
        </div>
        <div className={`flex items-center gap-2 ${isMobile ? 'w-full' : ''}`}>
          <button
            onClick={refresh}
            disabled={isRefreshing}
            className={`flex items-center justify-center gap-2 bg-[#18181b] hover:bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 hover:text-white transition-all disabled:opacity-50 ${isMobile ? 'h-10 w-10 px-0' : 'px-3 py-2'}`}
            title="Actualizar resúmenes"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {!isMobile && <span className="hidden sm:inline">{isRefreshing ? 'Actualizando...' : 'Actualizar'}</span>}
          </button>
          <ModernButton
            variant="primary"
            icon={Upload}
            onClick={onUploadResumen}
            size={isMobile ? 'sm' : 'md'}
            className={isMobile ? 'flex-1 h-10 text-sm' : ''}
          >
            {isMobile ? 'Subir PDF' : 'Subir Resumen PDF'}
          </ModernButton>
        </div>
      </div>

      {/* Stats Cards */}
      {isMobile ? (
        <div className="grid grid-cols-2 gap-2">
          {[
            { title: 'Total', value: stats.total, icon: FileText, valueClass: 'text-cyan-400' },
            { title: 'Pendientes', value: stats.pendientes, icon: Clock, valueClass: 'text-yellow-400' },
            { title: 'Pagados', value: stats.pagados, icon: CheckCircle, valueClass: 'text-green-400' },
            { title: 'Deuda', value: formatCurrency(stats.deudaTotal), icon: DollarSign, valueClass: 'text-red-400' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <GlassCard key={item.title} className="p-2.5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] text-[var(--text-secondary)] uppercase tracking-wide">{item.title}</p>
                    <p className={`mt-1 text-lg font-bold leading-tight ${item.valueClass}`}>{item.value}</p>
                  </div>
                  <Icon className="w-4 h-4 text-[var(--text-secondary)]" />
                </div>
              </GlassCard>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
          <StatCard
            title="Total Resúmenes"
            value={stats.total}
            icon={FileText}
            color="cyan"
          />
          <StatCard
            title="Pendientes"
            value={stats.pendientes}
            icon={Clock}
            color="yellow"
          />
          <StatCard
            title="Pagados"
            value={stats.pagados}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Deuda Total"
            value={formatCurrency(stats.deudaTotal)}
            icon={DollarSign}
            color="red"
          />
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:gap-3 md:overflow-visible md:pb-0">
        <button
          onClick={() => setSelectedEstado('all')}
          className={`whitespace-nowrap px-3 py-1.5 text-xs rounded-xl font-medium transition-all md:px-4 md:py-2 md:text-sm ${
            selectedEstado === 'all'
              ? 'bg-gradient-to-r from-[var(--accent-green)] to-[var(--accent-cyan)] text-white shadow-lg'
              : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
          }`}
        >
          Todos ({allResumenes.length})
        </button>
        <button
          onClick={() => setSelectedEstado('pendiente')}
          className={`whitespace-nowrap px-3 py-1.5 text-xs rounded-xl font-medium transition-all md:px-4 md:py-2 md:text-sm ${
            selectedEstado === 'pendiente'
              ? 'bg-yellow-500 text-white shadow-lg'
              : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
          }`}
        >
          Pendientes ({stats.pendientes})
        </button>
        <button
          onClick={() => setSelectedEstado('pagado')}
          className={`whitespace-nowrap px-3 py-1.5 text-xs rounded-xl font-medium transition-all md:px-4 md:py-2 md:text-sm ${
            selectedEstado === 'pagado'
              ? 'bg-green-500 text-white shadow-lg'
              : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
          }`}
        >
          Pagados ({stats.pagados})
        </button>
      </div>

      {/* Resúmenes */}
      {isMobile ? (
        <div className="space-y-2.5">
          {filteredResumenes.map((resumen) => {
            const estadoBadge = getEstadoBadge(resumen.estado);
            const EstadoIcon = estadoBadge.icon;

            return (
              <GlassCard key={resumen.id} className="p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 pr-1">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{resumen.banco}</p>
                    <p className="text-[11px] text-[var(--text-secondary)] truncate">{resumen.tipoTarjeta} · {resumen.periodo}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${estadoBadge.color}`}>
                    <EstadoIcon className="w-3 h-3" />
                    {estadoBadge.label}
                  </span>
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-[var(--bg-secondary)] p-2">
                    <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide">Vencimiento</p>
                    <p className="font-medium text-[var(--text-primary)] text-[13px] leading-tight">{formatDate(resumen.vencimiento)}</p>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-secondary)] p-2">
                    <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide">Cierre</p>
                    <p className="font-medium text-[var(--text-primary)] text-[13px] leading-tight">{formatDate(resumen.cierre)}</p>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-secondary)] p-2">
                    <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide">Saldo</p>
                    <p className="font-bold text-red-500 text-[13px] leading-tight truncate">{formatCurrency(resumen.saldoPesos)}</p>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-secondary)] p-2">
                    <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide">Pago mínimo</p>
                    <p className="font-bold text-yellow-500 text-[13px] leading-tight truncate">{formatCurrency(resumen.pagoMinimoPesos)}</p>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => onViewResumen && onViewResumen(resumen)}
                    className="p-1.5 hover:bg-[var(--bg-card)] rounded-lg transition-colors"
                    title="Ver detalles"
                  >
                    <Eye className="w-4 h-4 text-[var(--text-secondary)]" />
                  </button>
                  {resumen.urlPDF && (
                    <button
                      onClick={() => onDownloadPDF && onDownloadPDF(resumen)}
                      className="p-1.5 hover:bg-[var(--bg-card)] rounded-lg transition-colors"
                      title="Descargar PDF"
                    >
                      <Download className="w-4 h-4 text-[var(--text-secondary)]" />
                    </button>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      ) : (
        <GlassCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left p-4 text-sm font-semibold text-[var(--text-secondary)]">Banco</th>
                  <th className="text-left p-4 text-sm font-semibold text-[var(--text-secondary)]">Tipo</th>
                  <th className="text-left p-4 text-sm font-semibold text-[var(--text-secondary)]">Período</th>
                  <th className="text-center p-4 text-sm font-semibold text-[var(--text-secondary)]">Cierre</th>
                  <th className="text-center p-4 text-sm font-semibold text-[var(--text-secondary)]">Vencimiento</th>
                  <th className="text-right p-4 text-sm font-semibold text-[var(--text-secondary)]">Saldo</th>
                  <th className="text-right p-4 text-sm font-semibold text-[var(--text-secondary)]">Pago Mínimo</th>
                  <th className="text-center p-4 text-sm font-semibold text-[var(--text-secondary)]">Estado</th>
                  <th className="text-center p-4 text-sm font-semibold text-[var(--text-secondary)]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredResumenes.map((resumen) => {
                  const estadoBadge = getEstadoBadge(resumen.estado);
                  const EstadoIcon = estadoBadge.icon;

                  return (
                    <tr
                      key={resumen.id}
                      className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-[var(--accent-cyan)]" />
                          <span className="text-sm font-medium text-[var(--text-primary)]">
                            {resumen.banco}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-[var(--text-secondary)]">{resumen.tipoTarjeta}</td>
                      <td className="p-4 text-sm text-[var(--text-secondary)]">{resumen.periodo}</td>
                      <td className="p-4 text-center text-sm text-[var(--text-secondary)]">{formatDate(resumen.cierre)}</td>
                      <td className="p-4 text-center text-sm text-[var(--text-secondary)]">{formatDate(resumen.vencimiento)}</td>
                      <td className="p-4 text-right">
                        <div className="text-sm font-bold text-red-500">{formatCurrency(resumen.saldoPesos)}</div>
                        {resumen.saldoDolares > 0 && (
                          <div className="text-xs text-[var(--text-secondary)]">+ {formatCurrency(resumen.saldoDolares, 'USD')}</div>
                        )}
                      </td>
                      <td className="p-4 text-right text-sm font-medium text-yellow-500">{formatCurrency(resumen.pagoMinimoPesos)}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${estadoBadge.color}`}>
                          <EstadoIcon className="w-3 h-3" />
                          {estadoBadge.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onViewResumen && onViewResumen(resumen)}
                            className="p-2 hover:bg-[var(--bg-card)] rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4 text-[var(--text-secondary)]" />
                          </button>
                          {resumen.urlPDF && (
                            <button
                              onClick={() => onDownloadPDF && onDownloadPDF(resumen)}
                              className="p-2 hover:bg-[var(--bg-card)] rounded-lg transition-colors"
                              title="Descargar PDF"
                            >
                              <Download className="w-4 h-4 text-[var(--text-secondary)]" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Empty State */}
      {filteredResumenes.length === 0 && (
        <GlassCard className="p-12 text-center">
          <FileText className="w-16 h-16 text-[var(--text-secondary)] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
            No hay resúmenes {selectedEstado !== 'all' ? selectedEstado + 's' : ''}
          </h3>
          <p className="text-[var(--text-secondary)] mb-6">
            Subí tus resúmenes bancarios en PDF para gestionarlos automáticamente
          </p>
          <ModernButton
            variant="primary"
            icon={Upload}
            onClick={onUploadResumen}
          >
            Subir Resumen PDF
          </ModernButton>
        </GlassCard>
      )}
    </div>
  );
};

ModernResumenesView.propTypes = {
  resumenes: PropTypes.array,
  onUploadResumen: PropTypes.func,
  onViewResumen: PropTypes.func,
  onDownloadPDF: PropTypes.func,
  loading: PropTypes.bool,
};

export default ModernResumenesView;
