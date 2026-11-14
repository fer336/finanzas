import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, ArrowRightLeft, Calculator, Percent } from 'lucide-react';

export function ConverterView() {
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // Estados del conversor
  const [fromCurrency, setFromCurrency] = useState('ARS');
  const [toCurrency, setToCurrency] = useState('blue');
  const [amount, setAmount] = useState(1000);
  const [commission, setCommission] = useState(3); // 3% por defecto
  const [result, setResult] = useState(0);
  const [resultWithCommission, setResultWithCommission] = useState(0);

  // Todas las divisas disponibles - Se cargarán dinámicamente desde la API
  const [currencies, setCurrencies] = useState([
    { id: 'ARS', name: 'Peso Argentino', symbol: '$', flag: '🇦🇷' }
  ]);

  // Tipos de dólar disponibles en la API oficial (estático para evitar re-renders)
  const dollarTypes = useMemo(() => [
    { id: 'oficial', name: 'Oficial', description: 'Dólar oficial del BCRA', icon: '🏛️' },
    { id: 'blue', name: 'Blue', description: 'Mercado paralelo', icon: '💙' },
    { id: 'ahorro', name: 'Ahorro', description: 'Con impuesto PAÍS + ganancias', icon: '🔒' },
    { id: 'tarjeta', name: 'Tarjeta', description: 'Para consumos en el exterior', icon: '💳' },
    { id: 'mayorista', name: 'Mayorista', description: 'Mercado interbancario', icon: '🏭' },
    { id: 'cripto', name: 'Cripto', description: 'USDT/USDC promedio', icon: '₿' },
    { id: 'mep', name: 'MEP', description: 'Mercado Electrónico de Pagos', icon: '📈' },
    { id: 'ccl', name: 'CCL', description: 'Contado con Liquidación', icon: '📊' },
    { id: 'solidario', name: 'Solidario', description: 'Oficial + Impuesto PAÍS', icon: '🛡️' }
  ], []);

  const fetchRates = useCallback(async () => {
    setIsRefreshing(true);

    try {
      const response = await fetch('https://criptoya.com/api/dolar');

      if (response.ok) {
        const data = await response.json();
        const rates = {};
        const availableCurrencies = [
          { id: 'ARS', name: 'Peso Argentino', symbol: '$', flag: '🇦🇷' }
        ];

        dollarTypes.forEach(type => {
          const sourceData = data[type.id];

          if (sourceData) {
            let compra, venta;

            // Manejar diferentes estructuras de datos
            if (type.id === 'cripto') {
              // Para cripto, usar promedio de USDT y USDC
              const usdtBid = data.cripto?.usdt?.bid || 0;
              const usdtAsk = data.cripto?.usdt?.ask || 0;
              const usdcBid = data.cripto?.usdc?.bid || 0;
              const usdcAsk = data.cripto?.usdc?.ask || 0;

              compra = (usdtBid + usdcBid) / 2;
              venta = (usdtAsk + usdcAsk) / 2;
            } else if (sourceData.bid && sourceData.ask) {
              // Datos con bid/ask
              compra = sourceData.bid;
              venta = sourceData.ask;
            } else if (sourceData.price) {
              // Datos solo con precio (usar como referencia)
              compra = sourceData.price * 0.995; // Spread estimado
              venta = sourceData.price * 1.005;
            } else {
              compra = 0;
              venta = 0;
            }

            rates[type.id] = {
              compra: Math.round(compra * 100) / 100,
              venta: Math.round(venta * 100) / 100,
              promedio: Math.round(((compra + venta) / 2) * 100) / 100,
              nombre: `Dólar ${type.name}`,
              variacion: sourceData.variation || 0,
              fechaActualizacion: sourceData.timestamp ?
                new Date(sourceData.timestamp * 1000).toISOString() :
                new Date().toISOString(),
              description: type.description,
              icon: type.icon
            };

            // Agregar a la lista de currencies disponibles
            availableCurrencies.push({
              id: type.id,
              name: `Dólar ${type.name}`,
              symbol: 'US$',
              flag: type.icon,
              description: type.description
            });
          } else {
            rates[type.id] = {
              compra: 0,
              venta: 0,
              promedio: 0,
              nombre: `Dólar ${type.name}`,
              variacion: 0,
              fechaActualizacion: new Date().toISOString(),
              description: type.description,
              icon: type.icon,
              error: true
            };
          }
        });

        // Agregar ARS como base
        rates['ARS'] = { compra: 1, venta: 1, promedio: 1 };

        setRates(rates);
        setCurrencies(availableCurrencies);
        setLastUpdate(new Date());
      }

    } catch (err) {
      console.error('Error fetching dollar rates:', err);

      // Fallback data
      const fallbackRates = { 'ARS': { compra: 1, venta: 1, promedio: 1 } };
      dollarTypes.forEach(type => {
        fallbackRates[type.id] = {
          compra: 0,
          venta: 0,
          promedio: 0,
          nombre: `Dólar ${type.name}`,
          variacion: 0,
          fechaActualizacion: new Date().toISOString(),
          description: type.description,
          icon: type.icon,
          error: true
        };
      });
      setRates(fallbackRates);

    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [dollarTypes]);

  // Calcular conversión
  useEffect(() => {
    if (!rates[fromCurrency] || !rates[toCurrency] || !amount) {
      setResult(0);
      setResultWithCommission(0);
      return;
    }

    let result = 0;

    // Si convertimos desde ARS hacia dólar
    if (fromCurrency === 'ARS') {
      result = amount / rates[toCurrency].compra; // Usamos precio de compra del dólar
    }
    // Si convertimos desde dólar hacia ARS
    else if (toCurrency === 'ARS') {
      result = amount * rates[fromCurrency].venta; // Usamos precio de venta del dólar
    }
    // Si convertimos entre dos dólares
    else {
      // Convertimos primero a ARS y luego a la moneda destino
      const toARS = amount * rates[fromCurrency].venta;
      result = toARS / rates[toCurrency].compra;
    }

    const withCommission = result * (1 - commission / 100);

    setResult(result);
    setResultWithCommission(withCommission);
  }, [rates, fromCurrency, toCurrency, amount, commission]);

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  // Cargar datos al iniciar el componente
  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const getCurrencyInfo = (currencyId) => {
    return currencies.find(c => c.id === currencyId);
  };

  return (
    <div className="min-h-screen p-0 pb-32 md:pb-0" style={{background: 'var(--page-ink)'}}>
      <div className="min-h-screen w-full p-4 md:p-6">
        {/* Header - Full Width */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-black uppercase text-white dark:text-[var(--foreground)] tracking-tight">
                💰 CONVERSOR DE MONEDAS
              </h1>
              <p className="text-zinc-400 dark:text-[var(--muted-foreground)] text-sm md:text-base font-bold mt-1">
                Convertí entre pesos y dólares con cotizaciones en tiempo real
              </p>
            </div>
            
            <div className="text-right">
              <button 
                onClick={fetchRates}
                disabled={isRefreshing}
                className="px-4 py-3 bg-green-500 dark:bg-[var(--primary)] hover:bg-green-600 dark:hover:bg-[var(--primary-hover)] text-black dark:text-[var(--primary-foreground)] font-bold rounded-lg transition-all flex items-center justify-center disabled:opacity-50 shadow-lg"
                title={isRefreshing ? 'Actualizando...' : 'Actualizar'}
              >
                <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
              {lastUpdate && (
                <p className="text-xs text-zinc-400 dark:text-[var(--muted-foreground)] mt-2 font-semibold">
                  Actualizado: {lastUpdate.toLocaleTimeString('es-AR')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Full Width Container */}
        <div className="w-full">
          {/* Conversor Principal */}
          <div className="bg-zinc-900 dark:bg-[var(--card)] border-2 border-zinc-800 dark:border-[var(--border)] rounded-2xl p-6 mb-6 shadow-xl">
            <div className="flex items-center gap-2 mb-6">
              <Calculator className="h-6 w-6 text-green-400 dark:text-[var(--primary)]" strokeWidth={2.5} />
              <h2 className="text-xl font-black text-white dark:text-[var(--foreground)] uppercase">Calculadora de Conversión</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              {/* Moneda Origen */}
              <div className="space-y-3">
                <label className="block text-zinc-400 dark:text-[var(--muted-foreground)] text-sm font-bold uppercase">Desde:</label>
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="w-full p-3 bg-zinc-800 dark:bg-[var(--secondary)] border-2 border-zinc-700 dark:border-[var(--border)] rounded-xl text-white dark:text-[var(--foreground)] text-base font-semibold focus:border-green-500 dark:focus:border-[var(--primary)] focus:outline-none transition-all"
                >
                  {currencies.map((currency) => {
                    const rate = rates[currency.id];
                    let priceText = '';
                    
                    if (rate && currency.id !== 'ARS') {
                      priceText = ` - Venta: $${formatNumber(rate.venta)}`;
                    } else if (currency.id === 'ARS') {
                      priceText = ' - Base';
                    }
                    
                    return (
                      <option key={currency.id} value={currency.id}>
                        {currency.flag} {currency.name}{priceText}
                      </option>
                    );
                  })}
                </select>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-4 bg-zinc-800 dark:bg-[var(--secondary)] border-2 border-zinc-700 dark:border-[var(--border)] rounded-xl text-white dark:text-[var(--foreground)] font-black text-2xl focus:border-green-500 dark:focus:border-[var(--primary)] focus:outline-none transition-all"
                  placeholder="0"
                />
              </div>

              {/* Botón de Intercambio */}
              <div className="flex justify-center">
                <button
                  onClick={swapCurrencies}
                  className="p-4 bg-zinc-800 dark:bg-[var(--secondary)] hover:bg-zinc-700 dark:hover:bg-[var(--secondary)] border-2 border-zinc-700 dark:border-[var(--border)] rounded-xl transition-all hover:scale-110 active:scale-95"
                >
                  <ArrowRightLeft className="h-6 w-6 text-green-400 dark:text-[var(--primary)]" strokeWidth={2.5} />
                </button>
              </div>

              {/* Moneda Destino */}
              <div className="space-y-3">
                <label className="block text-zinc-400 dark:text-[var(--muted-foreground)] text-sm font-bold uppercase">Hacia:</label>
                <select
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className="w-full p-3 bg-zinc-800 dark:bg-[var(--secondary)] border-2 border-zinc-700 dark:border-[var(--border)] rounded-xl text-white dark:text-[var(--foreground)] text-base font-semibold focus:border-blue-500 dark:focus:border-[var(--primary)] focus:outline-none transition-all"
                >
                  {currencies.map((currency) => {
                    const rate = rates[currency.id];
                    let priceText = '';
                    
                    if (rate && currency.id !== 'ARS') {
                      priceText = ` - Compra: $${formatNumber(rate.compra)}`;
                    } else if (currency.id === 'ARS') {
                      priceText = ' - Base';
                    }
                    
                    return (
                      <option key={currency.id} value={currency.id}>
                        {currency.flag} {currency.name}{priceText}
                      </option>
                    );
                  })}
                </select>
                <div className="p-5 bg-gradient-to-br from-green-900/30 dark:from-[var(--accent)] to-emerald-900/30 dark:to-[var(--accent)] border-2 border-green-700 dark:border-[var(--primary)] rounded-xl shadow-lg">
                  <div className="text-green-400 dark:text-[var(--primary)] font-black text-2xl mb-2">
                    {getCurrencyInfo(toCurrency)?.symbol} {formatNumber(result)}
                  </div>
                  <div className="text-zinc-400 dark:text-[var(--muted-foreground)] text-xs font-semibold uppercase">Sin comisión</div>
                </div>
              </div>
            </div>
          </div>

          {/* Configuración de Comisión */}
          <div className="bg-zinc-900 dark:bg-[var(--card)] border-2 border-zinc-800 dark:border-[var(--border)] rounded-2xl p-6 mb-6 shadow-xl">
            <div className="flex items-center gap-2 mb-6">
              <Percent className="h-6 w-6 text-yellow-400 dark:text-[var(--warning)]" strokeWidth={2.5} />
              <h3 className="text-xl font-black text-white dark:text-[var(--foreground)] uppercase">Comisión Bancaria</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-zinc-400 dark:text-[var(--muted-foreground)] text-sm font-bold uppercase mb-3">
                  Comisión del banco (%):
                </label>
                <input
                  type="number"
                  value={commission}
                  onChange={(e) => setCommission(parseFloat(e.target.value) || 0)}
                  step="0.1"
                  min="0"
                  max="20"
                  className="w-full p-4 bg-zinc-800 dark:bg-[var(--secondary)] border-2 border-zinc-700 dark:border-[var(--border)] rounded-xl text-white dark:text-[var(--foreground)] text-xl font-black focus:border-yellow-500 dark:focus:border-[var(--warning)] focus:outline-none transition-all"
                />
                <div className="mt-3 flex gap-2 flex-wrap">
                  <button onClick={() => setCommission(0)} className="px-3 py-1.5 bg-zinc-800 dark:bg-[var(--secondary)] hover:bg-zinc-700 dark:hover:bg-[var(--secondary)] border-2 border-zinc-700 dark:border-[var(--border)] rounded-lg text-white dark:text-[var(--foreground)] text-xs font-bold transition-all">0%</button>
                  <button onClick={() => setCommission(1.5)} className="px-3 py-1.5 bg-zinc-800 dark:bg-[var(--secondary)] hover:bg-zinc-700 dark:hover:bg-[var(--secondary)] border-2 border-zinc-700 dark:border-[var(--border)] rounded-lg text-white dark:text-[var(--foreground)] text-xs font-bold transition-all">1.5%</button>
                  <button onClick={() => setCommission(3)} className="px-3 py-1.5 bg-zinc-800 dark:bg-[var(--secondary)] hover:bg-zinc-700 dark:hover:bg-[var(--secondary)] border-2 border-zinc-700 dark:border-[var(--border)] rounded-lg text-white dark:text-[var(--foreground)] text-xs font-bold transition-all">3%</button>
                  <button onClick={() => setCommission(5)} className="px-3 py-1.5 bg-zinc-800 dark:bg-[var(--secondary)] hover:bg-zinc-700 dark:hover:bg-[var(--secondary)] border-2 border-zinc-700 dark:border-[var(--border)] rounded-lg text-white dark:text-[var(--foreground)] text-xs font-bold transition-all">5%</button>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 dark:text-[var(--muted-foreground)] text-sm font-bold uppercase mb-3">
                  Resultado con comisión:
                </label>
                <div className="p-5 bg-gradient-to-br from-red-900/30 dark:from-[var(--overdue-pill)] to-orange-900/30 dark:to-[var(--arrears-pill)] border-2 border-red-700 dark:border-[var(--destructive)] rounded-xl shadow-lg">
                  <div className="text-red-400 dark:text-[var(--destructive)] font-black text-2xl mb-2">
                    {getCurrencyInfo(toCurrency)?.symbol} {formatNumber(resultWithCommission)}
                  </div>
                  <div className="text-red-300 dark:text-[var(--destructive)] text-sm font-semibold">
                    -{getCurrencyInfo(toCurrency)?.symbol} {formatNumber(result - resultWithCommission)} en comisión
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de Cotizaciones */}
          <div className="bg-zinc-900 dark:bg-[var(--card)] border-2 border-zinc-800 dark:border-[var(--border)] rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white dark:text-[var(--foreground)] uppercase">📊 Cotizaciones Actuales</h3>
              {lastUpdate && (
                <span className="text-xs text-green-400 dark:text-[var(--primary)] bg-green-500/20 dark:bg-[var(--accent)] px-3 py-1.5 rounded-lg font-bold border border-green-500/30 dark:border-[var(--accent)]">
                  Actualizado: {lastUpdate.toLocaleTimeString('es-AR')}
                </span>
              )}
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-green-500 dark:border-[var(--primary)] mx-auto"></div>
                <p className="text-zinc-400 dark:text-[var(--muted-foreground)] mt-3 text-base font-semibold">Cargando cotizaciones...</p>
              </div>
            ) : (
              <div className={`overflow-x-auto transition-opacity ${isRefreshing ? 'opacity-50' : ''}`}>
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-zinc-700 dark:border-[var(--border)]">
                      <th className="text-left py-3 px-3 text-zinc-400 dark:text-[var(--muted-foreground)] font-black uppercase text-sm">Moneda</th>
                      <th className="text-right py-3 px-3 text-zinc-400 dark:text-[var(--muted-foreground)] font-black uppercase text-sm">Compra</th>
                      <th className="text-right py-3 px-3 text-zinc-400 dark:text-[var(--muted-foreground)] font-black uppercase text-sm">Venta</th>
                      <th className="text-right py-3 px-3 text-zinc-400 dark:text-[var(--muted-foreground)] font-black uppercase text-sm">Promedio</th>
                      <th className="text-center py-3 px-3 text-zinc-400 dark:text-[var(--muted-foreground)] font-black uppercase text-sm">Variación</th>
                      <th className="text-center py-3 px-3 text-zinc-400 dark:text-[var(--muted-foreground)] font-black uppercase text-sm">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dollarTypes.map((dollarType) => {
                      const rate = rates[dollarType.id];
                      if (!rate) return null;
                      
                      const currency = currencies.find(c => c.id === dollarType.id);
                      if (!currency) return null;
                      
                      const isPositiveVariation = (rate.variacion || 0) >= 0;
                      const hasError = rate.error;
                      
                      return (
                        <tr key={dollarType.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{currency.flag}</span>
                              <div>
                                <div className="text-white dark:text-[var(--foreground)] font-bold text-base">{currency.name}</div>
                                <div className="text-zinc-500 dark:text-[var(--muted-foreground)] text-xs">{dollarType.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className={`font-mono font-bold text-base ${hasError ? 'text-zinc-600 dark:text-[var(--muted-foreground)]' : 'text-green-400 dark:text-[var(--primary)]'}`}>
                              ${hasError ? '--' : formatNumber(rate.compra)}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className={`font-mono font-bold text-base ${hasError ? 'text-zinc-600 dark:text-[var(--muted-foreground)]' : 'text-red-400 dark:text-[var(--destructive)]'}`}>
                              ${hasError ? '--' : formatNumber(rate.venta)}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className={`font-mono font-bold text-base ${hasError ? 'text-zinc-600 dark:text-[var(--muted-foreground)]' : 'text-white dark:text-[var(--foreground)]'}`}>
                              ${hasError ? '--' : formatNumber(rate.promedio)}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {hasError ? (
                              <span className="text-zinc-600 dark:text-[var(--muted-foreground)] text-sm">--</span>
                            ) : rate.variacion !== undefined && rate.variacion !== 0 ? (
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${
                                isPositiveVariation
                                  ? 'bg-green-500/20 dark:bg-[var(--accent)] text-green-400 dark:text-[var(--primary)] border border-green-500/40 dark:border-[var(--accent)]'
                                  : 'bg-red-500/20 dark:bg-[var(--overdue-pill)] text-red-400 dark:text-[var(--destructive)] border border-red-500/40 dark:border-[var(--overdue-pill)]'
                              }`}>
                                {isPositiveVariation ? '↑' : '↓'} {Math.abs(rate.variacion).toFixed(2)}%
                              </span>
                            ) : (
                              <span className="text-zinc-500 dark:text-[var(--muted-foreground)] text-sm">--</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {hasError ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-red-500/20 dark:bg-[var(--overdue-pill)] text-red-400 dark:text-[var(--destructive)] border border-red-500/40 dark:border-[var(--overdue-pill)]">
                                ERROR
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-green-500/20 dark:bg-[var(--accent)] text-green-400 dark:text-[var(--primary)] border border-green-500/40 dark:border-[var(--accent)]">
                                ✓ ONLINE
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Información adicional */}
          <div className="mt-6 p-4 bg-blue-500/10 dark:bg-[var(--accent)] border-2 border-blue-500/30 dark:border-[var(--accent)] rounded-xl">
            <h4 className="text-blue-400 dark:text-[var(--primary)] font-bold text-sm mb-3 uppercase">📋 Información sobre las cotizaciones:</h4>
            <ul className="text-blue-300 dark:text-[var(--primary)] text-sm space-y-2 list-none">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 dark:text-[var(--primary)] font-bold">▸</span>
                <span><strong className="font-bold">Compra:</strong> Precio al que puedes vender esa moneda (lo que recibes)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 dark:text-[var(--primary)] font-bold">▸</span>
                <span><strong className="font-bold">Venta:</strong> Precio al que puedes comprar esa moneda (lo que pagas)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 dark:text-[var(--primary)] font-bold">▸</span>
                <span><strong className="font-bold">Promedio:</strong> Valor de referencia entre compra y venta</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 dark:text-[var(--primary)] font-bold">▸</span>
                <span><strong className="font-bold">Variación:</strong> Cambio porcentual respecto al día anterior</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 dark:text-[var(--primary)] font-bold">▸</span>
                <span><strong className="font-bold">Estado:</strong> Disponibilidad actual de la cotización</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 dark:text-[var(--primary)] font-bold">▸</span>
                <span><strong className="font-bold">Comisión:</strong> Se aplica sobre el resultado final de la conversión</span>
              </li>
            </ul>
            <p className="text-blue-400 dark:text-[var(--primary)] text-xs mt-3 font-semibold">
              💡 <strong className="font-bold">Tip:</strong> Los precios se actualizan en tiempo real desde CriptoYa.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}