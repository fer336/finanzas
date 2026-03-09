import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Sparkles, DollarSign, Zap, TrendingUp, RefreshCw } from 'lucide-react';

/**
 * UsoCostoIAWidget - Widget de uso y costo de Lucy (Agente IA)
 */
const UsoCostoIAWidget = ({ onClick }) => {
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch('/api/ai/usage', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🤖 Uso de IA:', data);
        setUsageData(data);
      }
    } catch (error) {
      console.error('❌ Error cargando uso de IA:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
    // Refresh cada 5 minutos
    const interval = setInterval(fetchUsage, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const totalTokens = usageData?.total_tokens || 0;
  const totalCost = usageData?.total_cost || 0;
  const requestsCount = usageData?.requests_count || 0;

  const formatTokens = (tokens) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens;
  };

  return (
    <div 
      className="bg-[#18181b] rounded-3xl p-5 border border-white/5 cursor-pointer hover:border-white/10 transition-all"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-base font-semibold text-white">
            Uso de Lucy
          </h2>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            fetchUsage();
          }}
          className="p-1 hover:bg-white/5 rounded-lg transition-colors"
          title="Actualizar"
        >
          <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && !usageData ? (
        <div className="text-center py-4">
          <div className="animate-spin w-6 h-6 border-2 border-[#10b981] border-t-transparent rounded-full mx-auto" />
        </div>
      ) : (
        <>
          {/* Costo del mes */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">COSTO ESTE MES</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-white">
                ${totalCost.toFixed(4)}
              </p>
              <span className="text-xs text-gray-500">USD</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0a0a0a] rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-3 h-3 text-yellow-400" />
                <p className="text-xs text-gray-500">Tokens</p>
              </div>
              <p className="text-sm font-bold text-white">
                {formatTokens(totalTokens)}
              </p>
            </div>
            
            <div className="bg-[#0a0a0a] rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-3 h-3 text-[#10b981]" />
                <p className="text-xs text-gray-500">Consultas</p>
              </div>
              <p className="text-sm font-bold text-white">
                {requestsCount}
              </p>
            </div>
          </div>

          {/* Modelo usado */}
          {usageData?.most_used_model && (
            <div className="mt-3 pt-3 border-t border-white/5">
              <p className="text-xs text-gray-500 mb-1">Modelo más usado</p>
              <p className="text-xs text-gray-400 truncate">
                {usageData.most_used_model}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

UsoCostoIAWidget.propTypes = {
  onClick: PropTypes.func
};

export default UsoCostoIAWidget;
