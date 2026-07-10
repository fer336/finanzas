import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, TrendingUp, Zap, DollarSign, Calendar, BarChart3 } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import KpiCard from '../common/KpiCard';

/**
 * ModernAIUsageView — historial de uso de Lucy, restyled al tema "Papel"
 * para vivir embebido como sección de Ajustes (ver README.md "Mapa de
 * migración": "Categorías + Uso de Lucy/IA + Reportar/Bugs + config de
 * widgets → Ajustes"). Sin fondo de página propio ni <h1> — el título lo
 * pone el Section shell de ModernAjustesView.
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
    <div>
      <div className="mb-4 flex items-center justify-end">
        <button
          type="button"
          onClick={fetchData}
          title="Actualizar"
          className="rounded-sm border border-[#ddd5c2] bg-white p-2 text-[#8a8677] transition-colors duration-150 hover:bg-[#f0ead9] hover:text-foreground"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard
          label="Costo este mes"
          value={`$${totalCost.toFixed(4)}`}
          subtext="USD"
          borderColor="#e9c46a"
          valueColor="#8a6a1f"
        />
        <KpiCard
          label="Tokens usados"
          value={formatTokens(totalTokens)}
          borderColor="#3d5a80"
          valueColor="#20242c"
        />
        <KpiCard
          label="Consultas"
          value={requestsCount}
          borderColor="#5a7d52"
          valueColor="#476442"
        />
      </div>

      {/* Tabs */}
      <div className="mb-4 inline-flex items-center gap-[3px] rounded-full border border-[#ddd5c2] bg-card p-[3px]">
        <button
          type="button"
          onClick={() => setView('summary')}
          className={`rounded-full px-4 py-1.5 font-mono text-[12px] transition-colors duration-150 ${
            view === 'summary'
              ? 'bg-[#3d5a80] font-semibold text-[#faf7ef]'
              : 'text-[#5d6470] hover:text-foreground'
          }`}
        >
          Resumen
        </button>
        <button
          type="button"
          onClick={() => setView('activity')}
          className={`rounded-full px-4 py-1.5 font-mono text-[12px] transition-colors duration-150 ${
            view === 'activity'
              ? 'bg-[#3d5a80] font-semibold text-[#faf7ef]'
              : 'text-[#5d6470] hover:text-foreground'
          }`}
        >
          Actividad reciente
        </button>
      </div>

      {/* Content */}
      {view === 'summary' ? (
        <div className="flex flex-col gap-4">
          {monthlyData.length > 0 && (
            <div className="rounded-md border border-[#ddd5c2] bg-card p-4">
              <h3 className="mb-3 font-serif text-[15px] font-semibold text-foreground">Evolución mensual</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e0cf" />
                    <XAxis dataKey="month" stroke="#8a8677" fontSize={11} />
                    <YAxis stroke="#8a8677" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#faf7ef',
                        border: '1px solid #ddd5c2',
                        borderRadius: '6px',
                        fontFamily: '"IBM Plex Mono", monospace',
                        fontSize: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="cost"
                      stroke="#3d5a80"
                      strokeWidth={2}
                      dot={{ fill: '#3d5a80', r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {usageData?.most_used_model && (
            <div className="rounded-md border border-[#ddd5c2] bg-card p-4">
              <h3 className="mb-3 font-serif text-[15px] font-semibold text-foreground">Modelo preferido</h3>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-[#f0ead9]">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-mono text-[15px] font-semibold text-foreground">{usageData.most_used_model}</p>
                  <p className="text-[12px] text-[#8a8677]">
                    Usado en el {usageData.most_used_percentage || 0}% de las consultas
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {activityData.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-[#ddd5c2] bg-card py-10 text-center">
              <Sparkles className="h-8 w-8 text-[#8a8677]" />
              <p className="text-[13.5px] italic text-muted-foreground">Sin actividad reciente.</p>
              <p className="text-[12px] text-[#8a8677]">Las consultas a Lucy aparecerán acá.</p>
            </div>
          ) : (
            activityData.map((activity, index) => (
              <div
                key={index}
                className="rounded-md border border-[#ddd5c2] bg-card p-4 transition-colors duration-150 hover:bg-[#f0ead9]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="mb-1.5 truncate text-[13.5px] text-foreground">
                      {activity.prompt || activity.message || 'Consulta sin título'}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-[#8a8677]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(activity.timestamp || activity.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {formatTokens(activity.usage?.total_tokens || 0)} tokens
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        ${(activity.cost || 0).toFixed(5)}
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full border border-[#ddd5c2] bg-white px-2 py-[3px] font-mono text-[10.5px] uppercase tracking-[.04em] text-[#5d6470]">
                    {activity.model || activity.modelo || 'N/A'}
                  </span>
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
