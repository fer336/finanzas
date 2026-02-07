import React, { useState, useEffect, useMemo } from 'react';
import { Bot, RefreshCw, Clock, DollarSign, Cpu, ArrowLeft, Zap, Calendar, TrendingUp, BarChart3 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const AIUsageFullView = ({ onBack }) => {
  const [usageData, setUsageData] = useState(null);
  const [activityData, setActivityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [periodFilter, setPeriodFilter] = useState('all'); // 'day', 'week', 'month', 'all'

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const baseUrl = isDevelopment 
        ? 'http://localhost:8000' 
        : (import.meta.env.VITE_BACKEND_URL || `https://${window.location.hostname}`);
      
      const [usageRes, activityRes] = await Promise.all([
        fetch(`${baseUrl}/api/ai/usage`),
        fetch(`${baseUrl}/api/ai/activity?limit=50`) // Fetch 50 activities for full view
      ]);
      
      if (!usageRes.ok) throw new Error('Failed to fetch usage');
      
      const usage = await usageRes.json();
      setUsageData(usage);

      if (activityRes.ok) {
        const activity = await activityRes.json();
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
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCost = (item) => {
    const cost = item.cost || item.usage || 0;
    if (cost > 0.000001) {
      return `$${cost.toFixed(6)}`;
    }
    const totalTokens = (item.usage?.total_tokens) || 
                       ((item.usage?.prompt_tokens || 0) + (item.usage?.completion_tokens || 0)) ||
                       ((item.tokens_prompt || 0) + (item.tokens_completion || 0));
    if (totalTokens > 0) {
      return `${totalTokens} tks`;
    }
    return '$0.00';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('es-AR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Filter data by period
  const filteredData = useMemo(() => {
    if (!activityData || activityData.length === 0) return [];
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (periodFilter) {
      case 'day':
        cutoffDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'all':
      default:
        return activityData;
    }
    
    return activityData.filter(item => {
      const itemDate = new Date(item.timestamp || item.created_at);
      return itemDate >= cutoffDate;
    });
  }, [activityData, periodFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalCalls = filteredData.length;
    const totalCost = filteredData.reduce((sum, item) => sum + (item.cost || 0), 0);
    const totalTokens = filteredData.reduce((sum, item) => 
      sum + (item.tokens_prompt || 0) + (item.tokens_completion || 0), 0
    );
    const uniqueModels = new Set(filteredData.map(item => item.model)).size;

    return { totalCalls, totalCost, totalTokens, uniqueModels };
  }, [filteredData]);

  // Group data by date for chart
  const chartData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    
    const groupedByDate = {};
    
    filteredData.forEach(item => {
      const date = new Date(item.timestamp || item.created_at);
      let dateKey;
      
      switch (periodFilter) {
        case 'day':
          // Group by hour
          dateKey = `${date.getHours().toString().padStart(2, '0')}:00`;
          break;
        case 'week':
        case 'month':
          // Group by day
          dateKey = date.toLocaleDateString('es-AR', { month: 'short', day: 'numeric' });
          break;
        case 'all':
        default:
          // Group by month
          dateKey = date.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' });
          break;
      }
      
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = {
          date: dateKey,
          llamadas: 0,
          costo: 0,
          tokens: 0
        };
      }
      
      groupedByDate[dateKey].llamadas += 1;
      groupedByDate[dateKey].costo += (item.cost || 0);
      groupedByDate[dateKey].tokens += (item.tokens_prompt || 0) + (item.tokens_completion || 0);
    });
    
    return Object.values(groupedByDate).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredData, periodFilter]);

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background">
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-4 sm:px-6 md:px-8 lg:px-10 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col w-full max-w-[1400px] flex-1">
            
            {/* Header */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-white/10 px-4 sm:px-6 py-4 mb-6">
              <div className="flex items-center gap-2 sm:gap-4 text-white min-w-0 flex-1">
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors shrink-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-white/5 shrink-0">
                    <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg sm:text-2xl font-bold truncate">Consumo IA</h2>
                    <p className="text-xs sm:text-sm text-zinc-400 truncate">OpenRouter API</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={fetchData} 
                disabled={loading}
                className={`p-2 sm:p-3 rounded-xl hover:bg-white/5 text-zinc-500 hover:text-white transition-colors ${loading ? 'animate-spin' : ''} border border-white/5 shrink-0`}
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </header>

            {loading && !usageData ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
              </div>
            ) : error && !usageData ? (
              <div className="text-center py-12 space-y-4">
                <p className="text-zinc-500 text-lg">⚠️ Error conectando con el servicio</p>
                <p className="text-zinc-600">Reintentando...</p>
                <button 
                  onClick={fetchData}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
                >
                  Reintentar
                </button>
              </div>
            ) : (
              <>
                {/* Period Filter Tabs */}
                <div className="flex items-center justify-center gap-1 sm:gap-2 mb-6 p-1 bg-white/5 rounded-xl border border-white/5 w-fit mx-auto overflow-x-auto">
                  {[
                    { value: 'day', label: 'Hoy' },
                    { value: 'week', label: 'Semana' },
                    { value: 'month', label: 'Mes' },
                    { value: 'all', label: 'Todo' }
                  ].map(period => (
                    <button
                      key={period.value}
                      onClick={() => setPeriodFilter(period.value)}
                      className={`px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                        periodFilter === period.value
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                          : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                  <div className="bg-[#0f151a] rounded-2xl p-3 sm:p-5 border border-white/5">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <p className="text-zinc-500 text-[10px] sm:text-sm uppercase font-bold tracking-wider">Uso Total</p>
                      <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                    </div>
                    <p className="text-xl sm:text-3xl font-bold text-white mb-1">
                      ${usageData?.usage?.toFixed(4) || '0.00'}
                    </p>
                    <p className="text-[10px] sm:text-xs text-zinc-500">
                      de ${usageData?.limit?.toFixed(2) || '∞'} límite
                    </p>
                    {usageData?.limit > 0 && (
                      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden mt-3">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((usageData.usage / usageData.limit) * 100, 100)}%` }}
                        ></div>
                      </div>
                    )}
                  </div>

                  <div className="bg-[#0f151a] rounded-2xl p-3 sm:p-5 border border-white/5">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <p className="text-zinc-500 text-[10px] sm:text-sm uppercase font-bold tracking-wider">Total Llamadas</p>
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                    </div>
                    <p className="text-xl sm:text-3xl font-bold text-white mb-1">
                      {stats.totalCalls}
                    </p>
                    <p className="text-[10px] sm:text-xs text-zinc-500">
                      {stats.uniqueModels} modelo{stats.uniqueModels !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="bg-[#0f151a] rounded-2xl p-3 sm:p-5 border border-white/5">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <p className="text-zinc-500 text-[10px] sm:text-sm uppercase font-bold tracking-wider">Tokens</p>
                      <Cpu className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                    </div>
                    <p className="text-xl sm:text-3xl font-bold text-white mb-1">
                      {(stats.totalTokens / 1000).toFixed(1)}K
                    </p>
                    <p className="text-[10px] sm:text-xs text-zinc-500 truncate">
                      {stats.totalTokens.toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-[#0f151a] rounded-2xl p-3 sm:p-5 border border-white/5">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <p className="text-zinc-500 text-[10px] sm:text-sm uppercase font-bold tracking-wider">Promedio</p>
                      <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                    </div>
                    <p className="text-xl sm:text-3xl font-bold text-white mb-1 truncate">
                      ${stats.totalCalls > 0 ? (stats.totalCost / stats.totalCalls).toFixed(6) : '0.00'}
                    </p>
                    <p className="text-[10px] sm:text-xs text-zinc-500">
                      por llamada
                    </p>
                  </div>
                </div>

                {/* Charts Section */}
                {chartData.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                    {/* Cost Chart */}
                    <div className="bg-[#0f151a] rounded-2xl border border-white/5 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-emerald-400" />
                          Costo por {periodFilter === 'day' ? 'Hora' : periodFilter === 'all' ? 'Mes' : 'Día'}
                        </h3>
                      </div>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#71717a" 
                            style={{ fontSize: '12px' }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis 
                            stroke="#71717a" 
                            style={{ fontSize: '12px' }}
                            tickFormatter={(value) => `$${value.toFixed(4)}`}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#18181b', 
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '8px'
                            }}
                            labelStyle={{ color: '#fff' }}
                            formatter={(value) => [`$${value.toFixed(6)}`, 'Costo']}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="costo" 
                            stroke="#10b981" 
                            strokeWidth={3}
                            dot={{ fill: '#10b981', r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Calls Chart */}
                    <div className="bg-[#0f151a] rounded-2xl border border-white/5 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-blue-400" />
                          Llamadas por {periodFilter === 'day' ? 'Hora' : periodFilter === 'all' ? 'Mes' : 'Día'}
                        </h3>
                      </div>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#71717a" 
                            style={{ fontSize: '12px' }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis 
                            stroke="#71717a" 
                            style={{ fontSize: '12px' }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#18181b', 
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '8px'
                            }}
                            labelStyle={{ color: '#fff' }}
                          />
                          <Bar 
                            dataKey="llamadas" 
                            fill="#3b82f6" 
                            radius={[8, 8, 0, 0]}
                            name="Llamadas"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Activity Table */}
                <div className="bg-[#0f151a] rounded-2xl border border-white/5 overflow-hidden">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/5">
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                      Historial de Actividad
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                      {filteredData.length} llamada{filteredData.length !== 1 ? 's' : ''} 
                      {periodFilter !== 'all' && ` (${
                        periodFilter === 'day' ? 'últimas 24h' : 
                        periodFilter === 'week' ? 'última semana' : 
                        'último mes'
                      })`}
                    </p>
                  </div>

                  {/* Mobile & Desktop Views */}
                  {filteredData.length === 0 ? (
                    <div className="text-center py-12 space-y-3 px-6">
                      <Bot className="w-12 h-12 text-zinc-700 mx-auto" />
                      <p className="text-zinc-500">Sin actividad registrada</p>
                      <p className="text-zinc-600 text-sm">
                        {periodFilter === 'all' 
                          ? '💬 Habla con el agente para ver estadísticas' 
                          : '📅 No hay actividad en este período'}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Mobile Cards View */}
                      <div className="md:hidden px-4 py-4 space-y-3">
                        {filteredData.map((activity, idx) => (
                          <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3 hover:bg-white/10 transition-colors">
                            {/* Header con modelo y fecha */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Cpu className="w-4 h-4 text-purple-400 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-white text-sm font-bold truncate">
                                    {activity.model?.split('/').pop() || 'Unknown'}
                                  </p>
                                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-0.5">
                                    <Clock className="w-3 h-3 shrink-0" />
                                    <span className="truncate">
                                      {formatDate(activity.timestamp || activity.created_at)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="text-emerald-400 font-bold text-sm">
                                  {formatCost(activity)}
                                </p>
                              </div>
                            </div>

                            {/* Tokens info */}
                            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10">
                              <div className="text-center">
                                <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Prompt</p>
                                <p className="text-white text-xs font-mono font-medium">
                                  {(activity.tokens_prompt || 0).toLocaleString()}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Completion</p>
                                <p className="text-white text-xs font-mono font-medium">
                                  {(activity.tokens_completion || 0).toLocaleString()}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Total</p>
                                <p className="text-cyan-400 text-xs font-mono font-bold">
                                  {((activity.tokens_prompt || 0) + (activity.tokens_completion || 0)).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop Table View */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-white/5 border-b border-white/5">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                Fecha
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                Modelo
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                Prompt
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                Completion
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                Total Tokens
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                Costo
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {filteredData.map((activity, idx) => (
                              <tr key={idx} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 text-xs text-zinc-400 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5 text-zinc-600" />
                                    {formatDate(activity.timestamp || activity.created_at)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-white">
                                  <div className="flex items-center gap-2">
                                    <Cpu className="w-4 h-4 text-purple-400" />
                                    <span className="font-medium">
                                      {activity.model?.split('/').pop() || 'Unknown'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-zinc-300 text-right font-mono">
                                  {(activity.tokens_prompt || 0).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-sm text-zinc-300 text-right font-mono">
                                  {(activity.tokens_completion || 0).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-sm text-white text-right font-mono font-bold">
                                  {((activity.tokens_prompt || 0) + (activity.tokens_completion || 0)).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-sm text-emerald-400 text-right font-mono font-bold">
                                  {formatCost(activity)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>

                {/* Footer Info */}
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-400">
                    <Zap className="w-4 h-4 text-yellow-500 shrink-0" />
                    <span className="whitespace-nowrap">{usageData?.is_free_tier ? 'Plan Gratuito' : 'Plan Pago'}</span>
                    <span className="text-zinc-700">•</span>
                    <span className="truncate">Label: {usageData?.label || 'Default'}</span>
                  </div>
                  <div className="text-xs text-zinc-500 whitespace-nowrap">
                    Última actualización: {new Date().toLocaleTimeString('es-AR')}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

