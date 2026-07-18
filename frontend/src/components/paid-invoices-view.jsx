import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Calendar, 
  Search, 
  CreditCard,
  DollarSign,
  FileText,
  ExternalLink,
  Clock
} from 'lucide-react';
import apiServices from '../services/api';
import { normalizeDocumentPreviewUrl } from '../utils/documentPreviewUrl';

const { pagosPendientesApi, formatearFecha, formatearMoneda } = apiServices;

// Función para calcular la próxima fecha de vencimiento
const calcularProximoVencimiento = (fechaVencimiento, periodicidad = 'mensual') => {
  if (!fechaVencimiento) return null;
  
  try {
    const fechaBase = new Date(fechaVencimiento);
    if (isNaN(fechaBase.getTime())) return null;
    
    const proximaFecha = new Date(fechaBase);
    
    // Calcular próximo vencimiento según periodicidad
    switch (periodicidad?.toLowerCase()) {
      case 'semanal':
        proximaFecha.setDate(proximaFecha.getDate() + 7);
        break;
      case 'quincenal':
        proximaFecha.setDate(proximaFecha.getDate() + 15);
        break;
      case 'mensual':
      default:
        proximaFecha.setMonth(proximaFecha.getMonth() + 1);
        break;
      case 'bimestral':
        proximaFecha.setMonth(proximaFecha.getMonth() + 2);
        break;
      case 'trimestral':
        proximaFecha.setMonth(proximaFecha.getMonth() + 3);
        break;
      case 'semestral':
        proximaFecha.setMonth(proximaFecha.getMonth() + 6);
        break;
      case 'anual':
        proximaFecha.setFullYear(proximaFecha.getFullYear() + 1);
        break;
    }
    
    return proximaFecha.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error calculando próximo vencimiento:', error);
    return null;
  }
};

