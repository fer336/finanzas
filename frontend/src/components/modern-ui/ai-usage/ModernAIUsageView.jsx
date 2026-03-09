import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Sparkles, RefreshCw, TrendingUp, Zap, DollarSign, Calendar, BarChart3 } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';

/**
 * ModernAIUsageView - Vista completa del historial de uso de Lucy
 */
const ModernAIUsageView = () => {
  const [usageData, setUsageData] = useState(null);
  const [activityData, setActivityData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('summary'); // 'summary' o 'activity'

  const buildMonthlyData = (activities = []) => {
    const byMonth = {};
    activities.forEach((activity) => {
      const rawDate = activity.timestamp || activity.created_at;
      if (!rawDate) return;
      const date = new Date(rawDate);
      if (Number.isNaN(date.getTime())) return;

      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[monthKey]) {
        byMonth[monthKey] = {
          month: date.toLocaleDateString('es-AR', { month: 'short' }),
          cost: 0,
        };
      }
      byMonth[monthKey].cost += Number(activity.cost || 0);
    });

    return Object.keys(byMonth)
      .sort()
      .map((key) => ({
        ...byMonth[key],
        cost: Number(byMonth[key].cost.toFixed(5)),
      }));
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const [usageRes, activityRes] = await Promise.all([
        fetch('/api/ai/usage', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/ai/activity?limit=50', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (usageRes.ok) {
        const usage = await usageRes.json();
        setUsageData(usage);
      }

      if (activityRes.ok) {
        const activity = await activityRes.json();
        const items = activity.data || [];
        setActivityData(items);
        setMonthlyData(buildMonthlyData(items));
      }

    } catch (error) {
      console.error('❌ Error cargando datos de IA:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatTokens = (tokens) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('es-AR', { 
      day: '2-digit', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const totalTokens = usageData?.total_tokens || 0;
  const totalCost = usageData?.total_cost || 0;
  const requestsCount = usageData?.requests_count || 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 pb-32">
      {/* Header con Stats */}
      <div className="mb-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-3xl p-6 border border-purple-500/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Uso de Lucy</h1>
              <p className="text-sm text-gray-400">Historial y estadísticas del agente IA</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="p-3 bg-[#18181b] hover:bg-white/5 rounded-xl transition-colors"
            title="Actualizar"
          >
            <RefreshCw className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0a0a0a]/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-yellow-400" />
              <p className="text-xs text-gray-500">COSTO ESTE MES</p>
            </div>
            <p className="text-3xl font-bold text-white">
              ${totalCost.toFixed(4)}
              <span className="text-sm text-gray-500 ml-2">USD</span>
            </p>
          </div>

          <div className="bg-[#0a0a0a]/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-blue-400" />
              <p className="text-xs text-gray-500">TOKENS USADOS</p>
            </div>
            <p className="text-3xl font-bold text-white">{formatTokens(totalTokens)}</p>
          </div>

          <div className="bg-[#0a0a0a]/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-[#10b981]" />
              <p className="text-xs text-gray-500">CONSULTAS</p>
            </div>
            <p className="text-3xl font-bold text-white">{requestsCount}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setView('summary')}
          className={`px-4 py-2 rounded-xl transition-all ${
            view === 'summary'
              ? 'bg-[#10b981] text-white font-medium'
              : 'bg-[#18181b] text-gray-400 hover:text-white'
          }`}
        >
          📊 Resumen
        </button>
        <button
          onClick={() => setView('activity')}
          className={`px-4 py-2 rounded-xl transition-all ${
            view === 'activity'
              ? 'bg-[#10b981] text-white font-medium'
              : 'bg-[#18181b] text-gray-400 hover:text-white'
          }`}
        >
          📝 Actividad Reciente
        </button>
      </div>

      {/* Content */}
      {view === 'summary' ? (
        <div className="space-y-6">
          {/* Gráfico Mensual */}
          {monthlyData.length > 0 && (
            <div className="bg-[#18181b] rounded-3xl p-6 border border-white/5">
              <h3 className="text-lg font-bold text-white mb-4">Evolución Mensual</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="month" 
                      stroke="rgba(255,255,255,0.5)"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.5)"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#18181b',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cost" 
                      stroke="#8b5cf6" 
                      strokeWidth={3}
                      dot={{ fill: '#8b5cf6', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Modelo más usado */}
          {usageData?.most_used_model && (
            <div className="bg-[#18181b] rounded-3xl p-6 border border-white/5">
              <h3 className="text-lg font-bold text-white mb-4">Modelo Preferido</h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{usageData.most_used_model}</p>
                  <p className="text-sm text-gray-400">Usado en el {usageData.most_used_percentage || 0}% de las consultas</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Actividad Reciente */
        <div className="space-y-3">
          {activityData.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No hay actividad reciente</h3>
              <p className="text-gray-400">Las consultas a Lucy aparecerán aquí</p>
            </div>
          ) : (
            activityData.map((activity, index) => (
              <div 
                key={index}
                className="bg-[#18181b] rounded-2xl p-5 border border-white/5 hover:bg-white/5 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white mb-2 truncate">
                      {activity.prompt || activity.message || 'Consulta sin título'}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(activity.timestamp || activity.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {formatTokens(activity.usage?.total_tokens || 0)} tokens
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        ${(activity.cost || 0).toFixed(5)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="px-2 py-1 bg-purple-500/10 text-purple-400 text-xs font-medium rounded-full">
                      {activity.model || activity.modelo || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

ModernAIUsageView.propTypes = {};

export default ModernAIUsageView;
