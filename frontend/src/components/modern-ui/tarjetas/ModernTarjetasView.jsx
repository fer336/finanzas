import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Plus, Upload, Calendar, CreditCard, ChevronDown, ChevronUp, Edit, Trash2, CheckCircle } from 'lucide-react';

const ModernTarjetasView = ({ 
  transactions = [], 
  categories = [],
  paymentMethods = [],
  onPagarTarjeta, 
  onUploadResumen, 
  onNewTarjeta,
  onEditTransaction,
  onDeleteTransaction,
  onMarkAsPaid
}) => {
  const [expandedCard, setExpandedCard] = useState(null);

  // Agrupar transacciones por método de pago (tarjeta)
  const tarjetasAgrupadas = useMemo(() => {
    if (transactions.length === 0) return [];

    const grupos = {};

    transactions.forEach(t => {
      const metodoPago = t.metodoPago || t.MetodosPago?.nombre || 'Tarjeta Sin Nombre';
      const metodoPagoId = t.metodo_pago_id || t.metodos_pago_id;

      if (!grupos[metodoPagoId]) {
        grupos[metodoPagoId] = {
          id: metodoPagoId,
          nombre: metodoPago,
          transacciones: [],
          deudaTotal: 0
        };
      }

      grupos[metodoPagoId].transacciones.push(t);
      grupos[metodoPagoId].deudaTotal += Math.abs(parseFloat(t.monto_ars || 0));
    });

    return Object.values(grupos).sort((a, b) => b.deudaTotal - a.deudaTotal);
  }, [transactions]);

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
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const deudaTotal = tarjetasAgrupadas.reduce((sum, tarjeta) => sum + tarjeta.deudaTotal, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 pb-32">
      {/* Header con Total */}
      <div className="mb-6 bg-gradient-to-br from-[#ec4899]/10 to-[#ec4899]/5 rounded-3xl p-6 border border-[#ec4899]/20">
        <h1 className="text-2xl font-bold text-white mb-2">💳 Deuda de Tarjetas de Crédito</h1>
        <p className="text-sm text-gray-400 mb-4">
          {tarjetasAgrupadas.length} tarjeta{tarjetasAgrupadas.length !== 1 ? 's' : ''} con {transactions.length} transaccione{transactions.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-gray-500">DEUDA TOTAL</span>
          <span className="text-4xl font-bold text-[#ec4899]">{formatCurrency(deudaTotal)}</span>
        </div>
      </div>

      {/* Tarjetas */}
      {tarjetasAgrupadas.length === 0 ? (
        <div className="text-center py-12">
          <CreditCard className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No hay gastos con tarjeta de crédito</h3>
          <p className="text-gray-400 mb-6">
            Los gastos marcados como tarjeta de crédito aparecerán aquí
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {tarjetasAgrupadas.map((tarjeta) => {
            const isExpanded = expandedCard === tarjeta.id;
            
            return (
              <div 
                key={tarjeta.id} 
                className="bg-[#18181b] rounded-3xl border border-white/5 overflow-hidden"
              >
                {/* Header de la tarjeta */}
                <div 
                  className="p-6 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setExpandedCard(isExpanded ? null : tarjeta.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-[#ec4899]/10 flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-6 h-6 text-[#ec4899]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white truncate">{tarjeta.nombre}</h3>
                        <p className="text-sm text-gray-400">
                          {tarjeta.transacciones.length} transacción{tarjeta.transacciones.length !== 1 ? 'es' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">DEUDA</p>
                        <p className="text-2xl font-bold text-[#ec4899]">
                          {formatCurrency(tarjeta.deudaTotal)}
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Lista de transacciones (expandible) */}
                {isExpanded && (
                  <div className="border-t border-white/5">
                    <div className="p-6 bg-[#0a0a0a]/50">
                      <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wide">
                        Detalle de Transacciones
                      </h4>
                      <div className="space-y-2">
                        {tarjeta.transacciones.map((t) => (
                          <div 
                            key={t.id} 
                            className="flex items-center justify-between p-4 bg-[#18181b] rounded-xl hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={`w-2 h-2 rounded-full ${t.color} flex-shrink-0`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                  {t.descripcion}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-xs text-gray-500">
                                    {t.categoria}
                                  </p>
                                  <span className="text-gray-600">•</span>
                                  <p className="text-xs text-gray-500">
                                    {formatDate(t.fecha_transaccion)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <p className="text-base font-bold text-[#ec4899]">
                                {formatCurrency(Math.abs(t.monto_ars))}
                              </p>
                              <div className="flex gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onMarkAsPaid && onMarkAsPaid(t);
                                  }}
                                  className="p-2 hover:bg-green-500/10 rounded-lg transition-colors"
                                  title="Marcar como Pagado"
                                >
                                  <CheckCircle className="w-4 h-4 text-green-500 hover:text-green-400" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    console.log('✏️ Editando transacción:', t);
                                    onEditTransaction && onEditTransaction(t);
                                  }}
                                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <Edit className="w-4 h-4 text-gray-400 hover:text-white" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteTransaction && onDeleteTransaction(t.id);
                                  }}
                                  className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Botones Flotantes */}
      <div className="fixed bottom-24 right-8 flex flex-col gap-3 z-40">
        <button 
          onClick={onUploadResumen} 
          className="w-14 h-14 rounded-full bg-[#18181b] border-2 border-white/10 flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-110 transition-all" 
          title="Subir Resumen"
        >
          <Upload className="w-5 h-5 text-gray-400" />
        </button>
        <button 
          onClick={onNewTarjeta} 
          className="w-14 h-14 rounded-full bg-gradient-to-br from-[#10b981] to-[#34d399] flex items-center justify-center shadow-xl shadow-green-500/30 hover:shadow-2xl hover:scale-110 transition-all" 
          title="Nueva Transacción con Tarjeta"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
};

ModernTarjetasView.propTypes = { 
  transactions: PropTypes.array,
  categories: PropTypes.array,
  paymentMethods: PropTypes.array,
  onPagarTarjeta: PropTypes.func, 
  onUploadResumen: PropTypes.func, 
  onNewTarjeta: PropTypes.func,
  onEditTransaction: PropTypes.func,
  onDeleteTransaction: PropTypes.func,
  onMarkAsPaid: PropTypes.func
};

export default ModernTarjetasView;
