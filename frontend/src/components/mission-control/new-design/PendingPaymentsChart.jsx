import React from 'react';
import { CreditCard, ChevronRight } from 'lucide-react';
import { useAmountVisibility } from '../../../contexts/AmountVisibilityContext';

export const PendingPaymentsChart = ({ payments, onViewAll }) => {
    const { formatAmount } = useAmountVisibility();

    if (!payments) return null;

    // Calculate stats
    const totalPayments = payments.length;
    const paidPayments = payments.filter(p => {
        const estado = (p.Estado || p.estado || '').toString().toLowerCase();
        return estado === 'pagado' || estado === 'true' || p.pagada === true;
    }).length;
    const pendingPayments = totalPayments - paidPayments;

    const paidPercentage = totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 0;
    // const pendingPercentage = totalPayments > 0 ? (pendingPayments / totalPayments) * 100 : 0;

    // Calculate total pending amount
    const totalPendingAmount = payments
        .filter(p => {
            const estado = (p.Estado || p.estado || '').toString().toLowerCase();
            const isPaid = estado === 'pagado' || estado === 'true' || p.pagada === true;
            return !isPaid;
        })
        .reduce((sum, p) => sum + parseFloat(p.Monto || p.monto || 0), 0);

    // SVG parameters
    const size = 160;
    const strokeWidth = 12;
    const center = size / 2;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const paidOffset = circumference - (paidPercentage / 100) * circumference;
    // const pendingOffset = circumference - (pendingPercentage / 100) * circumference;

    return (
        <div className="glass-panel p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                        <CreditCard className="w-5 h-5 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Estado de Pagos</h3>
                </div>
                <button
                    onClick={onViewAll}
                    className="text-sm text-muted-foreground hover:text-white flex items-center gap-1 transition-colors"
                >
                    Ver todo <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 flex items-center justify-center relative">
                {/* Chart */}
                <div className="relative w-40 h-40">
                    <svg className="w-full h-full -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
                        {/* Background circle */}
                        <circle
                            cx={center}
                            cy={center}
                            r={radius}
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.05)"
                            strokeWidth={strokeWidth}
                        />

                        {/* Paid segment (Green) */}
                        <circle
                            cx={center}
                            cy={center}
                            r={radius}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth={strokeWidth}
                            strokeDasharray={circumference}
                            strokeDashoffset={paidOffset}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                        />
                    </svg>

                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-white">{paidPayments}/{totalPayments}</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Pagados</span>
                    </div>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-xs text-emerald-400 mb-1">Pagados</p>
                    <p className="text-xl font-bold text-white">{paidPayments}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <p className="text-xs text-blue-400 mb-1">Pendientes</p>
                    <p className="text-xl font-bold text-white">{pendingPayments}</p>
                </div>
            </div>

            {/* Total Pending Amount */}
            <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-xs text-red-400 mb-1">Total Pagos Pendientes</p>
                <p className="text-2xl font-bold text-white">{formatAmount(totalPendingAmount, { decimals: 2 })}</p>
            </div>
        </div>
    );
};
