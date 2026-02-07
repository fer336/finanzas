import { TrendingUp, ChevronRight, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useAmountVisibility } from '../../../contexts/AmountVisibilityContext';

export const TransactionsChart = ({ transactions, onViewAll, filter = 'todo' }) => {
    const { formatAmount } = useAmountVisibility();

    if (!transactions) return null;

    // Helpers
    const normalizeCurrency = (codigo) => {
        if (!codigo) return 'ARS';
        const normalized = codigo.toUpperCase().trim();
        const corrections = {
            'ARG': 'ARS',
            'PESO': 'ARS',
            'PESOS': 'ARS',
            'DOLLAR': 'USD',
            'DOLLARS': 'USD',
            'DOLAR': 'USD',
            'DOLARES': 'USD'
        };
        return corrections[normalized] || normalized;
    };

    const getCurrencySymbol = (code) => {
        const symbols = {
            'ARS': '$',
            'USD': 'U$D',
            'EUR': '€',
            'BRL': 'R$',
            'GBP': '£'
        };
        return symbols[code] || code;
    };

    const formatCurrency = (amount) => {
        return formatAmount(amount, { decimals: 0 });
    };

    // Calculate totals by currency (exclude credit expenses)
    const totalsByCurrency = {};
    transactions.forEach(t => {
        const moneda = normalizeCurrency(t.Moneda || t.moneda || 'ARS');
        const tipo = (t.Tipo || t.tipo || '').toLowerCase();
        const monto = Math.abs(parseFloat(t.Monto || t.monto || 0));
        const esCredito = t.es_credito === true;

        if (!totalsByCurrency[moneda]) {
            totalsByCurrency[moneda] = { income: 0, expense: 0 };
        }

        if (tipo === 'ingreso') {
            totalsByCurrency[moneda].income += monto;
        } else if (tipo === 'gasto' && !esCredito) {
            totalsByCurrency[moneda].expense += monto;
        }
    });

    const showIncome = filter === 'todo' || filter === 'ingreso';
    const showExpense = filter === 'todo' || filter === 'gasto';

    const activeCurrencies = Object.entries(totalsByCurrency)
        .filter(([_, totals]) => totals.income > 0 || totals.expense > 0);

    return (
        <div className="glass-panel p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                        <TrendingUp className="w-5 h-5 text-purple-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Balance Reciente</h3>
                </div>
                <button
                    onClick={onViewAll}
                    className="text-sm text-muted-foreground hover:text-white flex items-center gap-1 transition-colors"
                >
                    Ver todo <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 flex flex-col justify-center gap-4">
                {activeCurrencies.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No hay transacciones recientes.</div>
                ) : (
                    activeCurrencies.map(([moneda, totals]) => {
                        const maxVal = Math.max(totals.income, totals.expense, 1);
                        const net = totals.income - totals.expense;
                        return (
                            <div key={moneda} className="rounded-xl bg-white/5 border border-white/10 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-white font-semibold">
                                        {getCurrencySymbol(moneda)} {moneda}
                                    </span>
                                    {filter === 'todo' && (
                                        <span className={`text-sm font-bold ${net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {net >= 0 ? '+' : '-'}{getCurrencySymbol(moneda)}{formatCurrency(Math.abs(net))}
                                        </span>
                                    )}
                                </div>

                                {showIncome && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-left-4 duration-500">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-emerald-400 flex items-center gap-1">
                                                <ArrowUpRight className="w-4 h-4" /> Ingresos
                                            </span>
                                            <span className="font-bold text-white">
                                                {getCurrencySymbol(moneda)}{formatCurrency(totals.income)}
                                            </span>
                                        </div>
                                        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${(totals.income / maxVal) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}

                                {showExpense && (
                                    <div className="space-y-2 mt-3 animate-in fade-in slide-in-from-left-4 duration-500 delay-100">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-red-400 flex items-center gap-1">
                                                <ArrowDownLeft className="w-4 h-4" /> Gastos
                                            </span>
                                            <span className="font-bold text-white">
                                                {getCurrencySymbol(moneda)}{formatCurrency(totals.expense)}
                                            </span>
                                        </div>
                                        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-red-500 rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${(totals.expense / maxVal) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
