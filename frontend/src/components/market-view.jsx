/**
 * Vista de Mercado Financiero
 * Muestra cotizaciones de acciones, criptomonedas y divisas con gráficos interactivos
 */
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Bitcoin, 
  Search,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  BarChart3,
  LineChart as LineChartIcon
} from 'lucide-react';
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import cedearsService from '../services/cedearsService';
import dolarService from '../services/dolarService';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export function MarketView() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [stockChartData, setStockChartData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [chartInterval, setChartInterval] = useState('5min');
  const [activeTab, setActiveTab] = useState('overview'); // overview, stocks, crypto, forex
  const [error, setError] = useState(null);

  // Cargar dashboard inicial
  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cargar datos de CEDEARs y cotizaciones
      const cedears = cedearsService.getAllCedears();
      const cotizaciones = await dolarService.getAllCotizaciones();
      
      // Simular estructura de dashboard
      const data = {
        stocks: cedears.slice(0, 5),
        forex: cotizaciones.slice(0, 5),
        cryptos: [], // Nota: cryptos con 's'
        timestamp: new Date().toISOString()
      };
      
      setDashboardData(data);
    } catch (err) {
      setError(err.message);
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStockSelect = async (symbol) => {
    try {
      setSelectedStock(symbol);
      // Obtener datos simulados del CEDEAR
      const priceData = await cedearsService.getCedearPrice(symbol);
      
      // Simular datos de gráfico
      const chartData = [];
      for (let i = 0; i < 20; i++) {
        chartData.push({
          time: `${i}:00`,
          price: parseFloat(priceData.price) + (Math.random() * 100 - 50)
        });
      }
      
      setStockChartData(chartData);
    } catch (err) {
      console.error('Error loading stock chart:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const results = cedearsService.searchCedears(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error('Error searching:', err);
    }
  };

  // Removed unused formatPrice and formatPercent functions
  // They can be added back if needed in the future

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-green-400 mx-auto mb-4" />
          <p className="text-text-secondary">Cargando datos del mercado...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="card-retro max-w-md text-center">
          <Activity className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text-main mb-2">Error al cargar datos</h2>
          <p className="text-text-secondary mb-4">{error}</p>
          <Button onClick={loadDashboard} variant="default">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-retro mx-auto p-6 pb-32 md:pb-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-main mb-2 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-green-400" />
            Mercado Financiero
          </h1>
          <p className="text-text-secondary">
            Datos en tiempo real de acciones, criptomonedas y divisas
          </p>
        </div>
        <Button 
          onClick={loadDashboard} 
          variant="outline"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Search Bar */}
      <div className="card-retro">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Buscar acciones (ej: Apple, Microsoft, Tesla)..."
              className="w-full pl-10 pr-4 py-3 bg-black/30 border-2 border-white/20 rounded text-text-main placeholder-text-secondary focus:border-green-400 transition-colors"
            />
          </div>
          <Button onClick={handleSearch} variant="default">
            Buscar
          </Button>
        </div>

        {/* Search Results */}
        {searchResults && searchResults.matches && searchResults.matches.length > 0 && (
          <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
            {searchResults.matches.map((match) => (
              <button
                key={match.symbol}
                onClick={() => {
                  handleStockSelect(match.symbol);
                  setSearchResults(null);
                  setSearchQuery('');
                }}
                className="w-full text-left p-3 bg-black/20 hover:bg-black/40 border border-white/10 rounded transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-text-main">{match.symbol}</span>
                    <span className="text-sm text-text-secondary ml-2">{match.name}</span>
                  </div>
                  <Badge variant="outline" size="sm">
                    {match.region}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        {[
          { id: 'overview', label: 'Resumen', icon: Activity },
          { id: 'stocks', label: 'Acciones', icon: TrendingUp },
          { id: 'crypto', label: 'Crypto', icon: Bitcoin },
          { id: 'forex', label: 'Divisas', icon: DollarSign }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative ${
              activeTab === id
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-text-secondary hover:text-text-main'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content based on active tab */}
      {activeTab === 'overview' && dashboardData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stocks Section */}
          <div className="card-retro">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-green-400" />
              <h3 className="font-bold text-text-main">Top Acciones Tech</h3>
            </div>
            <div className="space-y-3">
              {dashboardData?.stocks?.length > 0 ? (
                dashboardData.stocks.map((stock) => (
                  <StockCard 
                    key={stock.ticker || stock.symbol} 
                    stock={stock} 
                    onClick={() => handleStockSelect(stock.ticker || stock.symbol)}
                  />
                ))
              ) : (
                <p className="text-zinc-400 text-sm">No hay datos de acciones disponibles</p>
              )}
            </div>
          </div>

          {/* Crypto Section */}
          <div className="card-retro">
            <div className="flex items-center gap-2 mb-4">
              <Bitcoin className="h-5 w-5 text-green-400" />
              <h3 className="font-bold text-text-main">Criptomonedas</h3>
            </div>
            <div className="space-y-3">
              {dashboardData?.cryptos?.length > 0 ? (
                dashboardData.cryptos.map((crypto) => (
                  <CryptoCard key={crypto.symbol} crypto={crypto} />
                ))
              ) : (
                <p className="text-zinc-400 text-sm">No hay datos de criptomonedas disponibles</p>
              )}
            </div>
          </div>

          {/* Forex Section */}
          <div className="card-retro">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-green-400" />
              <h3 className="font-bold text-text-main">Divisas</h3>
            </div>
            <div className="space-y-3">
              {dashboardData?.forex?.length > 0 ? (
                dashboardData.forex.map((forex, idx) => (
                  <ForexCard key={idx} forex={forex} />
                ))
              ) : (
                <p className="text-zinc-400 text-sm">No hay datos de divisas disponibles</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stocks Tab */}
      {activeTab === 'stocks' && (
        <div className="space-y-6">
          {/* Popular Stocks Grid */}
          <div className="card-retro">
            <h3 className="font-bold text-text-main mb-4">Acciones Populares</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {cedearsService.getAllCedears().filter(c => c.sector === 'Tecnología').slice(0, 5).map((cedear) => (
                <button
                  key={cedear.ticker}
                  onClick={() => handleStockSelect(cedear.ticker)}
                  className={`p-4 bg-black/20 hover:bg-black/40 border-2 rounded transition-colors ${
                    selectedStock === cedear.ticker ? 'border-green-400' : 'border-white/10'
                  }`}
                >
                  <span className="font-mono font-bold text-text-main">{cedear.ticker}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stock Chart */}
          {selectedStock && stockChartData && (
            <div className="card-retro">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-text-main flex items-center gap-2">
                  <LineChartIcon className="h-5 w-5 text-green-400" />
                  Gráfico de {selectedStock}
                </h3>
                <div className="flex gap-2">
                  {['5min', '15min', '30min', '60min'].map((interval) => (
                    <button
                      key={interval}
                      onClick={() => {
                        setChartInterval(interval);
                        handleStockSelect(selectedStock);
                      }}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        chartInterval === interval
                          ? 'bg-green-400 text-black'
                          : 'bg-black/20 text-text-secondary hover:bg-black/40'
                      }`}
                    >
                      {interval}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={stockChartData.data}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis 
                    dataKey="timestamp" 
                    stroke="#ffffff60"
                    tick={{ fill: '#ffffff80', fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                    }}
                  />
                  <YAxis 
                    stroke="#ffffff60"
                    tick={{ fill: '#ffffff80', fontSize: 12 }}
                    domain={['auto', 'auto']}
                    tickFormatter={(value) => `$${value.toFixed(2)}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#000000dd', 
                      border: '1px solid #ffffff20',
                      borderRadius: '8px',
                      color: '#ffffff'
                    }}
                    formatter={(value) => [`$${value.toFixed(2)}`, 'Precio']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="close" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fill="url(#colorPrice)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Crypto Tab */}
      {activeTab === 'crypto' && (
        <div className="card-retro">
          <h3 className="font-bold text-text-main mb-4">Principales Criptomonedas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {['BTC', 'ETH', 'USDT'].map((symbol) => (
              <div key={symbol} className="p-4 bg-black/20 border border-white/10 rounded">
                <span className="font-mono font-bold text-text-main text-lg">{symbol}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Forex Tab */}
      {activeTab === 'forex' && (
        <div className="card-retro">
          <h3 className="font-bold text-text-main mb-4">Pares de Divisas Populares</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[{from: 'USD', to: 'ARS'}, {from: 'EUR', to: 'ARS'}].map((pair, idx) => (
              <div key={idx} className="p-4 bg-black/20 border border-white/10 rounded">
                <div className="font-mono font-bold text-text-main">
                  {pair.from}/{pair.to}
                </div>
                <div className="text-sm text-text-secondary mt-1">{pair.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Stock Card Component
function StockCard({ stock, onClick }) {
  const isPositive = stock.change >= 0;
  
  return (
    <button
      onClick={onClick}
      className="w-full p-3 bg-black/20 hover:bg-black/40 border border-white/10 rounded transition-colors text-left"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono font-bold text-text-main">{stock.ticker || stock.symbol}</span>
        <Badge variant={isPositive ? 'success' : 'destructive'} size="sm">
          {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        </Badge>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-lg font-bold text-text-main">
            ${stock.price.toFixed(2)}
          </div>
          <div className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{stock.change.toFixed(2)}%
          </div>
        </div>
        <TrendingUp className={`h-5 w-5 ${isPositive ? 'text-green-400' : 'text-red-400 rotate-180'}`} />
      </div>
    </button>
  );
}

// Crypto Card Component
function CryptoCard({ crypto }) {
  return (
    <div className="p-3 bg-black/20 border border-white/10 rounded">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono font-bold text-text-main">{crypto.symbol}</span>
        <Bitcoin className="h-4 w-4 text-green-400" />
      </div>
      <div className="text-lg font-bold text-text-main">
        ${crypto.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      <div className="text-xs text-text-secondary mt-1">{crypto.market}</div>
    </div>
  );
}

// Forex Card Component
function ForexCard({ forex }) {
  return (
    <div className="p-3 bg-black/20 border border-white/10 rounded">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono font-bold text-text-main">
          {forex.fromCurrency}/{forex.toCurrency}
        </span>
        <DollarSign className="h-4 w-4 text-green-400" />
      </div>
      <div className="text-lg font-bold text-text-main">
        {forex.exchangeRate.toFixed(4)}
      </div>
      <div className="text-xs text-text-secondary mt-1">
        {forex.lastRefreshed}
      </div>
    </div>
  );
}

export default MarketView;