const PaidInvoicesView = () => {
  const [paidPayments, setPaidPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const cargarFacturasPagas = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await pagosPendientesApi.getAll(200, 0);
        const payments = response.list || [];
        
        // --- INICIO DE DEPURACIÓN ---
        console.log('--- DEBUG: Datos recibidos de la API en Facturas Pagas ---');
        console.log(`Total de registros recibidos: ${payments.length}`);
        console.log('Primeros 5 registros:', payments.slice(0, 5));
        console.log('Estados de todos los registros recibidos:', payments.map(p => p.estado));
        // --- FIN DE DEPURACIÓN ---

        const paid = payments.filter(payment => {
          // Usar valores reales de la API: estado="pagado" (string, minúscula)
          const estaPagado = payment.estado === 'pagado' || 
                            payment.estado === 'completado' || 
                            payment.estado === 'true';
          
          console.log(`🔍 Pago ${payment.nombre}: estado="${payment.estado}", estaPagado=${estaPagado}`);
          return estaPagado;
        });
        
        console.log(`DEBUG: Registros encontrados pagados (estado="pagado"): ${paid.length}`);

        setPaidPayments(paid);
      } catch (error) {
        console.error('Error cargando facturas pagas:', error);
        setError('Error al cargar las facturas pagas');
      } finally {
        setLoading(false);
      }
    };

    cargarFacturasPagas();
  }, []);

  const handleViewInvoice = (payment) => {
    const document = normalizeDocumentPreviewUrl(payment.url_pdf || '');
    if (document.isValid) {
      window.open(document.href, '_blank', 'noopener,noreferrer');
    }
  };

  const availableMonths = [...new Set(paidPayments.map(p => {
    const date = new Date(p.fechapago);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }))].sort().reverse();

  const filteredPayments = paidPayments.filter(payment => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const matchesSearch = payment.nombre?.toLowerCase().includes(lowerSearchTerm) ||
                         payment.descripcion?.toLowerCase().includes(lowerSearchTerm);
    
    let matchesPeriod = true;
    if (filterPeriod !== 'all') {
      const paymentDate = new Date(payment.fechapago);
      const paymentMonthYear = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
      matchesPeriod = paymentMonthYear === filterPeriod;
    }
    
    return matchesSearch && matchesPeriod;
  });

  const stats = {
    total: filteredPayments.length,
    totalPagado: filteredPayments.reduce((sum, p) => sum + Math.abs(parseFloat(p.monto || 0)), 0),
    esteMes: filteredPayments.filter(p => {
      const paymentDate = new Date(p.fechapago);
      const today = new Date();
      return paymentDate.getMonth() === today.getMonth() && paymentDate.getFullYear() === today.getFullYear();
    }).length,
    promedioMensual: filteredPayments.length > 0 ? 
      filteredPayments.reduce((sum, p) => sum + Math.abs(parseFloat(p.monto || 0)), 0) / 
      Math.max(1, new Set(filteredPayments.map(p => {
        const date = new Date(p.fechapago);
        return `${date.getFullYear()}-${date.getMonth()}`;
      })).size) : 0
  };

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPayments = filteredPayments.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
        <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Cargando facturas pagas...</div>
      </div>
    );
  }

  if (error) {
    return (
            <div className="flex items-center justify-center py-8">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-full p-0 pb-32 md:pb-0" style={{background: '#000000'}}>
      <div className="h-full w-full p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-black uppercase text-white tracking-tight">Facturas Pagas</h1>
          <p className="text-zinc-400 text-sm font-bold mt-1">HISTORIAL DE PAGOS COMPLETADOS</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {/* Total Pagas */}
          <div className="bg-zinc-900 p-4 rounded-lg border-2 border-zinc-800">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-zinc-400 text-sm font-bold uppercase">Total Pagas</p>
                <p className="text-2xl md:text-3xl font-bold text-white mt-1 truncate">{stats.total}</p>
                <p className="text-xs text-zinc-500 mt-1">facturas</p>
              </div>
              <div className="w-10 h-10 bg-green-500/20 border-2 border-green-500/30 flex items-center justify-center rounded-lg flex-shrink-0">
                <CheckCircle size={20} className="text-green-400" strokeWidth={2} />
              </div>
            </div>
          </div>

          {/* Total Pagado */}
          <div className="bg-zinc-900 p-4 rounded-lg border-2 border-zinc-800">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-zinc-400 text-sm font-bold uppercase">Total Pagado</p>
                <p className="text-lg md:text-xl lg:text-2xl font-bold text-white mt-1 break-words">{formatearMoneda(stats.totalPagado, 'ARS')}</p>
                <p className="text-xs text-zinc-500 mt-1">acumulado</p>
              </div>
              <div className="w-10 h-10 bg-blue-500/20 border-2 border-blue-500/30 flex items-center justify-center rounded-lg flex-shrink-0">
                <DollarSign size={20} className="text-blue-400" strokeWidth={2} />
              </div>
            </div>
          </div>

          {/* Este Mes */}
          <div className="bg-zinc-900 p-4 rounded-lg border-2 border-zinc-800">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-zinc-400 text-sm font-bold uppercase">Este Mes</p>
                <p className="text-2xl md:text-3xl font-bold text-white mt-1 truncate">{stats.esteMes}</p>
                <p className="text-xs text-zinc-500 mt-1">pagos</p>
              </div>
              <div className="w-10 h-10 bg-purple-500/20 border-2 border-purple-500/30 flex items-center justify-center rounded-lg flex-shrink-0">
                <Calendar size={20} className="text-purple-400" strokeWidth={2} />
              </div>
            </div>
          </div>

          {/* Promedio Mensual */}
          <div className="bg-zinc-900 p-4 rounded-lg border-2 border-zinc-800">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-zinc-400 text-sm font-bold uppercase">Promedio</p>
                <p className="text-lg md:text-xl lg:text-2xl font-bold text-white mt-1 break-words">{formatearMoneda(stats.promedioMensual, 'ARS')}</p>
                <p className="text-xs text-zinc-500 mt-1">por mes</p>
              </div>
              <div className="w-10 h-10 bg-orange-500/20 border-2 border-orange-500/30 flex items-center justify-center rounded-lg flex-shrink-0">
                <CreditCard size={20} className="text-orange-400" strokeWidth={2} />
              </div>
            </div>
          </div>

          {/* Próximos Vencimientos */}
          <div className="bg-zinc-900 p-4 rounded-lg border-2 border-zinc-800">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-zinc-400 text-sm font-bold uppercase">Próx. Venc.</p>
                <p className="text-2xl md:text-3xl font-bold text-white mt-1 truncate">{paidPayments.filter(p => calcularProximoVencimiento(p.fechavencimiento)).length}</p>
                <p className="text-xs text-zinc-500 mt-1">facturas</p>
              </div>
              <div className="w-10 h-10 bg-orange-500/20 border-2 border-orange-500/30 flex items-center justify-center rounded-lg flex-shrink-0">
                <Clock size={20} className="text-orange-400" strokeWidth={2} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Filters Bar */}
        <div className="mb-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} strokeWidth={2} />
            <input 
              type="text" 
              placeholder="BUSCAR FACTURAS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border-2 border-zinc-700 rounded-lg font-bold text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <select 
            value={filterPeriod} 
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 bg-zinc-900 border-2 border-zinc-700 rounded-lg text-white font-bold uppercase text-xs hover:bg-zinc-800 focus:outline-none"
          >
            <option value="all">TODOS LOS PERÍODOS</option>
            {availableMonths.map(month => (
              <option key={month} value={month}>
                {new Date(month + '-02').toLocaleString('es-ES', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-zinc-900 border-2 border-zinc-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-black/30 text-zinc-400 border-b-2 border-zinc-700">
                  <th className="px-4 py-3 text-left font-bold text-xs uppercase">Descripción</th>
                  <th className="px-4 py-3 text-right font-bold text-xs uppercase">Monto</th>
                  <th className="px-4 py-3 text-center hidden sm:table-cell font-bold text-xs uppercase">Vencimiento</th>
                  <th className="px-4 py-3 text-center hidden md:table-cell font-bold text-xs uppercase">Próximo</th>
                  <th className="px-4 py-3 text-center font-bold text-xs uppercase">Pagado</th>
                  <th className="px-4 py-3 text-center hidden lg:table-cell font-bold text-xs uppercase">Método</th>
                  <th className="px-4 py-3 text-center font-bold text-xs uppercase">Factura</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-zinc-800">
                {paginatedPayments.map((payment) => {
                  const proximoVencimiento = calcularProximoVencimiento(
                    payment.fechavencimiento, 
                    payment.periodicidad || 'mensual'
                  );
                  
                  return (
                    <tr key={payment.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-white text-sm">{payment.nombre || 'Sin descripción'}</p>
                        <p className="text-xs text-zinc-400 mt-1">{payment.descripcion || 'N/A'}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-white">
                            {formatearMoneda(Math.abs(parseFloat(payment.monto || 0)), payment.moneda || 'ARS')}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-zinc-300 text-sm font-medium">
                          {formatearFecha(payment.fechavencimiento)}
                          </span>
                          <Calendar size={12} className="text-zinc-500" />
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-center">
                        <div className="flex flex-col items-center gap-1">
                          {proximoVencimiento ? (
                            <>
                              <span className="text-orange-400 text-sm font-medium">
                                {formatearFecha(proximoVencimiento)}
                              </span>
                              <Clock size={12} className="text-orange-500" />
                            </>
                          ) : (
                            <span className="text-zinc-500 text-xs">N/A</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-green-400 font-bold text-sm">
                              {formatearFecha(payment.fechapago)}
                          </span>
                          <CheckCircle size={12} className="text-green-500" />
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-center">
                        <span className="px-2 py-1 text-xs font-medium rounded-md bg-zinc-700 text-zinc-300 border border-zinc-600">
                          N/A
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                          {normalizeDocumentPreviewUrl(payment.url_pdf || '').isValid && (
                          <button
                              onClick={() => handleViewInvoice(payment)}
                            className="px-3 py-2 bg-blue-600/50 border border-blue-500/50 text-white text-xs font-bold rounded-md hover:bg-blue-600/80 flex items-center justify-center gap-1.5"
                          >
                            <FileText size={14} />
                            <ExternalLink size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
              </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 bg-black/30 border-t-2 border-zinc-700 flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-zinc-400">
                Página {currentPage} de {totalPages}
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-zinc-700 border-2 border-zinc-600 text-white font-bold text-xs uppercase rounded-md hover:bg-zinc-600 disabled:opacity-50"
                >
                  ←
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-zinc-700 border-2 border-zinc-600 text-white font-bold text-xs uppercase rounded-md hover:bg-zinc-600 disabled:opacity-50"
                  >
                  →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaidInvoicesView;
