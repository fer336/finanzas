import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAmountVisibility } from '../../../contexts/AmountVisibilityContext';
import { Wallet } from 'lucide-react';

export const PaymentMethodsWidget = ({ transactions = [], onViewDetails }) => {
    const { formatAmount } = useAmountVisibility();

    const data = useMemo(() => {
        if (!transactions || transactions.length === 0) return [];

        const methodTotals = {};

        transactions.forEach(t => {
            const methodName = t.MetodosPago?.Nombre || t.MetodosPago?.nombre || t.metodo_pago || 'Otros';
            const amount = parseFloat(t.Monto || t.monto || 0);

            if (!methodTotals[methodName]) {
                methodTotals[methodName] = 0;
            }
            methodTotals[methodName] += Math.abs(amount);
        });

        return Object.entries(methodTotals)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5 methods
    }, [transactions]);

    const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#18181b] border border-white/10 p-3 rounded-lg shadow-xl">
                    <p className="text-white font-medium mb-1">{label}</p>
                    <p className="text-white/70 text-sm">
                        {formatAmount(payload[0].value)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="glass-panel flex flex-col h-full min-h-[300px]">
            <div className="flex justify-between items-center p-6 border-b border-white/5">
                <h3 className="text-lg font-bold leading-tight flex items-center gap-2 text-white">
                    <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                    Métodos de Pago <span className="text-white/50 text-sm font-normal">({data.length})</span>
                </h3>
                <button
                    onClick={onViewDetails}
                    className="text-purple-400 text-sm font-medium hover:text-purple-300 transition-colors cursor-pointer"
                >
                    Ver detalles
                </button>
            </div>

            <div className="flex flex-col items-center justify-center flex-1 p-6" onClick={onViewDetails} style={{ cursor: 'pointer' }}>
                {data.length > 0 ? (
                    <div className="w-full h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                                    width={100}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-white/30">
                        <Wallet size={48} className="mb-2 opacity-50" />
                        <p>No hay datos de métodos de pago</p>
                    </div>
                )}
            </div>
        </div>
    );
};
