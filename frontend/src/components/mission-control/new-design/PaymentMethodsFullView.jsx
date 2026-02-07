import React, { useState } from 'react';
import { ArrowLeft, Search, Plus, Wallet, CreditCard, Building2, Trash2, Edit2 } from 'lucide-react';

export const PaymentMethodsFullView = ({ data, onBack, onPaymentMethodClick, onAddPaymentMethod, onDeletePaymentMethod }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    const paymentMethods = data?.metodosPago || [];
    const transactions = data?.transacciones || [];

    // Calculate stats
    const methodsWithStats = paymentMethods.map(method => {
        const methodTransactions = transactions.filter(t => {
            const methodId = t.metodo_pago_id || t.MetodoPagoId;
            return methodId === (method.id || method.Id);
        });

        const total = methodTransactions.reduce((sum, t) => {
            const amount = Math.abs(parseFloat(t.Monto || t.monto || 0));
            return sum + amount;
        }, 0);

        return {
            ...method,
            total,
            count: methodTransactions.length,
            tipo: (method.tipo || method.Tipo || '').toLowerCase()
        };
    });

    const filteredMethods = methodsWithStats.filter(method => {
        const matchesSearch = (method.nombre || method.Nombre || '').toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;
        if (typeFilter !== 'all' && method.tipo !== typeFilter) return false;
        return true;
    });

    const totalAmount = filteredMethods.reduce((sum, m) => sum + m.total, 0);
    const totalTransactions = filteredMethods.reduce((sum, m) => sum + m.count, 0);

    const getIcon = (tipo) => {
        switch (tipo) {
            case 'efectivo': return <Wallet className="w-5 h-5" />;
            case 'tarjeta_credito':
            case 'tarjeta_debito': return <CreditCard className="w-5 h-5" />;
            case 'transferencia': return <Building2 className="w-5 h-5" />;
            default: return <Wallet className="w-5 h-5" />;
        }
    };

    const getTypeLabel = (tipo) => {
        const labels = {
            'efectivo': 'Efectivo',
            'tarjeta_credito': 'Crédito',
            'tarjeta_debito': 'Débito',
            'transferencia': 'Transferencia',
            'debito_automatico': 'Débito Auto.'
        };
        return labels[tipo] || tipo;
    };

    return (
        <div className="flex flex-col gap-6 animate-fadeIn pb-32 min-h-screen bg-black">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4 pt-8 mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors border border-white/5"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">
                            Métodos de Pago
                        </h1>
                        <p className="text-muted-foreground mt-2 text-base">
                            {filteredMethods.length} métodos encontrados
                        </p>
                    </div>
                </div>
                <button
                    onClick={onAddPaymentMethod}
                    className="px-3 py-3 md:px-6 md:py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-bold text-sm transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20"
                >
                    <Plus className="w-5 h-5" />
                    <span className="hidden md:inline">Nuevo Método</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 mb-8">
                <div className="bg-[#161616] border border-white/5 rounded-2xl p-5">
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2">Total Transacciones</p>
                    <p className="text-2xl font-bold text-white">{totalTransactions}</p>
                </div>
                <div className="bg-[#161616] border border-white/5 rounded-2xl p-5">
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2">Monto Total</p>
                    <p className="text-2xl font-bold text-cyan-400">
                        ${totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="px-4 flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar método..."
                        className="w-full bg-[#161616] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-base text-white placeholder:text-muted-foreground focus:outline-none focus:border-cyan-500/50 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                    {['all', 'efectivo', 'tarjeta_credito', 'tarjeta_debito', 'transferencia'].map(type => (
                         <button
                            key={type}
                            onClick={() => setTypeFilter(type)}
                            className={`px-6 py-4 rounded-2xl text-sm font-bold whitespace-nowrap border transition-colors ${
                                typeFilter === type 
                                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/50' 
                                : 'bg-[#161616] text-muted-foreground border-white/5 hover:bg-white/5'
                            }`}
                         >
                            {type === 'all' ? 'Todos' : getTypeLabel(type)}
                         </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="px-4 flex flex-col gap-3">
                {filteredMethods.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        No se encontraron métodos de pago
                    </div>
                ) : (
                    filteredMethods.map((method) => {
                        const iconColor = method.tipo === 'efectivo' ? 'text-green-400' : 
                                         method.tipo === 'tarjeta_credito' ? 'text-orange-400' :
                                         method.tipo === 'tarjeta_debito' ? 'text-blue-400' :
                                         'text-purple-400';
                        
                        const bgColor = method.tipo === 'efectivo' ? 'bg-green-500/10' : 
                                       method.tipo === 'tarjeta_credito' ? 'bg-orange-500/10' :
                                       method.tipo === 'tarjeta_debito' ? 'bg-blue-500/10' :
                                       'bg-purple-500/10';
                        
                        return (
                            <div
                                key={method.id || method.Id}
                                className="bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 rounded-xl p-3 flex items-center gap-3 hover:bg-white/5 transition-all active:scale-[0.98] duration-100"
                            >
                                {/* Icon */}
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${bgColor} ${iconColor}`}>
                                    {getIcon(method.tipo)}
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-white text-sm truncate mb-0.5">
                                        {method.nombre || method.Nombre}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-white/5 text-white/70">
                                            {getTypeLabel(method.tipo)}
                                        </span>
                                        <span className="text-[10px] text-white/50">
                                            {method.count} ops
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Amount */}
                                <div className="text-right flex-shrink-0">
                                    <span className="block font-bold text-white text-base">
                                        ${method.total >= 1000000 
                                            ? `${(method.total / 1000000).toFixed(1)}M`
                                            : method.total >= 1000 
                                            ? `${(method.total / 1000).toFixed(0)}K`
                                            : method.total.toFixed(0)
                                        }
                                    </span>
                                </div>
                                
                                {/* Actions */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onPaymentMethodClick && onPaymentMethodClick(method);
                                        }}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                        aria-label="Editar"
                                    >
                                        <Edit2 className="w-4 h-4 text-blue-400" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm(`¿Eliminar método "${method.nombre || method.Nombre}"?`)) {
                                                onDeletePaymentMethod && onDeletePaymentMethod(method.id || method.Id);
                                            }
                                        }}
                                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                        aria-label="Eliminar"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-400" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
