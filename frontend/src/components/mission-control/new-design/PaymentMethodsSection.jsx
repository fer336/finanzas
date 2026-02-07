import React from 'react';
import { Wallet, CreditCard, Building2 } from 'lucide-react';

export const PaymentMethodsSection = ({ data, onViewDetails }) => {
    if (!data) return null;

    const methods = data.metodosPago || [];
    const transactions = data.transacciones || [];

    // Calculate stats
    const totalTransactions = transactions.length;
    const totalAmount = transactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.Monto || t.monto || 0)), 0);

    // Count by type
    const methodTypes = methods.reduce((acc, m) => {
        const tipo = (m.tipo || m.Tipo || '').toLowerCase();
        acc[tipo] = (acc[tipo] || 0) + 1;
        return acc;
    }, {});

    const getIcon = (tipo) => {
        switch (tipo) {
            case 'efectivo':
                return <Wallet className="w-4 h-4" />;
            case 'tarjeta_credito':
            case 'tarjeta_debito':
                return <CreditCard className="w-4 h-4" />;
            case 'transferencia':
                return <Building2 className="w-4 h-4" />;
            default:
                return <Wallet className="w-4 h-4" />;
        }
    };

    const getTypeLabel = (tipo) => {
        const labels = {
            'efectivo': 'Efectivo',
            'tarjeta_credito': 'Tarjeta Crédito',
            'tarjeta_debito': 'Tarjeta Débito',
            'transferencia': 'Transferencia'
        };
        return labels[tipo] || tipo;
    };

    return (
        <div className="glass-panel flex flex-col h-full">
            <div className="flex justify-between items-center p-6 border-b border-white/5">
                <h3 className="text-lg font-bold leading-tight flex items-center gap-2">
                    <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                    Métodos de Pago {methods.length > 0 && <span className="text-muted-foreground text-sm font-normal">({methods.length})</span>}
                </h3>
                <button
                    onClick={onViewDetails}
                    className="text-cyan-400 text-sm font-medium hover:text-cyan-300 transition-colors cursor-pointer"
                >
                    Ver detalles
                </button>
            </div>
            <div className="flex flex-col p-6 gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                        <p className="text-sm text-cyan-400 font-medium mb-2">Transacciones</p>
                        <p className="text-2xl font-bold text-white">{totalTransactions}</p>
                    </div>

                    <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                        <p className="text-sm text-cyan-400 font-medium mb-2">Total Movido</p>
                        <p className="text-2xl font-bold text-white">
                            ${(totalAmount / 1000).toFixed(0)}K
                        </p>
                    </div>
                </div>

                {/* Methods by type */}
                <div className="flex flex-col gap-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Por tipo</p>
                    {Object.entries(methodTypes).slice(0, 3).map(([tipo, count], index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded bg-cyan-500/10 text-cyan-400">
                                    {getIcon(tipo)}
                                </div>
                                <span className="text-sm text-white">{getTypeLabel(tipo)}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {count} {count === 1 ? 'método' : 'métodos'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
