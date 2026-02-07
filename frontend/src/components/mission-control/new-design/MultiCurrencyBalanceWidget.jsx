import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Euro, BanknoteIcon, PoundSterling, Plus, Settings } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useAmountVisibility } from '../../../contexts/AmountVisibilityContext';
import apiServices from '../../../services/api';

export const MultiCurrencyBalanceWidget = ({ data, onManageCurrencies }) => {
    const { formatAmount } = useAmountVisibility();
    const [currencies, setCurrencies] = useState([]);
    const [loading, setLoading] = useState(true);

    // Obtener monedas del usuario desde la API
    useEffect(() => {
        const fetchCurrencies = async () => {
            try {
                setLoading(true);
                const userCurrencies = await apiServices.monedasApi.getAll({ activa: true, orden_by: 'orden' });
                
                // Si el usuario no tiene monedas, inicializar las predeterminadas
                if (!userCurrencies || userCurrencies.length === 0) {
                    console.log('⚠️ Usuario sin monedas en widget, inicializando...');
                    await apiServices.monedasApi.initializeDefault();
                    // Recargar después de inicializar
                    const newCurrencies = await apiServices.monedasApi.getAll({ activa: true, orden_by: 'orden' });
                    setCurrencies(newCurrencies);
                    console.log('✅ Monedas inicializadas en widget:', newCurrencies);
                } else {
                    setCurrencies(userCurrencies);
                }
            } catch (error) {
                console.error('Error fetching currencies:', error);
                // Si falla, usar monedas por defecto
                setCurrencies([
                    { codigo: 'ARS', nombre: 'Peso Argentino', simbolo: '$', icono: 'DollarSign', color: 'from-blue-500 to-cyan-500', orden: 0 },
                    { codigo: 'USD', nombre: 'Dólar', simbolo: 'U$D', icono: 'DollarSign', color: 'from-green-500 to-emerald-500', orden: 1 },
                    { codigo: 'EUR', nombre: 'Euro', simbolo: '€', icono: 'Euro', color: 'from-purple-500 to-pink-500', orden: 2 },
                    { codigo: 'BRL', nombre: 'Real Brasileño', simbolo: 'R$', icono: 'Banknote', color: 'from-yellow-500 to-orange-500', orden: 3 },
                    { codigo: 'GBP', nombre: 'Libra Esterlina', simbolo: '£', icono: 'PoundSterling', color: 'from-indigo-500 to-violet-500', orden: 4 }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchCurrencies();
    }, []);

    // 💰 Normalizar código de moneda (corregir errores comunes)
    const normalizeCurrency = (codigo) => {
        if (!codigo) return 'ARS';
        const normalized = codigo.toUpperCase().trim();
        
        // Corrección de códigos incorrectos
        const corrections = {
            'ARG': 'ARS',  // Error común: ARG → ARS
            'PESO': 'ARS',
            'PESOS': 'ARS',
            'DOLLAR': 'USD',
            'DOLLARS': 'USD',
            'DOLAR': 'USD',
            'DOLARES': 'USD'
        };
        
        return corrections[normalized] || normalized;
    };

    // Calcular balance, ingresos y gastos por cada moneda
    const calculateStatsByMoneda = (moneda) => {
        if (!data?.transacciones) return { balance: 0, income: 0, expenses: 0 };

        const transacciones = data.transacciones.filter(t => {
            const tMoneda = normalizeCurrency(t.Moneda || t.moneda || 'ARS');
            return tMoneda === moneda;
        });

        const getTipo = (t) => (t.Tipo || t.tipo || '').toLowerCase();
        const getMonto = (t) => Math.abs(parseFloat(t.Monto || t.monto || 0));
        const esCredito = (t) => t.es_credito === true;

        const ingresos = transacciones.filter(t => getTipo(t) === 'ingreso');
        const gastos = transacciones.filter(t => getTipo(t) === 'gasto');
        
        // IMPORTANTE: No contar gastos a crédito en el balance
        const gastosEfectivo = gastos.filter(t => !esCredito(t));

        const income = ingresos.reduce((sum, t) => sum + getMonto(t), 0);
        const expenses = gastosEfectivo.reduce((sum, t) => sum + getMonto(t), 0);
        const balance = income - expenses;

        return { balance, income, expenses };
    };

    // Mapear nombre de icono (string) al componente de Lucide
    const getIconComponent = (iconName) => {
        if (!iconName) return DollarSign;
        return LucideIcons[iconName] || DollarSign;
    };

    const CurrencyCard = ({ currency }) => {
        const stats = calculateStatsByMoneda(currency.codigo);
        const Icon = getIconComponent(currency.icono);
        const hasMovements = stats.income > 0 || stats.expenses > 0;

        return (
            <div className="glass-panel p-4 hover:bg-white/5 transition-all group">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${currency.color} bg-opacity-10`}>
                            <Icon className={`w-5 h-5 bg-gradient-to-br ${currency.color} bg-clip-text text-transparent`} />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-400">{currency.nombre}</p>
                            <p className="text-lg font-bold text-white">{currency.codigo}</p>
                        </div>
                    </div>
                    {!hasMovements && (
                        <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded">
                            Sin movimientos
                        </span>
                    )}
                </div>

                <div className="space-y-2">
                    {/* Balance */}
                    <div className="flex items-center justify-between p-2 bg-zinc-900/50 rounded-lg">
                        <span className="text-xs text-zinc-400">Balance</span>
                        <span className={`text-sm font-bold ${
                            stats.balance > 0 ? 'text-emerald-400' : 
                            stats.balance < 0 ? 'text-red-400' : 
                            'text-zinc-400'
                        }`}>
                            {currency.simbolo}{formatAmount(stats.balance, { decimals: 2 })}
                        </span>
                    </div>

                    {/* Ingresos */}
                    <div className="flex items-center justify-between p-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-3 h-3 text-emerald-400" />
                            <span className="text-xs text-emerald-400">Ingresos</span>
                        </div>
                        <span className="text-sm font-semibold text-emerald-400">
                            {currency.simbolo}{formatAmount(stats.income, { decimals: 2 })}
                        </span>
                    </div>

                    {/* Gastos */}
                    <div className="flex items-center justify-between p-2 bg-red-500/5 rounded-lg border border-red-500/10">
                        <div className="flex items-center gap-2">
                            <TrendingDown className="w-3 h-3 text-red-400" />
                            <span className="text-xs text-red-400">Gastos</span>
                        </div>
                        <span className="text-sm font-semibold text-red-400">
                            {currency.simbolo}{formatAmount(stats.expenses, { decimals: 2 })}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="glass-panel p-6">
                <div className="flex items-center justify-center h-48">
                    <div className="text-zinc-400">Cargando monedas...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
                        <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Balance Multi-Moneda</h3>
                        <p className="text-xs text-zinc-400">Balance separado por moneda</p>
                    </div>
                </div>
                
                {/* Botón para gestionar monedas (solo desktop) */}
                {onManageCurrencies && (
                    <button
                        onClick={onManageCurrencies}
                        className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white shadow-lg shadow-teal-500/30 transition-all hover:scale-105"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm font-medium">Gestionar Monedas</span>
                    </button>
                )}
            </div>

            {/* Grid responsive: 1 columna en mobile, 2 en tablet, cantidad dinámica en desktop */}
            {(() => {
                const currenciesWithMovements = currencies.filter(currency => {
                    const stats = calculateStatsByMoneda(currency.codigo);
                    return stats.income > 0 || stats.expenses > 0;
                });

                if (currenciesWithMovements.length === 0) {
                    return (
                        <div className="glass-panel p-8 text-center">
                            <div className="text-zinc-400 text-sm">
                                <p className="mb-2">📊 No hay transacciones registradas</p>
                                <p className="text-xs text-zinc-500">Agrega una transacción para ver tus balances por moneda</p>
                            </div>
                        </div>
                    );
                }

                return (
                    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(currenciesWithMovements.length, 5)} gap-4`}>
                        {currenciesWithMovements.map(currency => (
                            <CurrencyCard key={currency.id || currency.codigo} currency={currency} />
                        ))}
                    </div>
                );
            })()}

            {/* Nota informativa */}
            <div className="glass-panel p-3 bg-blue-500/5 border border-blue-500/20">
                <p className="text-xs text-zinc-400">
                    <span className="font-semibold text-blue-400">💡 Nota:</span> Los balances se calculan en la moneda original de cada transacción. 
                    Los gastos con tarjeta de crédito no afectan el balance hasta que se pagan.
                </p>
            </div>
        </div>
    );
};

