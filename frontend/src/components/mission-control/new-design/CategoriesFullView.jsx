import React, { useState } from 'react';
import { ArrowLeft, Search, Plus, Tag, TrendingUp, TrendingDown, Trash2, Edit2 } from 'lucide-react';

export const CategoriesFullView = ({ data, onBack, onCategoryClick, onAddCategory, onDeleteCategory }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    const categories = data?.categorias || [];
    const transactions = data?.transacciones || [];

    // Calculate stats
    const categoriesWithStats = categories.map(cat => {
        const catTransactions = transactions.filter(t => {
            const catId = t.categoria_id || t.CategoriaId;
            return catId === (cat.id || cat.Id);
        });

        const total = catTransactions.reduce((sum, t) => {
            const amount = Math.abs(parseFloat(t.Monto || t.monto || 0));
            return sum + amount;
        }, 0);

        return {
            ...cat,
            total,
            count: catTransactions.length,
            tipo: (cat.tipo || cat.Tipo || '').toLowerCase()
        };
    });

    const filteredCategories = categoriesWithStats.filter(cat => {
        const matchesSearch = (cat.nombre || cat.Nombre || '').toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;
        if (typeFilter !== 'all' && cat.tipo !== typeFilter) return false;
        return true;
    });

    const totalIngresos = filteredCategories
        .filter(c => c.tipo === 'ingreso')
        .reduce((sum, c) => sum + c.total, 0);

    const totalGastos = filteredCategories
        .filter(c => c.tipo === 'gasto')
        .reduce((sum, c) => sum + c.total, 0);

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
                            Categorías
                        </h1>
                        <p className="text-muted-foreground mt-2 text-base">
                            {filteredCategories.length} categorías
                        </p>
                    </div>
                </div>
                <button
                    onClick={onAddCategory}
                    className="px-3 py-3 md:px-6 md:py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-bold text-sm transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20"
                >
                    <Plus className="w-5 h-5" />
                    <span className="hidden md:inline">Nueva Categoría</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 px-4 mb-8">
                <div className="col-span-2 md:col-span-1 bg-[#161616] border border-white/5 rounded-2xl p-5">
                     <div className="flex items-center gap-2 mb-2">
                        <Tag className="w-4 h-4 text-gray-400" />
                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Total</p>
                     </div>
                    <p className="text-2xl font-bold text-white">{categories.length} <span className="text-sm font-normal text-gray-500">categorías</span></p>
                </div>
                <div className="bg-[#161616] border border-white/5 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <p className="text-green-400/70 text-xs font-medium uppercase tracking-wider">Ingresos</p>
                    </div>
                    <p className="text-2xl font-bold text-green-400">
                        ${totalIngresos.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                </div>
                <div className="bg-[#161616] border border-white/5 rounded-2xl p-5">
                     <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="w-4 h-4 text-red-400" />
                        <p className="text-red-400/70 text-xs font-medium uppercase tracking-wider">Gastos</p>
                    </div>
                    <p className="text-2xl font-bold text-red-400">
                        ${totalGastos.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="px-4 flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar categoría..."
                        className="w-full bg-[#161616] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-base text-white placeholder:text-muted-foreground focus:outline-none focus:border-cyan-500/50 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'ingreso', 'gasto'].map(type => (
                         <button
                            key={type}
                            onClick={() => setTypeFilter(type)}
                            className={`px-6 py-4 rounded-2xl text-sm font-bold whitespace-nowrap border transition-colors ${
                                typeFilter === type 
                                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/50' 
                                : 'bg-[#161616] text-muted-foreground border-white/5 hover:bg-white/5'
                            }`}
                         >
                            {type === 'all' ? 'Todas' : type.charAt(0).toUpperCase() + type.slice(1) + 's'}
                         </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="px-4 flex flex-col gap-3">
                {filteredCategories.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        No se encontraron categorías
                    </div>
                ) : (
                    filteredCategories.map((category) => {
                        const isIngreso = category.tipo === 'ingreso';
                        
                        return (
                            <div
                                key={category.id || category.Id}
                                className="bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 rounded-xl p-3 flex items-center gap-3 hover:bg-white/5 transition-all active:scale-[0.98] duration-100"
                            >
                                {/* Icon */}
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                    isIngreso ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                }`}>
                                    <Tag className="w-4 h-4" />
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-white text-sm truncate mb-0.5">
                                        {category.nombre || category.Nombre}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                            isIngreso 
                                            ? 'bg-green-500/10 text-green-400' 
                                            : 'bg-red-500/10 text-red-400'
                                        }`}>
                                            {isIngreso ? 'INGRESO' : 'GASTO'}
                                        </span>
                                        <span className="text-[10px] text-white/50">
                                            {category.count} ops
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Amount */}
                                <div className="text-right flex-shrink-0">
                                    <span className={`block font-bold text-base ${isIngreso ? 'text-green-400' : 'text-red-400'}`}>
                                        ${category.total >= 1000000 
                                            ? `${(category.total / 1000000).toFixed(1)}M`
                                            : category.total >= 1000 
                                            ? `${(category.total / 1000).toFixed(0)}K`
                                            : category.total.toFixed(0)
                                        }
                                    </span>
                                </div>
                                
                                {/* Actions */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onCategoryClick && onCategoryClick(category);
                                        }}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                        aria-label="Editar"
                                    >
                                        <Edit2 className="w-4 h-4 text-blue-400" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm(`¿Eliminar categoría "${category.nombre || category.Nombre}"?`)) {
                                                onDeleteCategory && onDeleteCategory(category.id || category.Id);
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
