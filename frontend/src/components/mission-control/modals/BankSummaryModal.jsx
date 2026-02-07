import React, { useState, useEffect } from 'react';
import { X, Building2, CreditCard, Calendar, DollarSign, FileText, Trash2, CheckCircle, Save } from 'lucide-react';
import { useAmountVisibility } from '../../../contexts/AmountVisibilityContext';

export const BankSummaryModal = ({ isOpen, onClose, onDelete, onSave, onPay, bankSummary = null }) => {
  const { formatAmount } = useAmountVisibility();
  const [localSummary, setLocalSummary] = useState(bankSummary);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalSummary(bankSummary);
    setHasChanges(false);
  }, [bankSummary]);

  if (!isOpen || !localSummary) return null;

  const totales = localSummary.totales || {};
  const limites = localSummary.limites || {};
  const cicloFacturacion = localSummary.ciclo_facturacion || {};

  const formatCurrency = (amount, currency = 'ARS') => {
    if (!amount) return '$ 0,00';
    return formatAmount(amount, { decimals: 2 });
  };

  // Helper to parse Spanish dates (e.g., "11-Dic-2024")
  const parseSpanishDate = (dateString) => {
    if (!dateString || dateString === '0') return null;
    
    // Clean string
    const cleanStr = dateString.toString().toLowerCase().trim();
    if (cleanStr === 'invalid date') return null;
    
    // Try standard date first
    let date = new Date(dateString);
    if (!isNaN(date.getTime()) && date.getFullYear() > 2000) return date;
    
    // Map Spanish months
    const months = {
        'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11,
        'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
        'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
    };
    
    // Regex for DD-MMM-YY or DD-MMM-YYYY or DD de MMM de YYYY
    // Also supports DD-MMM without year
    const match = cleanStr.match(/(\d{1,2})[-/ .]+(?:de )?([a-z]{3,})(?:[-/ .]+(?:de )?(\d{2,4}))?/);
    if (match) {
        const day = parseInt(match[1]);
        const monthStr = match[2];
        let year = match[3] ? parseInt(match[3]) : new Date().getFullYear();
        
        if (year < 100) year += 2000;
        
        const month = months[monthStr.substring(0, 3)];
        if (month !== undefined) {
             if (!match[3]) {
                 const now = new Date();
                 if (month < now.getMonth() - 6) {
                     year++;
                 }
             }
            return new Date(year, month, day);
        }
    }
    
    return null;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = parseSpanishDate(dateString);
    if (!date) return '-';
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleToggleStatus = (field) => {
      const newValue = !localSummary[field];
      setLocalSummary(prev => ({ ...prev, [field]: newValue }));
      setHasChanges(true);
  };

  const handleSave = () => {
      if (onSave) {
          onSave(localSummary);
          setHasChanges(false);
      }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-background border border-primary rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-white/10 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-white text-xl font-bold">Detalles del Resumen Bancario</h2>
              <p className="text-muted-foreground text-sm">{localSummary.banco} - {localSummary.tipo_tarjeta}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Información General */}
          <div className="glass-panel p-4">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-cyan-400" />
              Información General
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Banco</p>
                <p className="text-white font-medium">{bankSummary.banco || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Tipo de Tarjeta</p>
                <p className="text-white font-medium">{bankSummary.tipo_tarjeta || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Número de Resumen</p>
                <p className="text-white font-medium font-mono text-sm">{bankSummary.numero_resumen || '-'}</p>
              </div>
              {bankSummary.url_factura && (
                <div className="col-span-full">
                  <p className="text-muted-foreground text-xs mb-1">Factura PDF</p>
                  <button
                    onClick={() => window.open(bankSummary.url_factura, '_blank')}
                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                  >
                    <FileText className="w-4 h-4" />
                    Ver PDF
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Ciclo de Facturación */}
          <div className="glass-panel p-4">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              Ciclo de Facturación
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Cierre Anterior</p>
                <p className="text-white font-medium">{formatDate(cicloFacturacion.cierre_anterior)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Cierre Actual</p>
                <p className="text-white font-medium">{formatDate(cicloFacturacion.cierre_actual)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Próximo Cierre</p>
                <p className="text-white font-medium">{formatDate(cicloFacturacion.proximo_cierre)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Vencimiento Actual</p>
                <p className="text-white font-medium text-yellow-400">{formatDate(cicloFacturacion.vencimiento_actual)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Próximo Vencimiento</p>
                <p className="text-white font-medium">{formatDate(cicloFacturacion.proximo_vencimiento)}</p>
              </div>
            </div>
          </div>

          {/* Totales */}
          <div className="glass-panel p-4">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-cyan-400" />
              Totales y Saldos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pesos */}
              <div className="space-y-3">
                <p className="text-cyan-400 font-semibold text-sm">En Pesos (ARS)</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-muted-foreground text-sm">Saldo Anterior</span>
                    <span className="text-white font-medium">{formatCurrency(totales.saldo_anterior_pesos)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-muted-foreground text-sm">Suma de Compras</span>
                    <span className="text-red-400 font-medium">+{formatCurrency(totales.suma_compras_pesos)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-muted-foreground text-sm">Suma de Pagos</span>
                    <span className="text-green-400 font-medium">-{formatCurrency(totales.suma_pagos_pesos)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 bg-white/5 rounded-lg px-3">
                    <span className="text-white font-semibold">Saldo Actual</span>
                    <span className="text-white font-bold text-lg">{formatCurrency(totales.saldo_actual_pesos)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-muted-foreground text-sm">Pago Mínimo</span>
                    <span className="text-yellow-400 font-medium">{formatCurrency(totales.pago_minimo_pesos)}</span>
                  </div>
                </div>
              </div>

              {/* Dólares */}
              <div className="space-y-3">
                <p className="text-blue-400 font-semibold text-sm">En Dólares (USD)</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-muted-foreground text-sm">Saldo Anterior</span>
                    <span className="text-white font-medium">{formatCurrency(totales.saldo_anterior_dolares, 'USD')}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-muted-foreground text-sm">Suma de Compras</span>
                    <span className="text-red-400 font-medium">+{formatCurrency(totales.suma_compras_dolares, 'USD')}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-muted-foreground text-sm">Suma de Pagos</span>
                    <span className="text-green-400 font-medium">-{formatCurrency(totales.suma_pagos_dolares, 'USD')}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 bg-white/5 rounded-lg px-3">
                    <span className="text-white font-semibold">Saldo Actual</span>
                    <span className="text-white font-bold text-lg">{formatCurrency(totales.saldo_actual_dolares, 'USD')}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-muted-foreground text-sm">Pago Mínimo</span>
                    <span className="text-yellow-400 font-medium">{formatCurrency(totales.pago_minimo_dolares, 'USD')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Límites */}
          <div className="glass-panel p-4">
            <h3 className="text-white font-bold mb-4">Límites de Crédito</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Límite de Compras</p>
                <p className="text-white font-medium">{formatCurrency(limites.compras)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Límite de Adelantos</p>
                <p className="text-white font-medium">{formatCurrency(limites.adelantos)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Límite Total</p>
                <p className="text-white font-medium">{formatCurrency(limites.total)}</p>
              </div>
            </div>
            {limites.compras > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Uso del límite</span>
                  <span className="text-white font-medium">
                    {((totales.saldo_actual_pesos / limites.compras) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${(totales.saldo_actual_pesos / limites.compras) * 100 > 80
                      ? 'bg-red-500'
                      : (totales.saldo_actual_pesos / limites.compras) * 100 > 50
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                      }`}
                    style={{ width: `${Math.min((totales.saldo_actual_pesos / limites.compras) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Estado de Pago */}
          <div className="glass-panel p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-cyan-400" />
                    Estado de Pago
                </h3>
                {hasChanges && (
                    <span className="text-yellow-400 text-xs animate-pulse">
                        Cambios sin guardar
                    </span>
                )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div 
                className={`p-4 rounded-xl border transition-all cursor-pointer ${localSummary.total_pagado 
                    ? 'bg-green-500/10 border-green-500/50' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                onClick={() => handleToggleStatus('total_pagado')}
              >
                <div className="flex items-center justify-between mb-2">
                    <p className="text-muted-foreground text-xs">Total Pagado</p>
                    <div className={`w-4 h-4 rounded-full border ${localSummary.total_pagado ? 'bg-green-500 border-green-500' : 'border-gray-500'}`}>
                        {localSummary.total_pagado && <CheckCircle className="w-full h-full text-black p-0.5" />}
                    </div>
                </div>
                <p className={`font-bold text-lg ${localSummary.total_pagado ? 'text-green-400' : 'text-white'}`}>
                  {localSummary.total_pagado ? 'Pagado' : 'Pendiente'}
                </p>
              </div>

              <div 
                className={`p-4 rounded-xl border transition-all cursor-pointer ${localSummary.minimo_pagado 
                    ? 'bg-yellow-500/10 border-yellow-500/50' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                onClick={() => handleToggleStatus('minimo_pagado')}
              >
                <div className="flex items-center justify-between mb-2">
                    <p className="text-muted-foreground text-xs">Mínimo Pagado</p>
                    <div className={`w-4 h-4 rounded-full border ${localSummary.minimo_pagado ? 'bg-yellow-500 border-yellow-500' : 'border-gray-500'}`}>
                        {localSummary.minimo_pagado && <CheckCircle className="w-full h-full text-black p-0.5" />}
                    </div>
                </div>
                <p className={`font-bold text-lg ${localSummary.minimo_pagado ? 'text-yellow-400' : 'text-white'}`}>
                  {localSummary.minimo_pagado ? 'Pagado' : 'Pendiente'}
                </p>
              </div>

              {/* Vencido Toggle */}
              <div 
                className={`p-4 rounded-xl border transition-all cursor-pointer col-span-2 ${localSummary.vencido 
                    ? 'bg-red-500/10 border-red-500/50' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                onClick={() => handleToggleStatus('vencido')}
              >
                <div className="flex items-center justify-between mb-2">
                    <p className="text-muted-foreground text-xs">Forzar Vencido (Manual)</p>
                    <div className={`w-4 h-4 rounded-full border ${localSummary.vencido ? 'bg-red-500 border-red-500' : 'border-gray-500'}`}>
                        {localSummary.vencido && <CheckCircle className="w-full h-full text-black p-0.5" />}
                    </div>
                </div>
                <p className={`font-bold text-lg ${localSummary.vencido ? 'text-red-400' : 'text-white'}`}>
                  {localSummary.vencido ? 'Vencido' : 'No Vencido'}
                </p>
                <p className="text-[10px] text-gray-500 mt-1">
                    * Si activas esto, el resumen se considerará vencido independientemente de la fecha.
                </p>
              </div>
            </div>

            {/* Acciones de Pago con Comprobante */}
            {onPay && !localSummary.total_pagado && (
                <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-white font-bold text-sm mb-3">Registrar Pago (Generar Gasto)</p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                onPay(localSummary, 'total');
                                onClose();
                            }}
                            className="flex-1 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <DollarSign className="w-4 h-4" />
                            Pagar Total
                        </button>
                        {!localSummary.minimo_pagado && (
                            <button
                                onClick={() => {
                                    onPay(localSummary, 'minimo');
                                    onClose();
                                }}
                                className="flex-1 px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <DollarSign className="w-4 h-4" />
                                Pagar Mínimo
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        * Esto creará una transacción de gasto y permitirá subir comprobante.
                    </p>
                </div>
            )}
          </div>

          {/* Notas */}
          {localSummary.notas && (
            <div className="glass-panel p-4">
              <h3 className="text-white font-bold mb-2">Notas</h3>
              <p className="text-muted-foreground text-sm">{localSummary.notas}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background border-t border-white/10 p-6 flex justify-between items-center z-10">
          {/* Delete Button */}
          {onDelete && (
            <button
              onClick={() => {
                if (window.confirm('¿Estás seguro de que quieres eliminar este resumen bancario? Esta acción no se puede deshacer.')) {
                  onDelete(localSummary);
                  onClose();
                }
              }}
              className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 rounded-lg transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Eliminar
            </button>
          )}

          <div className="ml-auto flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
            >
              Cerrar
            </button>
            {hasChanges && (
                <button
                onClick={handleSave}
                className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors flex items-center gap-2 animate-in fade-in"
                >
                <Save className="w-5 h-5" />
                Guardar Cambios
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
