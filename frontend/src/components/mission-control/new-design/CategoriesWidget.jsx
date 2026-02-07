import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAmountVisibility } from '../../../contexts/AmountVisibilityContext';
import { Tag } from 'lucide-react';

export const CategoriesWidget = ({ transactions = [], onViewDetails }) => {
    const { formatAmount } = useAmountVisibility();

    const data = useMemo(() => {
        if (!transactions || transactions.length === 0) return [];

        const categoryTotals = {};

        transactions.forEach(t => {
            // Considerar solo gastos
            if ((t.Tipo || t.tipo)?.toLowerCase() !== 'gasto') return;

            const catName = t.Categorias?.Nombre || t.Categorias?.nombre || t.categoria || 'Sin Categoría';
            const amount = parseFloat(t.Monto || t.monto || 0);

            if (!categoryTotals[catName]) {
                categoryTotals[catName] = 0;
            }
            categoryTotals[catName] += Math.abs(amount);
        });

        const result = Object.entries(categoryTotals)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // Top 5 categories + Others
        if (result.length > 5) {
            const top5 = result.slice(0, 5);
            const others = result.slice(5).reduce((sum, item) => sum + item.value, 0);
            if (others > 0) {
                return [...top5, { name: 'Otros', value: others }];
            }
            return top5;
        }

        return result;
    }, [transactions]);

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

    const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const percentage = ((payload[0].value / total) * 100).toFixed(1);
            return (
                <div className="bg-[#18181b] border border-white/10 p-3 rounded-lg shadow-xl">
                    <p className="text-white font-medium mb-1">{payload[0].name}</p>
                    <p className="text-white/70 text-sm">
                        {formatAmount(payload[0].value)}
                    </p>
                    <p className="text-white/50 text-xs mt-1">
                        {percentage}% del total
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="glass-panel flex flex-col h-full">
            <div className="flex justify-between items-center p-4 border-b border-white/5">
                <h3 className="text-base font-bold leading-tight flex items-center gap-2 text-white">
                    <Tag size={16} className="text-blue-500" />
                    Categorías
                </h3>
                <button
                    onClick={onViewDetails}
                    className="text-blue-400 text-xs font-medium hover:text-blue-300 transition-colors cursor-pointer"
                >
                    Ver todo
                </button>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-4 flex-1 p-4">
                {data.length > 0 ? (
                    <>
                        {/* Pie Chart */}
                        <div className="w-full lg:w-2/5 h-[160px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={65}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {data.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={COLORS[index % COLORS.length]} 
                                                stroke="rgba(0,0,0,0.3)" 
                                                strokeWidth={1} 
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Category List */}
                        <div className="w-full lg:w-3/5 flex flex-col gap-2">
                            {data.slice(0, 5).map((item, index) => {
                                const percentage = ((item.value / total) * 100).toFixed(1);
                                return (
                                    <div key={index} className="flex items-center gap-2 group cursor-pointer" onClick={onViewDetails}>
                                        <div 
                                            className="w-3 h-3 rounded-full flex-shrink-0" 
                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-xs font-medium truncate group-hover:text-blue-400 transition-colors">
                                                {item.name}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className="text-white/50 text-xs">
                                                {percentage}%
                                            </span>
                                            <span className="text-white text-xs font-medium min-w-[60px] text-right">
                                                {formatAmount(item.value)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center text-white/30 flex-1 w-full">
                        <Tag size={48} className="mb-2 opacity-50" />
                        <p className="text-sm">No hay datos de categorías</p>
                    </div>
                )}
            </div>
        </div>
    );
};
