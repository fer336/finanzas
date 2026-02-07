import React from 'react';
import { Tag, TrendingUp, TrendingDown } from 'lucide-react';

export const CategoriesSection = ({ data, onViewDetails }) => {
    if (!data) return null;

    const categories = data.categorias || [];
    const transactions = data.transacciones || [];

    // Calculate totals
    const categoriasIngreso = categories.filter(c => (c.tipo || c.Tipo || '').toLowerCase() === 'ingreso');
    const categoriasGasto = categories.filter(c => (c.tipo || c.Tipo || '').toLowerCase() === 'gasto');

    const totalIngresos = transactions
        .filter(t => (t.Tipo || t.tipo || '').toLowerCase() === 'ingreso')
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.Monto || t.monto || 0)), 0);

    const totalGastos = transactions
        .filter(t => (t.Tipo || t.tipo || '').toLowerCase() === 'gasto')
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.Monto || t.monto || 0)), 0);

    return (
        <div className="glass-panel flex flex-col h-full">
            <div className="flex justify-between items-center p-6 border-b border-white/5">
                <h3 className="text-lg font-bold leading-tight flex items-center gap-2">
                    <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                    Categorías {categories.length > 0 && <span className="text-muted-foreground text-sm font-normal">({categories.length})</span>}
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
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-green-400" />
                            <p className="text-sm text-green-400 font-medium">Ingresos</p>
                        </div>
                        <p className="text-2xl font-bold text-white">{categoriasIngreso.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            ${totalIngresos.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>

                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingDown className="w-4 h-4 text-red-400" />
                            <p className="text-sm text-red-400 font-medium">Gastos</p>
                        </div>
                        <p className="text-2xl font-bold text-white">{categoriasGasto.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            ${totalGastos.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                {/* Top categories preview */}
                <div className="flex flex-col gap-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Más usadas</p>
                    {categories.slice(0, 3).map((cat, index) => {
                        const isIngreso = (cat.tipo || cat.Tipo || '').toLowerCase() === 'ingreso';
                        return (
                            <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                                <div className="flex items-center gap-2">
                                    <Tag className={`w-3 h-3 ${isIngreso ? 'text-green-400' : 'text-red-400'}`} />
                                    <span className="text-sm text-white">{cat.nombre || cat.Nombre}</span>
                                </div>
                                <span className={`text-xs ${isIngreso ? 'text-green-400' : 'text- red-400'}`}>
                                    {isIngreso ? 'Ingreso' : 'Gasto'}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
