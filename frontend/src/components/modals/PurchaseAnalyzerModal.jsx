import React, { useState, useEffect } from 'react';
import { X, AlertCircle, DollarSign, TrendingUp, CheckCircle, Loader2 } from 'lucide-react';
import apiServices from '../../services/api';

const PurchaseAnalyzerModal = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [formData, setFormData] = useState({
    monto: '',
    categoria_id: ''
  });
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadCategorias();
      setResult(null);
      setFormData({ monto: '', categoria_id: '' });
    }
  }, [isOpen]);

  const loadCategorias = async () => {
    try {
      const response = await apiServices.categoriasApi.getAll();
      setCategorias(response.list || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleAnalyze = async () => {
    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      alert('Por favor ingresa un monto válido');
      return;
    }

    setLoading(true);

    try {
      const data = {
        monto: parseFloat(formData.monto),
        categoria_id: formData.categoria_id || null
      };

      const analysis = await apiServices.presupuestosApi.analyzePurchase(data);
      setResult(analysis);
    } catch (error) {
      console.error('Error analyzing purchase:', error);
      alert('Error al analizar la compra: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationIcon = () => {
    if (!result) return null;
    
    if (result.puede_comprar) {
      if (result.porcentaje_despues >= 90) {
        return <AlertCircle className="w-12 h-12 text-orange-400" />;
      }
      return <CheckCircle className="w-12 h-12 text-green-400" />;
    }
    return <AlertCircle className="w-12 h-12 text-red-400" />;
  };

  const getRecommendationColor = () => {
    if (!result) return 'blue';
    
    if (result.puede_comprar) {
      if (result.porcentaje_despues >= 90) return 'orange';
      return 'green';
    }
    return 'red';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-[#09090b] rounded-xl shadow-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#09090b]">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Analizar Compra</h2>
            <p className="text-zinc-400 mt-0.5 text-sm">Verifica si encaja en tu presupuesto</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors group"
          >
            <X className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!result ? (
            // Form
            <div className="space-y-4">
              {/* Monto */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400">Monto de la Compra *</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-xl font-bold text-purple-400">$</span>
                  <input
                    type="number"
                    value={formData.monto}
                    onChange={(e) => setFormData(prev => ({ ...prev, monto: e.target.value }))}
                    placeholder="0.00"
                    className="w-full pl-10 pr-3 py-3 bg-zinc-900/50 border border-white/10 rounded-lg text-2xl font-bold text-white placeholder-zinc-600 focus:border-purple-500 focus:outline-none"
                    step="0.01"
                    autoFocus
                  />
                </div>
              </div>

              {/* Categoría */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400">Categoría (opcional)</label>
                <select
                  value={formData.categoria_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoria_id: e.target.value }))}
                  className="w-full p-2.5 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="">Cualquier categoría</option>
                  {categorias.filter(c => c.tipo === 'gasto').map(c => (
                    <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Analyze Button */}
              <button
                onClick={handleAnalyze}
                disabled={loading || !formData.monto}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-bold rounded-lg shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <TrendingUp size={18} />
                    Analizar Impacto
                  </>
                )}
              </button>
            </div>
          ) : (
            // Result
            <div className="space-y-6">
              {/* Result Header */}
              <div className={`p-6 rounded-2xl border-2 ${
                getRecommendationColor() === 'green' ? 'bg-green-500/10 border-green-500/30' :
                getRecommendationColor() === 'orange' ? 'bg-orange-500/10 border-orange-500/30' :
                'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {getRecommendationIcon()}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-xl font-bold mb-2 ${
                      getRecommendationColor() === 'green' ? 'text-green-400' :
                      getRecommendationColor() === 'orange' ? 'text-orange-400' :
                      'text-red-400'
                    }`}>
                      {result.puede_comprar ? 
                        (result.porcentaje_despues >= 90 ? '⚠️ Precaución' : '✅ Puedes hacerlo') : 
                        '❌ No recomendado'
                      }
                    </h3>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      {result.recomendacion}
                    </p>
                  </div>
                </div>
              </div>

              {result.tiene_presupuesto && (
                <>
                  {/* Budget Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-zinc-900/50 rounded-lg border border-white/10">
                      <p className="text-xs text-zinc-500 mb-1">Presupuesto</p>
                      <p className="text-xl font-bold text-white">
                        ${result.limite?.toLocaleString('es-AR')}
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        {result.presupuesto?.nombre}
                      </p>
                    </div>

                    <div className="p-4 bg-zinc-900/50 rounded-lg border border-white/10">
                      <p className="text-xs text-zinc-500 mb-1">Días Restantes</p>
                      <p className="text-xl font-bold text-white">
                        {result.dias_restantes}
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        del período
                      </p>
                    </div>
                  </div>

                  {/* Before/After Comparison */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-white">Impacto de la Compra</h4>
                    
                    {/* Before */}
                    <div className="p-4 bg-zinc-900/30 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-500">Situación Actual</span>
                        <span className="text-xs font-bold text-zinc-400">
                          {result.porcentaje_antes?.toFixed(1)}%
                        </span>
                      </div>
                      <div className="relative w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-blue-500"
                          style={{ width: `${Math.min(result.porcentaje_antes, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400">
                          Gastado: ${result.gasto_actual?.toLocaleString('es-AR')}
                        </span>
                        <span className="text-zinc-400">
                          Disponible: ${result.disponible_antes?.toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>

                    {/* After */}
                    <div className="p-4 bg-zinc-900/50 border-2 border-purple-500/30 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-400">Después de la compra</span>
                        <span className={`text-xs font-bold ${
                          result.porcentaje_despues >= 100 ? 'text-red-400' :
                          result.porcentaje_despues >= 90 ? 'text-orange-400' :
                          'text-green-400'
                        }`}>
                          {result.porcentaje_despues?.toFixed(1)}%
                        </span>
                      </div>
                      <div className="relative w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`absolute top-0 left-0 h-full ${
                            result.porcentaje_despues >= 100 ? 'bg-red-500' :
                            result.porcentaje_despues >= 90 ? 'bg-orange-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(result.porcentaje_despues, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-300">
                          Gastado: ${result.gasto_despues?.toLocaleString('es-AR')}
                        </span>
                        <span className={
                          result.disponible_despues < 0 ? 'text-red-400' : 'text-zinc-300'
                        }>
                          Disponible: ${result.disponible_despues?.toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {!result.tiene_presupuesto && (
                <div className="p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg text-center">
                  <DollarSign className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                  <p className="text-sm text-zinc-300">
                    {result.mensaje}
                  </p>
                  <p className="text-xs text-zinc-500 mt-2">
                    Crea un presupuesto para tener un mejor control de tus gastos
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setResult(null)}
                  className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-all"
                >
                  Analizar Otra
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-bold transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseAnalyzerModal;

