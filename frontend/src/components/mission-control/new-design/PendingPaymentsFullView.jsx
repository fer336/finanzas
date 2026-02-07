import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Download, ChevronLeft, ChevronRight, Calendar, AlertCircle, CheckCircle, Clock, CreditCard, Edit, Filter, Plus, ArrowDownLeft, Trash2, X } from 'lucide-react';
import { useAmountVisibility } from '../../../contexts/AmountVisibilityContext';
import { useIsMobile } from '../../../hooks/use-mobile';

const PendingPaymentsFullView = ({ payments, onBack, onPay, onEdit, onDelete, onAdd }) => {
    const isMobile = useIsMobile();
    const { formatAmount } = useAmountVisibility();
    const [filteredPayments, setFilteredPayments] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totals, setTotals] = useState({ total: 0, pending: 0, overdue: 0 });

    // State for mobile filter/search visibility
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [showMobileSearch, setShowMobileSearch] = useState(false);

    // Get current month in YYYY-MM format
    const getCurrentMonth = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    };

    const [filters, setFilters] = useState({
        search: '',
        status: 'pending', // all, pending, overdue, paid
        priority: 'all',
        selectedMonth: getCurrentMonth()
    });

    const ITEMS_PER_PAGE = isMobile ? 100 : 20;

    useEffect(() => {
        if (!payments) return;

        let result = [...payments];

        // Filter by search
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            result = result.filter(p =>
                (p.Nombre || p.nombre || '').toLowerCase().includes(searchLower) ||
                (p.Descripcion || p.descripcion || '').toLowerCase().includes(searchLower)
            );
        }

        // Date filters - filter by selected month (based on Due Date)
        if (isMobile && filters.selectedMonth) {
            const [year, month] = filters.selectedMonth.split('-').map(Number);
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59, 999);

            result = result.filter(p => {
                const dueDate = new Date(p.Fechavencimiento || p.fechavencimiento || p.FechaVencimiento || p.fecha_vencimiento);
                
                // Check if paid
                const estado = (p.Estado || p.estado || '').toString().toLowerCase();
                const isPaid = estado === 'pagado' || estado === 'true' || p.pagada === true;

                const isInMonth = dueDate >= startDate && dueDate <= endDate;
                const isPastPending = !isPaid && dueDate < startDate;

                // Include if it's in the selected month OR if it's a past pending payment
                return isInMonth || isPastPending;
            });
        }

        // Filter by status (keep existing logic but respect month filter first)
        if (filters.status !== 'all') {
            const now = new Date();
            now.setHours(0, 0, 0, 0);

            result = result.filter(p => {
                const estado = (p.Estado || p.estado || '').toString().toLowerCase();
                const isPaid = estado === 'pagado' || estado === 'true' || p.pagada === true;
                const dueDate = new Date(p.Fechavencimiento || p.fechavencimiento || p.FechaVencimiento || p.fecha_vencimiento);
                dueDate.setHours(0, 0, 0, 0);
                const isOverdue = !isPaid && dueDate < now;

                if (filters.status === 'paid') return isPaid;
                if (filters.status === 'pending') return !isPaid; // Include overdue in pending filter if mobile? Or strict?
                // Let's keep it strict if user selected 'pending' vs 'overdue'
                if (filters.status === 'overdue') return isOverdue;
                return true;
            });
        }

        setFilteredPayments(result);
        setTotalPages(Math.ceil(result.length / ITEMS_PER_PAGE) || 1);
        setPage(1); // Reset to first page on filter change

        // Calculate totals for the current filtered view (or strict month view)
        const totalAmount = result.reduce((sum, p) => sum + parseFloat(p.Monto || p.monto || 0), 0);
        // Note: For pending payments, we might want to sum up pending vs paid in the selected month
        setTotals({
            total: totalAmount,
            count: result.length
        });

    }, [payments, filters, isMobile, ITEMS_PER_PAGE]);

    const paginatedPayments = filteredPayments.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
    );

    const formatCurrency = (amount) => {
        return formatAmount(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('es-AR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).format(date);
    };

    const getComprobanteUrl = (payment) => {
        if (!payment) return null;
        return payment.Comprobante || payment.comprobante || 
               payment.UrlPdf || payment.url_pdf || payment.urlPdf || payment.URL_pdf || payment.Urlpdf ||
               payment.ArchivoAdjunto || payment.archivo_adjunto || payment.archivoAdjunto || '';
    };

    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedPayment, setSelectedPayment] = useState(null); // For detailed card modal

    const getStatusBadge = (payment) => {
        // Normalizar estado
        const estado = (payment.Estado || payment.estado || '').toString().toLowerCase();
        const isPaid = estado === 'pagado' || estado === 'true' || payment.pagada === true;

        const dueDate = new Date(payment.Fechavencimiento || payment.fechavencimiento || payment.FechaVencimiento || payment.fecha_vencimiento);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);
        const isOverdue = !isPaid && dueDate < now;
        const isDueSoon = !isPaid && !isOverdue && (dueDate - now) / (1000 * 60 * 60 * 24) <= 7;

        if (isPaid) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                    <CheckCircle className="w-3 h-3" /> Pagado
                </span>
            );
        }
        if (isOverdue) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                    <AlertCircle className="w-3 h-3" /> Vencido
                </span>
            );
        }
        if (isDueSoon) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                    <Clock className="w-3 h-3" /> Próximo
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                <Calendar className="w-3 h-3" /> Pendiente
            </span>
        );
    };

    // Separate payments for mobile view
    const [year, month] = filters.selectedMonth.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    
    const pastPendingPayments = filteredPayments.filter(p => {
        const dueDate = new Date(p.Fechavencimiento || p.fechavencimiento || p.FechaVencimiento || p.fecha_vencimiento);
        // Normalized isPaid check
        const estado = (p.Estado || p.estado || '').toString().toLowerCase();
        const isPaid = estado === 'pagado' || estado === 'true' || p.pagada === true;
        
        // Strict check: Must be unpaid AND before current month start
        return !isPaid && dueDate < startDate;
    });

    // Current month payments are the rest (either in month OR paid past payments if any leaked through filter? 
    // actually filter logic says "isInMonth || isPastPending", so "paid past payments" are already excluded by filter unless they are in month)
    const currentMonthPayments = filteredPayments.filter(p => !pastPendingPayments.includes(p));

    // Group payments by due date for mobile view (only current month)
    const groupedPayments = currentMonthPayments.reduce((groups, payment) => {
        const date = payment.Fechavencimiento || payment.fechavencimiento || payment.FechaVencimiento || payment.fecha_vencimiento;
        const dateObj = new Date(date);
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        let dateLabel = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
        
        if (dateObj.toDateString() === today.toDateString()) {
            dateLabel = `Hoy, ${dateObj.getDate()} de ${dateObj.toLocaleDateString('es-ES', { month: 'long' })}`;
        } else if (dateObj.toDateString() === tomorrow.toDateString()) {
            dateLabel = `Mañana, ${dateObj.getDate()} de ${dateObj.toLocaleDateString('es-ES', { month: 'long' })}`;
        }

        if (!groups[dateLabel]) {
            groups[dateLabel] = [];
        }
        groups[dateLabel].push(payment);
        return groups;
    }, {});

    if (isMobile) {
        return (
            <div className="flex flex-col min-h-screen bg-black text-white pb-44 animate-fadeIn">
                {/* Header */}
                <div className="flex items-center justify-between p-4 pt-6">
                    <h1 className="text-2xl font-bold">Pagos</h1>
                    <div className="flex gap-2">
                        <button 
                            onClick={onAdd}
                            className="p-2 rounded-full transition-colors bg-green-500/10 text-green-500 hover:bg-green-500/20"
                            title="Añadir pago pendiente"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => {
                                setShowMobileFilters(!showMobileFilters);
                                setShowMobileSearch(false);
                            }}
                            className={`p-2 rounded-full transition-colors ${showMobileFilters ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Filter className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => {
                                setShowMobileSearch(!showMobileSearch);
                                setShowMobileFilters(false);
                            }}
                             className={`p-2 rounded-full transition-colors ${showMobileSearch ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Search className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Mobile Search Bar */}
                {showMobileSearch && (
                    <div className="px-4 pb-4 animate-in slide-in-from-top-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Buscar pago..."
                                autoFocus
                                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                            {filters.search && (
                                <button 
                                    onClick={() => setFilters({ ...filters, search: '' })}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-white/10 rounded-full"
                                >
                                    <X className="w-3 h-3 text-gray-400" />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                 {/* Mobile Filters */}
                 {showMobileFilters && (
                    <div className="px-4 pb-4 animate-in slide-in-from-top-2">
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            {['all', 'pending', 'overdue', 'paid'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setFilters({ ...filters, status })}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                                        filters.status === status 
                                            ? 'bg-white text-black' 
                                            : 'bg-[#1a1a1a] text-gray-400 border border-white/10'
                                    }`}
                                >
                                    {status === 'all' && 'Todos'}
                                    {status === 'pending' && 'Pendientes'}
                                    {status === 'overdue' && 'Vencidos'}
                                    {status === 'paid' && 'Pagados'}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Month Selector */}
                <div className="flex overflow-x-auto no-scrollbar px-4 pb-2 gap-6 text-sm font-medium text-gray-500 border-b border-white/10">
                    {[-1, 0, 1].map(offset => {
                        const [year, month] = filters.selectedMonth.split('-').map(Number);
                        const date = new Date(year, month - 1 + offset, 1);
                        const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                        const isSelected = monthStr === filters.selectedMonth;
                        
                        return (
                            <button
                                key={monthStr}
                                onClick={() => setFilters({ ...filters, selectedMonth: monthStr })}
                                className={`pb-2 whitespace-nowrap capitalize transition-colors ${
                                    isSelected ? 'text-white border-b-2 border-white' : ''
                                }`}
                            >
                                {date.toLocaleDateString('es-ES', { month: 'long' })}
                                {isSelected && offset !== 0 && <span className="text-xs ml-1 text-gray-600">{date.getFullYear()}</span>}
                            </button>
                        );
                    })}
                </div>

                {/* Summary Card */}
                <div className="mx-4 mt-4 bg-[#162028] rounded-2xl p-4 flex justify-between items-center text-sm border border-white/5">
                    <div className="flex flex-col items-center flex-1">
                        <span className="text-gray-400 text-xs mb-1">Total a Pagar</span>
                        <span className="text-white font-bold flex items-center gap-1 text-lg">
                            <ArrowDownLeft className="w-4 h-4 text-red-400" />
                            ${Math.round(totals.total).toLocaleString()}
                        </span>
                    </div>
                    <div className="w-px h-8 bg-white/10 mx-4"></div>
                    <div className="flex flex-col items-center flex-1">
                        <span className="text-gray-400 text-xs mb-1">Pagos</span>
                        <span className="text-white font-bold text-lg">
                            {totals.count}
                        </span>
                    </div>
                </div>

                {/* Past Pending Payments - Small View */}
                {pastPendingPayments.length > 0 && (
                    <div className="px-4 mt-6">
                        <div className="flex items-center gap-2 mb-3">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <h3 className="text-red-500 text-sm font-bold uppercase tracking-wider">Vencidos Anteriores ({pastPendingPayments.length})</h3>
                        </div>
                        <div className="flex flex-col gap-3 pb-2 px-0">
                             {pastPendingPayments.map(payment => (
                                 <div 
                                     key={payment.id || payment.Id}
                                     className="w-full bg-[#1a0f0f] border border-red-500/20 rounded-xl p-4 flex flex-col gap-3 active:scale-95 transition-transform"
                                     onClick={() => setSelectedPayment(payment)}
                                 >
                                     <div className="flex justify-between items-start gap-3">
                                         <div className="min-w-0">
                                            <h4 className="font-bold text-white truncate text-sm">{payment.Nombre || payment.nombre}</h4>
                                            <p className="text-xs text-gray-400 truncate">{payment.Descripcion || payment.descripcion}</p>
                                         </div>
                                         <span className="text-red-400 font-bold whitespace-nowrap">-${Math.round(payment.Monto || payment.monto).toLocaleString()}</span>
                                     </div>
                                     <div className="flex justify-between items-center pt-2 border-t border-red-500/10">
                                         <span className="text-[10px] text-red-400/80">Vencía: {formatDate(payment.Fechavencimiento || payment.fechavencimiento)}</span>
                                         <span className="text-[10px] px-2 py-0.5 bg-red-500/10 text-red-400 rounded-full border border-red-500/20 uppercase font-medium">Vencido</span>
                                     </div>
                                 </div>
                             ))}
                        </div>
                    </div>
                )}

                {/* List Items */}
                <div className="flex-1 px-4 mt-4 space-y-6">
                     {Object.keys(groupedPayments).length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No hay pagos para este mes
                        </div>
                    ) : (
                        Object.entries(groupedPayments).map(([dateLabel, dayPayments]) => (
                            <div key={dateLabel}>
                                <h3 className="text-gray-500 text-sm mb-3">{dateLabel}</h3>
                                <div className="space-y-4">
                                    {dayPayments.map(payment => {
                                        const isPaid = (payment.Estado || payment.estado || '').toString().toLowerCase() === 'pagado' || payment.pagada === true;
                                        
                                        return (
                                            <div 
                                                key={payment.id || payment.Id}
                                                className="flex items-center justify-between active:opacity-70 transition-opacity"
                                                onClick={() => setSelectedPayment(payment)}
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden flex-1 pr-4">
                                                    <div className="w-10 h-10 rounded-full bg-[#162028] flex items-center justify-center shrink-0 text-gray-400">
                                                        <CreditCard className="w-5 h-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="font-medium text-white truncate text-base">{payment.Nombre || payment.nombre || 'Sin nombre'}</h3>
                                                        <div className="flex items-center gap-2">
                                                            {getStatusBadge(payment)}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <span className={`font-bold shrink-0 ${isPaid ? 'text-green-400' : 'text-white'}`}>
                                                    -${Math.round(payment.Monto || payment.monto).toLocaleString()}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* FAB Button */}
                <button
                    onClick={() => onEdit && onEdit(null)} // Trigger add new
                    className="fixed bottom-24 right-4 w-14 h-14 bg-[#a8c5da] hover:bg-[#90b0c5] text-black rounded-2xl shadow-lg flex items-center justify-center transition-transform active:scale-95 z-50"
                >
                    <Plus className="w-6 h-6" />
                </button>

                {/* Payment Detail Modal (Card View) */}
                {selectedPayment && (
                    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedPayment(null)}>
                        <div 
                            className="w-full bg-[#161616] rounded-t-3xl p-6 pb-32 border-t border-white/10 animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto" 
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-12 h-1.5 bg-gray-700 rounded-full mx-auto mb-6 shrink-0" />
                            
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-1">{selectedPayment.Nombre || selectedPayment.nombre}</h2>
                                    <p className="text-gray-400">{selectedPayment.Descripcion || selectedPayment.descripcion}</p>
                                </div>
                                <div className="p-3 bg-[#2a2a2a] rounded-xl shrink-0">
                                    <CreditCard className="w-8 h-8 text-white" />
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center py-3 border-b border-white/5">
                                    <span className="text-gray-400">Monto</span>
                                    <span className="text-2xl font-bold text-white">${Math.round(selectedPayment.Monto || selectedPayment.monto).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-white/5">
                                    <span className="text-gray-400">Vencimiento</span>
                                    <span className="text-white font-medium">{formatDate(selectedPayment.Fechavencimiento || selectedPayment.fechavencimiento)}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-white/5">
                                    <span className="text-gray-400">Estado</span>
                                    <div>{getStatusBadge(selectedPayment)}</div>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-white/5">
                                    <span className="text-gray-400">Comprobante</span>
                                    <div>
                                        {getComprobanteUrl(selectedPayment) ? (
                                            <a 
                                                href={getComprobanteUrl(selectedPayment)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg border border-blue-500/20 transition-colors font-medium flex items-center gap-2"
                                            >
                                                <Download className="w-3 h-3" /> Ver Factura
                                            </a>
                                        ) : (
                                            <span className="text-xs text-gray-500 italic">No adjunto</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => {
                                        setSelectedPayment(null);
                                        onEdit && onEdit(selectedPayment);
                                    }}
                                    className="py-4 rounded-xl bg-[#2a2a2a] text-white font-bold hover:bg-[#333] transition-colors"
                                >
                                    Editar
                                </button>
                                {((selectedPayment.Estado || selectedPayment.estado || '').toString().toLowerCase() !== 'pagado' && selectedPayment.pagada !== true) ? (
                                    <button
                                        onClick={() => {
                                            setSelectedPayment(null);
                                            onPay(selectedPayment);
                                        }}
                                        className="py-4 rounded-xl bg-[#5ce1e6] text-black font-bold hover:bg-[#4bccd0] transition-colors shadow-lg shadow-cyan-500/20"
                                    >
                                        Pagar Ahora
                                    </button>
                                ) : (
                                    <button disabled className="py-4 rounded-xl bg-green-500/20 text-green-500 font-bold border border-green-500/30 cursor-default">
                                        Pagado
                                    </button>
                                )}
                                {/* Delete Button */}
                                <button
                                    onClick={() => {
                                         if (window.confirm('¿Estás seguro de que deseas eliminar este pago pendiente?')) {
                                             setSelectedPayment(null);
                                             // We need a delete handler prop or access to delete function here. 
                                             // Assuming a prop onRemove or similar, or we can use onEdit with a specific flag, but better to request delete.
                                             // Since onRemove isn't explicitly passed, let's assume onEdit can handle deletions or we need to add it.
                                             // Based on context, onEdit(payment) opens edit form. 
                                             // Let's check parent component handling.
                                             // For now, I'll add a delete prop to the component signature and use it.
                                             onDelete && onDelete(selectedPayment);
                                         }
                                    }}
                                    className="col-span-2 py-3 rounded-xl bg-red-500/10 text-red-500 font-bold border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" /> Eliminar Pago
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 animate-fadeIn pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors border border-white/5"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">
                            Pagos Pendientes
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Gestiona tus vencimientos y pagos programados
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={onAdd}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm font-medium">Añadir Pago</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/5 transition-colors">
                        <Download className="w-4 h-4" />
                        <span className="text-sm font-medium">Exportar</span>
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="glass-panel p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar pago..."
                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                </div>

                <div className="flex gap-3 w-full md:w-auto overflow-x-auto">
                    <select
                        className="bg-black/95 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 [&>option]:bg-black/95"
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="all" className="bg-black/95 text-white">Todos los estados</option>
                        <option value="pending" className="bg-black/95 text-white">Pendientes</option>
                        <option value="overdue" className="bg-black/95 text-white">Vencidos</option>
                        <option value="paid" className="bg-black/95 text-white">Pagados</option>
                    </select>
                </div>
            </div>

            {/* Payments List */}
            <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Pago</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Vencimiento</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Comprobante</th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Monto</th>
                                <th className="px-6 py-4 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {paginatedPayments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-muted-foreground">
                                        No se encontraron pagos
                                    </td>
                                </tr>
                            ) : (
                                paginatedPayments.map((payment) => {
                                    const comprobanteUrl = getComprobanteUrl(payment);
                                    const isPaid = (payment.Estado || payment.estado || '').toString().toLowerCase() === 'pagado' || payment.pagada === true;

                                    return (
                                        <tr key={payment.id || payment.Id} className="group hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                                                        <CreditCard className="w-4 h-4 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-white">{payment.Nombre || payment.nombre || 'Sin nombre'}</p>
                                                        <p className="text-xs text-muted-foreground">{payment.Descripcion || payment.descripcion}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                {formatDate(payment.Fechavencimiento || payment.fechavencimiento || payment.FechaVencimiento || payment.fecha_vencimiento)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(payment)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {comprobanteUrl ? (
                                                    <a
                                                        href={comprobanteUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 px-2 py-1 rounded border border-blue-500/20 transition-colors inline-block"
                                                    >
                                                        Ver Comprobante
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">No disponible</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <span className="font-bold text-white">
                                                    {formatCurrency(payment.Monto || payment.monto)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {!isPaid && (
                                                        <>
                                                            <button
                                                                onClick={() => onPay(payment)}
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-medium transition-colors"
                                                            >
                                                                Pagar
                                                            </button>
                                                            <button
                                                                onClick={() => onEdit && onEdit(payment)}
                                                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                                                title="Editar"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => onDelete && onDelete(payment)}
                                                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                                                                title="Eliminar"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {isPaid && (
                                                        <button
                                                            onClick={() => onEdit && onEdit(payment)}
                                                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                                            title="Ver/Editar"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Página <span className="font-medium text-white">{page}</span> de <span className="font-medium text-white">{totalPages}</span>
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Image Modal */}
            {selectedImage && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
                    <div className="relative max-w-4xl max-h-[90vh] w-full bg-zinc-900 rounded-2xl overflow-hidden border border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-4 right-4 z-10">
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        <div className="flex items-center justify-center h-full bg-black">
                            <img
                                src={selectedImage}
                                alt="Comprobante"
                                className="max-w-full max-h-[85vh] object-contain"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingPaymentsFullView;
