import React, { useState, useEffect } from 'react';
import { X, DollarSign, CreditCard, Calendar, FileText, ChevronDown, Check, Loader2, Save } from 'lucide-react';
import FileUpload from '../FileUpload/FileUpload';

export const PaymentModal = ({
  isOpen,
  onClose,
  onSave,
  paymentItem,
  paymentMethods = [],
  categories = [],
  type = 'pending_payment',
  initialAmountType = 'total'
}) => {
  const [formData, setFormData] = useState({
    monto: 0,
    montoUSD: 0,
    moneda: 'ARS',
    fecha_pago: new Date().toISOString().split('T')[0],
    metodo_pago_id: '',
    categoria_id: '',
    notas: '',
    comprobante: null,
    tipo_cambio: '',
    pesos_para_usd: 0,
    tipo_dolar: 'oficial'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showExchangeFields, setShowExchangeFields] = useState(false);
  const [payARS, setPayARS] = useState(true);
  const [payUSD, setPayUSD] = useState(false);
  const [descontarPesosPorUSD, setDescontarPesosPorUSD] = useState(true);

  useEffect(() => {
    if (paymentItem && isOpen) {
      if (type === 'pending_payment') {
        setFormData({
          monto: paymentItem.monto || 0,
          montoUSD: 0,
          moneda: paymentItem.moneda || 'ARS',
          fecha_pago: new Date().toISOString().split('T')[0],
          metodo_pago_id: paymentItem.metodos_pago_id || paymentItem.metodo_pago_id || paymentItem.MetodosPagoId || '',
          categoria_id: paymentItem.categorias_id || paymentItem.categoria_id || paymentItem.CategoriasId || '',
          notas: `Pago de: ${paymentItem.nombre || 'Pago pendiente'}`,
          comprobante: null,
          tipo_cambio: '',
          pesos_para_usd: 0,
          tipo_dolar: 'oficial'
        });
        setPayARS(true);
        setPayUSD(false);
        setShowExchangeFields(false);
      } else if (type === 'bank_summary') {
        const totales = paymentItem.totales || {};
        
        let amountARS = 0;
        let amountUSD = 0;

        if (initialAmountType === 'minimo') {
             amountARS = parseFloat(totales.pago_minimo_pesos || 0);
             amountUSD = parseFloat(totales.pago_minimo_dolares || 0);
        } else {
             amountARS = parseFloat(totales.saldo_actual_pesos || 0);
             amountUSD = parseFloat(totales.saldo_actual_dolares || 0);
        }

        const yaPayARS = paymentItem.pagado_ars || false;
        const yaPagadoUSD = paymentItem.pagado_usd || false;

        setFormData({
          monto: yaPayARS ? 0 : amountARS,
          montoUSD: yaPagadoUSD ? 0 : amountUSD,
          moneda: 'ARS',
          fecha_pago: new Date().toISOString().split('T')[0],
          metodo_pago_id: '',
          categoria_id: '',
          notas: `Pago de resumen ${paymentItem.banco || ''} ${paymentItem.tipo_tarjeta || ''} - ${paymentItem.numero_resumen || ''} (${initialAmountType === 'minimo' ? 'Pago Mínimo' : 'Pago Total'})`,
          comprobante: null,
          tipo_cambio: '',
          pesos_para_usd: 0,
          tipo_dolar: 'oficial'
        });
        setPayARS(!yaPayARS && amountARS > 0);
        setPayUSD(!yaPagadoUSD && amountUSD > 0);
        setShowExchangeFields(!yaPagadoUSD && amountUSD > 0);
      }
    }
  }, [paymentItem, isOpen, type, initialAmountType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!payARS && !payUSD) {
      alert('⚠️ Debes seleccionar al menos un tipo de pago (ARS o USD)');
      return;
    }
    
    setIsLoading(true);

    try {
      let enhancedFormData = { ...formData };
      
      // 🔧 Asegurar que los montos siempre sean números válidos
      if (!payARS) {
        enhancedFormData.monto = 0;
      } else {
        enhancedFormData.monto = parseFloat(formData.monto) || 0;
      }
      
      if (!payUSD) {
        enhancedFormData.montoUSD = 0;
        enhancedFormData.tipo_cambio = null;
        enhancedFormData.pesos_para_usd = null;
      } else {
        enhancedFormData.montoUSD = parseFloat(formData.montoUSD) || 0;
        // 🔧 Convertir strings vacías a null o números válidos
        enhancedFormData.tipo_cambio = formData.tipo_cambio ? parseFloat(formData.tipo_cambio) : null;
        enhancedFormData.pesos_para_usd = formData.pesos_para_usd ? parseFloat(formData.pesos_para_usd) : null;
      }
      
      enhancedFormData.descontar_pesos_por_usd = descontarPesosPorUSD;
      
      if (payUSD && formData.montoUSD > 0 && formData.tipo_cambio > 0) {
        const tipoCambioNum = parseFloat(formData.tipo_cambio) || 0;
        const pesosParaUsdNum = parseFloat(formData.pesos_para_usd) || 0;
        const montoUSDNum = parseFloat(formData.montoUSD) || 0;
        const exchangeInfo = `\n📊 Tipo de cambio: ${formData.tipo_dolar.toUpperCase()} - $${tipoCambioNum.toFixed(2)} ARS/USD\n💵 Pesos usados: $${pesosParaUsdNum.toFixed(2)} ARS para U$D ${montoUSDNum.toFixed(2)}`;
        enhancedFormData.notas = (formData.notas || '') + exchangeInfo;
      }
      
      console.log('📤 Enviando pago con datos validados:', enhancedFormData);
      
      await onSave(enhancedFormData);
      onClose();
      // Reset form
      setFormData({
        monto: 0,
        montoUSD: 0,
        tipo_cambio: '',
        pesos_para_usd: 0,
        tipo_dolar: 'oficial',
        moneda: 'ARS',
        fecha_pago: new Date().toISOString().split('T')[0],
        metodo_pago_id: '',
        categoria_id: '',
        notas: '',
        comprobante: null
      });
      setShowExchangeFields(false);
      setPayARS(true);
      setPayUSD(false);
      setDescontarPesosPorUSD(true);
    } catch (error) {
      console.error('Error saving payment:', error);
      alert('Error al guardar el pago: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (url) => {
    setFormData(prev => ({ ...prev, comprobante: url }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-8">
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl bg-[#09090b] rounded-xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh] z-[1001]">
        
        {/* Header Compacto */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#09090b]">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Registrar Pago
            </h2>
            <p className="text-xs text-zinc-500">
              {type === 'pending_payment' ? 'Pago pendiente' : 'Resumen bancario'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/5 rounded-full transition-colors group"
          >
            <X className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">
            
            {/* Currency Inputs - Cleaner Design */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* ARS Input */}
              <div className={`p-4 rounded-xl border transition-all ${
                payARS 
                  ? 'bg-blue-500/5 border-blue-500/30' 
                  : 'bg-zinc-900/30 border-white/5 opacity-60 hover:opacity-80'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      payARS ? 'bg-blue-500 border-blue-500' : 'border-zinc-600'
                    }`}>
                      {payARS && <Check size={10} className="text-white" />}
                    </div>
                    <input 
                      type="checkbox" 
                      checked={payARS} 
                      onChange={(e) => {
                        setPayARS(e.target.checked);
                        if (!e.target.checked) setFormData({ ...formData, monto: 0 });
                      }}
                      className="hidden" 
                    />
                    <span className={`text-xs font-bold ${payARS ? 'text-blue-400' : 'text-zinc-500'}`}>
                      PESOS (ARS)
                    </span>
                  </label>
                </div>
                
                <div className="relative">
                  <span className={`absolute left-0 top-1/2 -translate-y-1/2 text-lg font-medium transition-colors ${payARS ? 'text-blue-500' : 'text-zinc-600'}`}>$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={payARS ? formData.monto : ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      setFormData({ ...formData, monto: parseFloat(value) || 0 });
                    }}
                    disabled={!payARS}
                    placeholder="0.00"
                    className={`w-full bg-transparent border-none focus:ring-0 pl-5 py-1 text-2xl font-bold focus:outline-none transition-colors ${
                      payARS ? 'text-white placeholder-zinc-700' : 'text-zinc-600 cursor-not-allowed'
                    }`}
                  />
                </div>
              </div>

              {/* USD Input */}
              <div className={`p-4 rounded-xl border transition-all ${
                payUSD 
                  ? 'bg-emerald-500/5 border-emerald-500/30' 
                  : 'bg-zinc-900/30 border-white/5 opacity-60 hover:opacity-80'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      payUSD ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600'
                    }`}>
                      {payUSD && <Check size={10} className="text-white" />}
                    </div>
                    <input 
                      type="checkbox" 
                      checked={payUSD} 
                      onChange={(e) => {
                        setPayUSD(e.target.checked);
                        setShowExchangeFields(e.target.checked && formData.montoUSD > 0);
                        if (!e.target.checked) {
                          setFormData({ ...formData, montoUSD: 0, tipo_cambio: '', pesos_para_usd: 0 });
                          setShowExchangeFields(false);
                        }
                      }}
                      className="hidden" 
                    />
                    <span className={`text-xs font-bold ${payUSD ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      DÓLARES (USD)
                    </span>
                  </label>
                </div>
                
                <div className="relative">
                  <span className={`absolute left-0 top-1/2 -translate-y-1/2 text-lg font-medium transition-colors ${payUSD ? 'text-emerald-500' : 'text-zinc-600'}`}>u$d</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={payUSD ? formData.montoUSD : ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      const usdAmount = parseFloat(value) || 0;
                      setFormData({ ...formData, montoUSD: usdAmount });
                      setShowExchangeFields(payUSD && usdAmount > 0);
                    }}
                    disabled={!payUSD}
                    placeholder="0.00"
                    className={`w-full bg-transparent border-none focus:ring-0 pl-9 py-1 text-2xl font-bold focus:outline-none transition-colors ${
                      payUSD ? 'text-white placeholder-zinc-700' : 'text-zinc-600 cursor-not-allowed'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Exchange Fields (Conditional) */}
            {payUSD && showExchangeFields && formData.montoUSD > 0 && (
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-3 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign size={14} className="text-emerald-400" />
                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Conversión y Tipo de Cambio</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 font-medium">Tipo Dólar</label>
                    <div className="relative">
                        <select
                        value={formData.tipo_dolar}
                        onChange={(e) => setFormData({ ...formData, tipo_dolar: e.target.value })}
                        className="w-full p-2 bg-zinc-900/80 border border-emerald-500/30 rounded-lg text-xs text-white appearance-none focus:outline-none focus:border-emerald-500"
                        >
                        <option value="oficial">🏦 Oficial</option>
                        <option value="blue">💵 Blue</option>
                        <option value="mep">📈 MEP</option>
                        <option value="ccl">🌍 CCL</option>
                        <option value="cripto">₿ Cripto</option>
                        <option value="tarjeta">💳 Tarjeta</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-2.5 text-zinc-500 pointer-events-none" />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 font-medium">Cotización</label>
                    <div className="relative">
                        <span className="absolute left-2 top-2 text-zinc-500 text-xs">$</span>
                        <input
                        type="number"
                        value={formData.tipo_cambio}
                        onChange={(e) => {
                            const tc = parseFloat(e.target.value) || 0;
                            setFormData({ 
                            ...formData, 
                            tipo_cambio: tc,
                            pesos_para_usd: (formData.montoUSD * tc).toFixed(2)
                            });
                        }}
                        placeholder="0.00"
                        className="w-full p-2 pl-5 bg-zinc-900/80 border border-emerald-500/30 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer mt-2 group">
                    <input
                      type="checkbox"
                      checked={descontarPesosPorUSD}
                      onChange={(e) => setDescontarPesosPorUSD(e.target.checked)}
                      className="rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-offset-0 focus:ring-emerald-500/50"
                    />
                    <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">
                        Descontar ${parseFloat(formData.pesos_para_usd || 0).toLocaleString('es-AR')} de mi saldo en pesos
                    </span>
                </label>
              </div>
            )}

            {/* Main Form Fields Grid */}
            <div className="grid grid-cols-2 gap-4">
                {/* Date */}
                <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-400">Fecha</label>
                    <input
                        type="date"
                        value={formData.fecha_pago}
                        onChange={(e) => setFormData({ ...formData, fecha_pago: e.target.value })}
                        className="w-full p-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                </div>

                {/* Method */}
                <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-400">Método de Pago</label>
                    <div className="relative">
                        <select
                            value={formData.metodo_pago_id}
                            onChange={(e) => setFormData({ ...formData, metodo_pago_id: e.target.value })}
                            className="w-full p-2 bg-zinc-900/50 border border-white/10 rounded-lg text-xs text-white appearance-none cursor-pointer focus:border-blue-500 focus:outline-none"
                        >
                            <option value="">Seleccionar...</option>
                            {paymentMethods.map((method) => (
                                <option key={method.id} value={method.id}>
                                    {method.nombre || method.Nombre}
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-2.5 text-zinc-500 pointer-events-none" />
                    </div>
                </div>

                {/* Category */}
                <div className="col-span-2 space-y-1">
                    <label className="text-xs font-medium text-zinc-400">Categoría</label>
                    <div className="relative">
                        <select
                            value={formData.categoria_id}
                            onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                            className="w-full p-2 bg-zinc-900/50 border border-white/10 rounded-lg text-xs text-white appearance-none cursor-pointer focus:border-blue-500 focus:outline-none"
                        >
                            <option value="">Seleccionar categoría...</option>
                            {categories
                                .filter(cat => cat.tipo === 'gasto' || cat.Tipo === 'gasto')
                                .map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.nombre || category.Nombre}
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-2.5 text-zinc-500 pointer-events-none" />
                    </div>
                </div>

                {/* Notes */}
                <div className="col-span-2 space-y-1">
                    <label className="text-xs font-medium text-zinc-400">Notas</label>
                    <textarea
                        value={formData.notas}
                        onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                        rows={2}
                        placeholder="Detalles adicionales..."
                        className="w-full p-2 bg-zinc-900/50 border border-white/10 rounded-lg text-xs text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none resize-none"
                    />
                </div>

                {/* Attachment */}
                <div className="col-span-2 space-y-1">
                    <label className="text-xs font-medium text-zinc-400">Comprobante</label>
                    <FileUpload
                        onFileUploaded={handleFileUpload}
                        currentFileUrl={formData.comprobante}
                        prefix="comprobantes"
                        maxSizeMB={10}
                        showPreview={true}
                    />
                </div>
            </div>

          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/5 bg-[#09090b] flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white font-medium hover:bg-white/5 rounded-lg transition-all"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold rounded-lg shadow-lg disabled:opacity-50 flex items-center gap-1.5"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
            Registrar Pago
          </button>
        </div>
      </div>
    </div>
  );
};
