import React, { useState, useEffect } from 'react';
import { Bot, RefreshCw, Zap, Clock, DollarSign, Cpu } from 'lucide-react';

export const AIUsageWidget = ({ onViewDetails }) => {
  const [usageData, setUsageData] = useState(null);
  const [activityData, setActivityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('summary'); // 'summary' or 'activity'

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Detectar automáticamente desarrollo vs producción
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      // En producción, usar URL relativa para aprovechar Traefik routing
      const baseUrl = isDevelopment ? 'http://localhost:8000' : '';
      
      // Parallel requests for speed
      const [usageRes, activityRes] = await Promise.all([
        fetch(`${baseUrl}/api/ai/usage`),
        fetch(`${baseUrl}/api/ai/activity?limit=3`) // Fetch top 3 activities for compact view
      ]);
      
      if (!usageRes.ok) throw new Error('Failed to fetch usage');
      
      const usage = await usageRes.json();
      setUsageData(usage);

      if (activityRes.ok) {
        const activity = await activityRes.json();
        console.log('📊 AI Activity Data:', activity.data);
        console.log('📊 Total tokens from data:', activity.data?.reduce((sum, item) => {
          const tokens = item.usage?.total_tokens || 
                        ((item.usage?.prompt_tokens || 0) + (item.usage?.completion_tokens || 0));
          console.log(`  - Item: ${item.model}, tokens: ${tokens}`);
          return sum + tokens;
        }, 0));
        setActivityData(activity.data || []);
      }
      
    } catch (err) {
      console.error('Error fetching AI data:', err);
      setError('No disponible');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Siempre mostrar el widget, incluso si hay error (mostrar estado visual en lugar de ocultar)
  // if (error && !usageData) return null;

  // Format Helpers
  const getTotalTokens = (item) => {
    // Intentar todos los formatos posibles
    return item.usage?.total_tokens || 
           ((item.usage?.prompt_tokens || 0) + (item.usage?.completion_tokens || 0)) ||
           ((item.tokens_prompt || 0) + (item.tokens_completion || 0)) ||
           0;
  };

  const formatCost = (item) => {
    // Si el item tiene costo > 0, mostrar costo
    const cost = item.cost || 0;
    if (cost > 0.000001) {
        return `$${cost.toFixed(5)}`;
    }
    // Si no tiene costo pero tiene tokens, mostrar tokens
    const totalTokens = getTotalTokens(item);
                       
    if (totalTokens > 0) {
        return `${totalTokens >= 1000 ? `${(totalTokens / 1000).toFixed(1)}K` : totalTokens} tks`;
    }
    
    return '$0.00';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-[#0f151a] rounded-3xl p-5 border border-white/5 relative overflow-hidden group h-full flex flex-col min-h-[300px]">
      {/* Background Gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[50px] -mr-10 -mt-10 pointer-events-none"></div>

      {/* Header */}
      <div className="flex justify-between items-start mb-4 relative z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-white/5">
            <Bot className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-base">Consumo IA</h3>
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setView('summary')}
                    className={`text-[10px] uppercase font-bold tracking-wider transition-colors ${view === 'summary' ? 'text-purple-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Resumen
                </button>
                <span className="text-zinc-700">|</span>
                <button 
                    onClick={() => setView('activity')}
                    className={`text-[10px] uppercase font-bold tracking-wider transition-colors ${view === 'activity' ? 'text-purple-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Actividad
                </button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
            >
              Ver detalles
            </button>
          )}
          <button 
            onClick={fetchData} 
            disabled={loading}
            className={`p-2 rounded-full hover:bg-white/5 text-zinc-500 hover:text-white transition-colors ${loading ? 'animate-spin' : ''}`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-hidden">
        {loading && !usageData ? (
          <div className="h-full flex items-center justify-center min-h-[100px]">
            <div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          </div>
        ) : view === 'summary' ? (
          // SUMMARY VIEW
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {error && !usageData ? (
              <div className="text-center py-4 space-y-2">
                <p className="text-zinc-500 text-sm">⚠️ Error conectando</p>
                <p className="text-zinc-600 text-xs">Reintentando...</p>
              </div>
            ) : (
              <>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-white">
                ${usageData?.usage?.toFixed(2) || '0.00'}
              </span>
              <span className="text-sm text-zinc-500 mb-1.5 font-medium">
                / ${usageData?.limit?.toFixed(2) || '∞'}
              </span>
            </div>

            {/* Progress Bar */}
            {usageData?.limit > 0 && (
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((usageData.usage / usageData.limit) * 100, 100)}%` }}
                ></div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                    <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">Total Llamadas</p>
                    <div className="flex items-center gap-1.5">
                        <Cpu className="w-3 h-3 text-blue-400" />
                        <p className="text-white text-xs font-medium">
                            {activityData.length || 0}
                        </p>
                    </div>
                </div>
                <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                    <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">Tokens</p>
                    <div className="flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-cyan-400" />
                        <p className="text-white text-xs font-medium">
                            {(() => {
                                const totalTokens = activityData.reduce((sum, item) => sum + getTotalTokens(item), 0);
                                return totalTokens >= 1000 
                                    ? `${(totalTokens / 1000).toFixed(1)}K`
                                    : totalTokens || '0';
                            })()}
                        </p>
                    </div>
                </div>
                <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                    <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">Promedio</p>
                    <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3 h-3 text-emerald-400" />
                        <p className="text-white text-xs font-medium">
                            {activityData.length > 0
                              ? `$${(usageData?.usage / activityData.length).toFixed(4)}`
                              : 'Sin datos'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
              <span className="text-zinc-500 flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-500" />
                {usageData?.is_free_tier ? 'Plan Gratuito' : 'Plan Pago'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/5 text-zinc-400 border border-white/5 text-[10px]">
                {usageData?.label || 'Default'}
              </span>
            </div>
            </>
            )}
          </div>
        ) : (
          // ACTIVITY VIEW
          <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {activityData.length === 0 ? (
                    <div className="text-center py-4 space-y-2">
                        <p className="text-zinc-500 text-xs">Sin actividad registrada</p>
                        <p className="text-zinc-600 text-[10px]">💬 Habla con el agente para ver estadísticas</p>
                    </div>
                ) : (
                    activityData.map((activity, idx) => (
                        <div 
                          key={idx} 
                          onClick={onViewDetails}
                          className="bg-white/5 rounded-lg p-2 flex justify-between items-center border border-white/5 hover:border-purple-500/30 transition-colors cursor-pointer active:scale-[0.98]"
                        >
                            <div className="min-w-0 flex-1 pr-2">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <Cpu className="w-3 h-3 text-purple-400 shrink-0" />
                                    <p className="text-white text-xs font-medium truncate">
                                        {activity.model?.split('/').pop() || 'Unknown'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                                    <span className="flex items-center gap-0.5">
                                        <Clock className="w-2.5 h-2.5" />
                                        {formatDate(activity.timestamp || activity.created_at)}
                                    </span>
                                    <span>•</span>
                                    <span>{getTotalTokens(activity)} toks</span>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-emerald-400 font-bold text-xs">
                                    {formatCost(activity)}
                                </p>
                            </div>
                        </div>
                    ))
                )}
             </div>
             {onViewDetails && activityData.length > 0 && (
               <button
                 onClick={onViewDetails}
                 className="mt-3 w-full py-2 text-xs text-center text-cyan-400 hover:text-cyan-300 transition-colors font-medium border border-white/10 hover:border-cyan-500/30 rounded-lg"
               >
                 Ver todos los detalles →
               </button>
             )}
          </div>
        )}
      </div>
    </div>
  );
};
