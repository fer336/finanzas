import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Search, Download, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownLeft, Trash2, Plus, Filter, Eye, FileText } from 'lucide-react';
import apiServices from '../../../services/api';
import { useAmountVisibility } from '../../../contexts/AmountVisibilityContext';
import { useIsMobile } from '../../../hooks/use-mobile';

const TransactionsFullView = ({ onBack, onEdit, onDelete, refreshTrigger }) => {
    const isMobile = useIsMobile();
    const { formatAmount } = useAmountVisibility();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState(null);
    const [selectedTransactions, setSelectedTransactions] = useState(new Set());
    const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(''); // Local search state for debounce
    const [allMonthTransactions, setAllMonthTransactions] = useState([]); // Para totales por moneda
    const [showMobileSearch, setShowMobileSearch] = useState(false); // 🔍 Toggle search in mobile
    const [showMobileFilters, setShowMobileFilters] = useState(false); // 🔽 Toggle filters in mobile

    // Get current month in YYYY-MM format
    const getCurrentMonth = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    };

    const [filters, setFilters] = useState({
        search: '',
        type: 'all', // all, ingreso, gasto
        selectedMonth: getCurrentMonth(), // Default to current month
        selectedDate: null // Filtro por día específico (YYYY-MM-DD)
    });

    // 🔒 Block body scroll when modals are open
    useEffect(() => {
        if (deleteModalOpen || bulkDeleteModalOpen) {
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = 'var(--scrollbar-width, 0px)';
        } else {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }
        
        return () => {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        };
    }, [deleteModalOpen, bulkDeleteModalOpen]);

    // 📅 Helper: Formatear fecha como YYYY-MM-DD sin zona horaria
    const formatDateOnly = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            // Prepare filters
            const apiFilters = {};
            if (filters.type !== 'all') apiFilters.tipo = filters.type;

            // Date filters - filter by selected date or month
            if (filters.selectedDate) {
                // Si hay un día específico seleccionado, filtrar solo ese día
                apiFilters.fecha_desde = filters.selectedDate;
                apiFilters.fecha_hasta = filters.selectedDate;
            } else if (filters.selectedMonth) {
                // Si no, filtrar por el mes completo
                const [year, month] = filters.selectedMonth.split('-').map(Number);
                const startDate = new Date(year, month - 1, 1);
                const endDate = new Date(year, month, 0);

                apiFilters.fecha_desde = formatDateOnly(startDate);
                apiFilters.fecha_hasta = formatDateOnly(endDate);
            }

            // Use pagination for both mobile and desktop
            const limit = 100;
            const offset = (page - 1) * limit;
            
            const result = await apiServices.transaccionesApi.getAll(limit, offset, apiFilters);
            if (result && result.list) {
                // Excluir gastos con tarjeta de crédito de la vista de transacciones
                let filteredList = result.list.filter(t => t.es_credito !== true);
                // Filter by search term if provided (TODO: move to backend)
                if (filters.search) {
                    filteredList = filteredList.filter(t => {
                        const desc = (t.Descripcion || t.descripcion || '').toLowerCase();
                        const cat = (t.Categorias?.Nombre || t.Categorias?.nombre || '').toLowerCase();
                        const searchLower = filters.search.toLowerCase();
                        return desc.includes(searchLower) || cat.includes(searchLower);
                    });
                }
                setTransactions(filteredList);
                // Assuming API returns total count or pages, otherwise mock it
                const limit = isMobile ? 50 : 20;
                setTotalPages(Math.ceil((result.pageInfo?.totalRows || filteredList.length) / limit) || 1);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setFilters(prev => ({ ...prev, search: searchTerm }));
            setPage(1); // Reset a página 1 cuando cambia la búsqueda
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Reset page cuando cambian los filtros de tipo
    useEffect(() => {
        setPage(1);
    }, [filters.type, filters.selectedMonth]);

    useEffect(() => {
        fetchTransactions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, filters, refreshTrigger, isMobile]);

    // 💰 Fetch TODAS las transacciones del mes para calcular totales por moneda
    useEffect(() => {
        const fetchAllMonthTransactions = async () => {
            try {
                const apiFilters = {};
                
                // Date filters - filter by selected month (formato YYYY-MM-DD)
                if (filters.selectedMonth) {
                    const [year, month] = filters.selectedMonth.split('-').map(Number);
                    const startDate = new Date(year, month - 1, 1);
                    const endDate = new Date(year, month, 0);

                    apiFilters.fecha_desde = formatDateOnly(startDate);
                    apiFilters.fecha_hasta = formatDateOnly(endDate);
                }

                // Fetch ALL transactions for the month (limit razonable)
                const result = await apiServices.transaccionesApi.getAll(500, 0, apiFilters);
                if (result && result.list) {
                    const nonCredit = result.list.filter(t => t.es_credito !== true);
                    setAllMonthTransactions(nonCredit);
                }
            } catch (error) {
                console.error('Error fetching all month transactions:', error);
                setAllMonthTransactions([]);
            }
        };

        fetchAllMonthTransactions();
    }, [filters.selectedMonth, refreshTrigger]);

    // Calculate totals with useMemo for better performance
    const totals = useMemo(() => {
        const income = transactions
            .filter(t => (t.Tipo || t.tipo) === 'ingreso')
            .reduce((sum, t) => sum + parseFloat(t.Monto || t.monto || 0), 0);
        const expense = transactions
            .filter(t => (t.Tipo || t.tipo) === 'gasto')
            .reduce((sum, t) => sum + Math.abs(parseFloat(t.Monto || t.monto || 0)), 0);
        return {
            income,
            expense,
            balance: income - expense
        };
    }, [transactions]);

    const formatCurrency = (amount) => {
        return formatAmount(amount);
    };

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

    // 💱 Función para obtener el símbolo de moneda
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

    // 💰 Calcular totales por moneda - USANDO TODAS LAS TRANSACCIONES DEL MES
    const currencyTotals = useMemo(() => {
        const totals = {};
        
        allMonthTransactions.forEach(t => {
            const moneda = normalizeCurrency(t.Moneda || t.moneda || 'ARS');
            const tipo = (t.Tipo || t.tipo || '').toLowerCase();
            const monto = Math.abs(parseFloat(t.Monto || t.monto || 0));
            
            if (!totals[moneda]) {
                totals[moneda] = { ingresos: 0, gastos: 0, balance: 0, count: 0 };
            }
            
            totals[moneda].count++;
            
            if (tipo === 'ingreso') {
                totals[moneda].ingresos += monto;
            } else if (tipo === 'gasto') {
                // ✅ Incluir TODOS los gastos (incluso crédito)
                totals[moneda].gastos += monto;
            }
        });
        
        // Calcular balance y FILTRAR monedas sin movimientos REALES
        const result = {};
        Object.keys(totals).forEach(moneda => {
            const balance = totals[moneda].ingresos - totals[moneda].gastos;
            // Solo incluir si tiene transacciones Y al menos ingresos o gastos > 0
            if (totals[moneda].count > 0 && (totals[moneda].ingresos > 0 || totals[moneda].gastos > 0)) {
                result[moneda] = {
                    ...totals[moneda],
                    balance
                };
            }
        });
        
        return result;
    }, [allMonthTransactions]);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).format(date);
    };

    const getMonthName = (dateStr) => {
        if (!dateStr) return '';
        const [year, month] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        return date.toLocaleDateString('es-ES', { month: 'long' });
    };

    const handleDeleteClick = (transaction, e) => {
        e.stopPropagation();
        setTransactionToDelete(transaction);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!transactionToDelete || !onDelete) return;
        
        try {
            const success = await onDelete(transactionToDelete);
            if (success) {
                fetchTransactions(); // Refresh local list
            }
        } catch (error) {
            console.error("Error deleting transaction:", error);
        } finally {
            setDeleteModalOpen(false);
            setTransactionToDelete(null);
        }
    };

    // Bulk selection handlers
    const handleSelectTransaction = (transactionId) => {
        if (!transactionId) {
            console.warn('⚠️ Intento de seleccionar transacción sin ID');
            return;
        }
        const newSelection = new Set(selectedTransactions);
        if (newSelection.has(transactionId)) {
            newSelection.delete(transactionId);
        } else {
            newSelection.add(transactionId);
        }
        setSelectedTransactions(newSelection);
        console.log('✅ Selección actual:', newSelection.size);
    };

    const handleSelectAll = () => {
        if (selectedTransactions.size === transactions.length) {
            // Deselect all
            setSelectedTransactions(new Set());
        } else {
            // Select all valid IDs
            const allIds = new Set();
            transactions.forEach(t => {
                const id = t.id || t.Id;
                if (id) allIds.add(id);
            });
            setSelectedTransactions(allIds);
            console.log('✅ Seleccionadas todas:', allIds.size);
        }
    };

    const handleBulkDelete = () => {
        if (selectedTransactions.size === 0) return;
        setBulkDeleteModalOpen(true);
    };

    const handleExport = async () => {
        try {
            if (transactions.length === 0) {
                alert('No hay transacciones para exportar');
                return;
            }

            // Show loading state
            const exportButton = document.querySelector('[data-export-button]');
            if (exportButton) {
                exportButton.disabled = true;
                exportButton.innerHTML = '<span class="flex items-center gap-2"><span class="animate-spin">⏳</span>Exportando...</span>';
            }

            // Fetch ALL transactions for the selected month (no pagination)
            const apiFilters = {};
            if (filters.type !== 'all') apiFilters.tipo = filters.type;

            // Date filters - filter by selected month
            if (filters.selectedMonth) {
                const [year, month] = filters.selectedMonth.split('-').map(Number);
                const startDate = new Date(year, month - 1, 1);
                const endDate = new Date(year, month, 0);

                apiFilters.fecha_desde = formatDateOnly(startDate);
                apiFilters.fecha_hasta = formatDateOnly(endDate);
            }

            // Get ALL transactions (limit = 10000 to get all)
            const result = await apiServices.transaccionesApi.getAll(10000, 0, apiFilters);
            
            let allTransactions = result?.list || [];
            
            // Apply search filter if present
            if (filters.search) {
                allTransactions = allTransactions.filter(t => {
                    const desc = (t.Descripcion || t.descripcion || '').toLowerCase();
                    const cat = (t.Categorias?.Nombre || t.Categorias?.nombre || '').toLowerCase();
                    const searchLower = filters.search.toLowerCase();
                    return desc.includes(searchLower) || cat.includes(searchLower);
                });
            }

            if (allTransactions.length === 0) {
                alert('No hay transacciones para exportar con los filtros aplicados');
                return;
            }

            // Create HTML table for Excel
            let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
            html += '<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Transacciones</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->';
            html += '<meta http-equiv="content-type" content="text/plain; charset=UTF-8"/></head><body>';
            html += '<table border="1">';
            
            // Header row
            html += '<thead><tr style="background-color: #4a5568; color: white; font-weight: bold;">';
            html += '<th>FECHA</th>';
            html += '<th>DESCRIPCIÓN</th>';
            html += '<th>TIPO</th>';
            html += '<th>MONTO</th>';
            html += '<th>MONEDA</th>';
            html += '<th>MONTO ARS</th>';
            html += '<th>CATEGORÍA</th>';
            html += '<th>MÉTODO DE PAGO</th>';
            html += '</tr></thead>';
            
            // Data rows
            html += '<tbody>';
            allTransactions.forEach(t => {
                const monto = parseFloat(t.Monto || t.monto || 0);
                const montoArs = parseFloat(t.MontoArs || t.monto_ars || monto);
                const tipo = (t.Tipo || t.tipo || '').toLowerCase();
                const moneda = t.Moneda || t.moneda || 'ARS';
                
                // Format amount without sign for the original amount
                const montoFormateado = `${Math.abs(monto).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                const montoArsFormateado = `${Math.abs(montoArs).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                
                // Color based on type
                const colorMonto = tipo === 'gasto' ? 'color: #ef4444;' : 'color: #22c55e;';
                
                // Format date as DD-MM-YYYY
                const fechaStr = t.FechaTransaccion || t.fecha_transaccion;
                let fechaFormateada = '';
                if (fechaStr) {
                    const fecha = new Date(fechaStr);
                    const dia = String(fecha.getDate()).padStart(2, '0');
                    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
                    const anio = fecha.getFullYear();
                    fechaFormateada = `${dia}-${mes}-${anio}`;
                }
                
                // Capitalize first letter of tipo
                const tipoFormateado = tipo.charAt(0).toUpperCase() + tipo.slice(1);
                
                html += '<tr>';
                html += `<td>${fechaFormateada}</td>`;
                html += `<td>${t.Descripcion || t.descripcion || ''}</td>`;
                html += `<td style="${colorMonto} font-weight: bold;">${tipoFormateado}</td>`;
                html += `<td style="${colorMonto} font-weight: bold;">${montoFormateado}</td>`;
                html += `<td>${moneda}</td>`;
                html += `<td>${montoArsFormateado}</td>`;
                html += `<td>${t.Categorias?.Nombre || t.Categorias?.nombre || t.categoria?.nombre || 'Sin categoría'}</td>`;
                html += `<td>${t.MetodosPago?.Nombre || t.MetodosPago?.nombre || t.metodo_pago?.nombre || 'Sin método'}</td>`;
                html += '</tr>';
            });
            html += '</tbody></table></body></html>';

            // Create blob and download
            const blob = new Blob(['\ufeff' + html], {
                type: 'application/vnd.ms-excel;charset=utf-8'
            });
            
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            const monthYear = filters.selectedMonth.split('-').join('_');
            
            link.setAttribute('href', url);
            link.setAttribute('download', `transacciones_${monthYear}_completo.xls`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            // Show success message
            const monthName = getMonthName(filters.selectedMonth);
            alert(`✅ Se exportaron ${allTransactions.length} transacciones de ${monthName} exitosamente`);
            
        } catch (error) {
            console.error('Error exporting transactions:', error);
            alert('❌ Error al exportar transacciones: ' + error.message);
        } finally {
            // Restore export button
            const exportButton = document.querySelector('[data-export-button]');
            if (exportButton) {
                exportButton.disabled = false;
                exportButton.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg><span class="text-sm font-medium">Exportar</span>';
            }
        }
    };

    const handleConfirmBulkDelete = async () => {
        try {
            const idsToDelete = Array.from(selectedTransactions);
            
            if (idsToDelete.length === 0) {
                alert('No hay transacciones seleccionadas');
                return;
            }

            console.log(`🗑️ Enviando solicitud para eliminar ${idsToDelete.length} transacciones:`, idsToDelete);
            
            // Call bulk delete API
            const response = await apiServices.transaccionesApi.bulkDelete(idsToDelete);
            
            console.log('✅ Respuesta eliminación masiva:', response);
            
            let message = '';
            if (response.deleted_count > 0) {
                message += `✅ Se eliminaron ${response.deleted_count} transacciones.`;
            }
            if (response.failed_count > 0) {
                message += `\n⚠️ No se pudieron eliminar ${response.failed_count} transacciones.`;
            }
            
            if (message) alert(message);

            setSelectedTransactions(new Set());
            fetchTransactions(); // Refresh list
        } catch (error) {
            console.error("❌ Error bulk deleting transactions:", error);
            alert('Error al eliminar transacciones: ' + (error.message || 'Error desconocido'));
        } finally {
            setBulkDeleteModalOpen(false);
        }
    };

    // Group transactions by date for mobile view
    const groupedTransactions = transactions.reduce((groups, transaction) => {
        const date = transaction.FechaTransaccion || transaction.fecha_transaccion;
        let dateObj;
        
        // Parse date correctly to avoid timezone issues
        if (date && typeof date === 'string' && !date.includes('T')) {
            const [y, m, d] = date.split('-').map(Number);
            dateObj = new Date(y, m - 1, d); // Construct in local time
        } else {
            dateObj = new Date(date);
        }

        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        // Reset hours for accurate date comparison
        const compareDate = new Date(dateObj);
        compareDate.setHours(0, 0, 0, 0);
        const todayReset = new Date(today);
        todayReset.setHours(0, 0, 0, 0);
        const yesterdayReset = new Date(yesterday);
        yesterdayReset.setHours(0, 0, 0, 0);

        let dateLabel = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
        
        if (compareDate.getTime() === todayReset.getTime()) {
            dateLabel = `Hoy, ${dateObj.getDate()} de ${dateObj.toLocaleDateString('es-ES', { month: 'long' })}`;
        } else if (compareDate.getTime() === yesterdayReset.getTime()) {
            dateLabel = `Ayer, ${dateObj.getDate()} de ${dateObj.toLocaleDateString('es-ES', { month: 'long' })}`;
        }

        if (!groups[dateLabel]) {
            groups[dateLabel] = [];
        }
        groups[dateLabel].push(transaction);
        return groups;
    }, {});

    if (isMobile) {
        return (
            <div className="flex flex-col min-h-screen bg-black text-white pb-24">
                {/* Delete Confirmation Modal (Mobile) */}
                {deleteModalOpen && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl max-w-md w-full shadow-xl animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-6 space-y-4">
                                <div className="flex items-center gap-3 text-red-400">
                                    <div className="p-2 bg-red-500/10 rounded-lg">
                                        <Trash2 className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-semibold">Eliminar Transacción</h3>
                                </div>
                                
                                <p className="text-white/70">
                                    ¿Estás seguro de que deseas eliminar esta transacción? 
                                    <br />
                                    <span className="text-white font-medium block mt-2">
                                        {transactionToDelete?.Descripcion || transactionToDelete?.descripcion}
                                    </span>
                                </p>

                                <div className="flex gap-3 justify-end pt-2">
                                    <button
                                        onClick={() => {
                                            setDeleteModalOpen(false);
                                            setTransactionToDelete(null);
                                        }}
                                        className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleConfirmDelete}
                                        className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors font-medium"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bulk Delete Modal (Mobile) */}
                {bulkDeleteModalOpen && (
                    <div 
                        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                        onClick={(e) => {
                            // Close on backdrop click
                            if (e.target === e.currentTarget) {
                                setBulkDeleteModalOpen(false);
                            }
                        }}
                    >
                        <div 
                            className="bg-[#1a1a1a] border border-white/10 rounded-xl max-w-md w-full shadow-xl animate-in fade-in zoom-in-95 duration-200 m-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 space-y-4">
                                <div className="flex items-center gap-3 text-red-400">
                                    <div className="p-2 bg-red-500/10 rounded-lg">
                                        <Trash2 className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-semibold">Eliminar ({selectedTransactions.size})</h3>
                                </div>
                                
                                <p className="text-white/70">
                                    ¿Eliminar {selectedTransactions.size} transacciones seleccionadas?
                                </p>

                                <div className="flex gap-3 justify-end pt-2">
                                    <button
                                        onClick={() => setBulkDeleteModalOpen(false)}
                                        className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleConfirmBulkDelete}
                                        className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between p-4 pt-6">
                    <h1 className="text-2xl font-bold">Transacciones</h1>
                    <div className="flex gap-2">
                        {/* Bulk Action Button (Mobile) */}
                        {selectedTransactions.size > 0 ? (
                            <button 
                                onClick={handleBulkDelete}
                                className="p-2 bg-red-500/10 text-red-500 rounded-full border border-red-500/20"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        ) : (
                            <>
                                <button 
                                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                                    className={`p-2 rounded-full transition-colors ${
                                        showMobileFilters 
                                            ? 'bg-teal-500/20 text-teal-400' 
                                            : 'hover:bg-white/10 text-white/70'
                                    }`}
                                >
                                    <Filter className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => setShowMobileSearch(!showMobileSearch)}
                                    className={`p-2 rounded-full transition-colors ${
                                        showMobileSearch 
                                            ? 'bg-teal-500/20 text-teal-400' 
                                            : 'hover:bg-white/10 text-white/70'
                                    }`}
                                >
                                    <Search className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* 🔍 Mobile Search Input */}
                {showMobileSearch && (
                    <div className="px-4 pt-2 animate-in slide-in-from-top-2 duration-200">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar transacciones..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                            />
                        </div>
                    </div>
                )}

                {/* 🔽 Mobile Filters */}
                {showMobileFilters && (
                    <div className="px-4 pt-2 space-y-3 animate-in slide-in-from-top-2 duration-200">
                        {/* Tipo de transacción */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
                            <label className="text-xs text-white/60 font-medium">Tipo de transacción</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => setFilters({ ...filters, type: 'all' })}
                                    className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                                        filters.type === 'all'
                                            ? 'bg-teal-500 text-white'
                                            : 'bg-white/5 text-white/70 hover:bg-white/10'
                                    }`}
                                >
                                    Todas
                                </button>
                                <button
                                    onClick={() => setFilters({ ...filters, type: 'ingreso' })}
                                    className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                                        filters.type === 'ingreso'
                                            ? 'bg-green-500 text-white'
                                            : 'bg-white/5 text-white/70 hover:bg-white/10'
                                    }`}
                                >
                                    Ingresos
                                </button>
                                <button
                                    onClick={() => setFilters({ ...filters, type: 'gasto' })}
                                    className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                                        filters.type === 'gasto'
                                            ? 'bg-red-500 text-white'
                                            : 'bg-white/5 text-white/70 hover:bg-white/10'
                                    }`}
                                >
                                    Gastos
                                </button>
                            </div>
                        </div>

                        {/* Filtro por fecha */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
                            <label className="text-xs text-white/60 font-medium">Filtrar por fecha</label>
                            <input
                                type="date"
                                value={filters.selectedDate || ''}
                                onChange={(e) => {
                                    const date = e.target.value;
                                    setFilters({ ...filters, selectedDate: date || null });
                                    setPage(1); // Reset page when date changes
                                }}
                                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all [color-scheme:dark]"
                            />
                            {filters.selectedDate && (
                                <button
                                    onClick={() => {
                                        setFilters({ ...filters, selectedDate: null });
                                        setPage(1);
                                    }}
                                    className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm transition-colors"
                                >
                                    Limpiar filtro de fecha
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Month Selector */}
                <div className="px-4 pb-2 border-b border-white/10">
                    <div className="flex overflow-x-auto no-scrollbar gap-6 text-sm font-medium text-gray-500">
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
                    {/* Indicador de filtro por día */}
                    {filters.selectedDate && (
                        <div className="mt-2 flex items-center justify-between bg-teal-500/10 border border-teal-500/20 rounded-lg px-3 py-2">
                            <span className="text-xs text-teal-400">
                                📅 Filtrando por: {new Date(filters.selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { 
                                    day: 'numeric', 
                                    month: 'long', 
                                    year: 'numeric' 
                                })}
                            </span>
                            <button
                                onClick={() => {
                                    setFilters({ ...filters, selectedDate: null });
                                    setPage(1);
                                }}
                                className="text-xs text-teal-400 hover:text-teal-300 underline"
                            >
                                Limpiar
                            </button>
                        </div>
                    )}
                </div>

                {/* Summary Card - Multi-Currency (DATOS DEL MES COMPLETO) */}
                {(() => {
                    // ✅ Calcular totales del MES COMPLETO (allMonthTransactions)
                    const monthTotals = {};
                    
                    allMonthTransactions.forEach(t => {
                        const moneda = normalizeCurrency(t.Moneda || t.moneda || 'ARS');
                        const tipo = (t.Tipo || t.tipo || '').toLowerCase();
                        const monto = Math.abs(parseFloat(t.Monto || t.monto || 0));
                        const esCredito = t.es_credito === true;
                        
                        if (!monthTotals[moneda]) {
                            monthTotals[moneda] = { ingresos: 0, gastos: 0, balance: 0 };
                        }
                        
                        if (tipo === 'ingreso') {
                            monthTotals[moneda].ingresos += monto;
                        } else if (tipo === 'gasto' && !esCredito) {
                            // Excluir gastos de crédito (se pagan el próximo mes)
                            monthTotals[moneda].gastos += monto;
                        }
                    });
                    
                    // ✅ Calcular balance: INGRESOS - GASTOS
                    Object.keys(monthTotals).forEach(moneda => {
                        monthTotals[moneda].balance = monthTotals[moneda].ingresos - monthTotals[moneda].gastos;
                    });
                    
                    const activeCurrencies = Object.entries(monthTotals)
                        .filter(([_, totals]) => totals.ingresos > 0 || totals.gastos > 0);
                    
                    if (activeCurrencies.length === 0) return null;
                    
                    return (
                        <div className="mx-4 mt-4 bg-[#162028] rounded-2xl p-3 border border-white/5">
                            {activeCurrencies.map(([moneda, totals]) => (
                                <div key={moneda} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="flex flex-col items-center min-w-[60px]">
                                            <span className="text-red-400 font-bold text-sm flex items-center gap-1">
                                                <ArrowDownLeft className="w-3 h-3" />
                                                {getCurrencySymbol(moneda)}{Math.round(totals.gastos).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-center min-w-[60px]">
                                            <span className="text-green-400 font-bold text-sm flex items-center gap-1">
                                                <ArrowUpRight className="w-3 h-3" />
                                                {getCurrencySymbol(moneda)}{Math.round(totals.ingresos).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 pl-3 border-l border-white/10">
                                        <span className={`font-bold text-sm ${totals.balance >= 0 ? 'text-white' : 'text-red-400'}`}>
                                            = {getCurrencySymbol(moneda)}{Math.round(totals.balance).toLocaleString()}
                                        </span>
                                        <span className="text-xs text-zinc-500">{moneda}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })()}

                {/* Select All Checkbox (Mobile Header) */}
                <div 
                    className="px-6 py-3 flex items-center gap-3 active:bg-white/5 transition-colors cursor-pointer"
                    onClick={handleSelectAll}
                >
                    <input
                        type="checkbox"
                        checked={transactions.length > 0 && selectedTransactions.size === transactions.length}
                        onChange={() => {}} // Handled by parent div
                        className="w-5 h-5 rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-2 focus:ring-blue-500/20 pointer-events-none"
                    />
                    <span className="text-sm text-gray-400 font-medium">Seleccionar todo</span>
                </div>

                {/* Transactions List Grouped */}
                <div className="flex-1 px-4 mt-1 space-y-6">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                    ) : Object.keys(groupedTransactions).length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No hay transacciones en este mes
                        </div>
                    ) : (
                        Object.entries(groupedTransactions).map(([dateLabel, dayTransactions]) => (
                            <div key={dateLabel}>
                                <h3 className="text-gray-500 text-sm mb-3">{dateLabel}</h3>
                                <div className="space-y-4">
                                    {dayTransactions.map(t => {
                                        const isIncome = (t.Tipo || t.tipo) === 'ingreso';
                                        return (
                                            <div 
                                                key={t.id || t.Id} 
                                                className={`relative flex items-center justify-between active:bg-white/5 transition-colors p-3 rounded-xl border border-transparent ${selectedTransactions.has(t.id || t.Id) ? 'bg-blue-500/5 border-blue-500/20' : ''}`}
                                                onClick={() => {
                                                    console.log('✏️ Click edit:', t.id);
                                                    onEdit && onEdit(t);
                                                }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {/* Checkbox Mobile */}
                                                    <div 
                                                        className="p-2 -ml-2 cursor-pointer z-10"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSelectTransaction(t.id || t.Id);
                                                        }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedTransactions.has(t.id || t.Id)}
                                                            onChange={() => {}} // Handled by parent div
                                                            className="w-5 h-5 rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-2 focus:ring-blue-500/20 pointer-events-none"
                                                        />
                                                    </div>

                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                                                        isIncome ? 'bg-green-900/30 text-green-400' : 'bg-blue-900/30 text-blue-400'
                                                    }`}>
                                                        {t.Categorias?.Icono || t.categoria?.icono || (isIncome ? '💰' : '🛒')}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-white text-sm">
                                                            {t.Descripcion || t.descripcion || 'Sin descripción'}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {(t.Categorias?.Nombre || t.Categorias?.nombre || t.categoria?.nombre || 'General')}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-2">
                                                    <div className="flex flex-col items-end">
                                                        <span className={`font-bold text-sm ${isIncome ? 'text-green-400' : 'text-red-400'}`}>
                                                            {isIncome ? '+' : '-'}{getCurrencySymbol(normalizeCurrency(t.Moneda || t.moneda || 'ARS'))} {Math.round(t.Monto || t.monto).toLocaleString()}
                                                        </span>
                                                        {(() => {
                                                            const normalizedCurrency = normalizeCurrency(t.Moneda || t.moneda);
                                                            return normalizedCurrency && normalizedCurrency !== 'ARS' && (
                                                                <span className="text-xs text-zinc-500">
                                                                    {normalizedCurrency}
                                                                </span>
                                                            );
                                                        })()}
                                                    </div>
                                                    
                                                    {/* Ver Comprobante Button Mobile */}
                                                    {(t.ArchivoAdjunto || t.archivo_adjunto || t.comprobante) && (
                                                        <a
                                                            href={t.ArchivoAdjunto || t.archivo_adjunto || t.comprobante}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="p-2 text-blue-400 hover:text-blue-300 active:text-blue-500 transition-colors z-10 bg-blue-500/10 rounded-lg"
                                                            title="Ver comprobante"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </a>
                                                    )}
                                                    
                                                    {/* Delete Button Mobile (Individual) */}
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            console.log('🗑️ Click delete individual:', t.id);
                                                            handleDeleteClick(t, e);
                                                        }}
                                                        className="p-2 text-gray-500 hover:text-red-400 active:text-red-500 transition-colors z-10"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* FAB Button - Mobile */}
                <button
                    onClick={() => onEdit && onEdit()}
                    className="fixed bottom-32 right-6 w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white rounded-2xl shadow-xl shadow-teal-500/30 flex items-center justify-center transition-all active:scale-95 z-50"
                    aria-label="Agregar transacción"
                >
                    <Plus className="w-6 h-6" strokeWidth={2.5} />
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 animate-fadeIn pb-20">
            {/* Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div 
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                    onClick={(e) => {
                        // Close on backdrop click
                        if (e.target === e.currentTarget) {
                            setDeleteModalOpen(false);
                            setTransactionToDelete(null);
                        }
                    }}
                >
                    <div 
                        className="bg-[#1a1a1a] border border-white/10 rounded-xl max-w-md w-full shadow-xl animate-in fade-in zoom-in-95 duration-200 m-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-3 text-red-400">
                                <div className="p-2 bg-red-500/10 rounded-lg">
                                    <Trash2 className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-semibold">Eliminar Transacción</h3>
                            </div>
                            
                            <p className="text-white/70">
                                ¿Estás seguro de que deseas eliminar esta transacción? 
                                <br />
                                <span className="text-white font-medium block mt-2">
                                    {transactionToDelete?.Descripcion || transactionToDelete?.descripcion}
                                </span>
                                <span className="text-sm text-white/50 block mt-1">
                                    Esta acción no se puede deshacer.
                                </span>
                            </p>

                            <div className="flex gap-3 justify-end pt-2">
                                <button
                                    onClick={() => {
                                        setDeleteModalOpen(false);
                                        setTransactionToDelete(null);
                                    }}
                                    className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors font-medium"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                            Historial de Transacciones
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Gestiona y visualiza todos tus movimientos
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    {selectedTransactions.size > 0 && (
                        <button 
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span className="text-sm font-medium">Eliminar ({selectedTransactions.size})</span>
                        </button>
                    )}
                    <button 
                        onClick={handleExport}
                        data-export-button
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Exportar mes completo (todas las transacciones del mes seleccionado)"
                    >
                        <Download className="w-4 h-4" />
                        <span className="text-sm font-medium">Exportar</span>
                    </button>
                    <button 
                        onClick={() => onEdit && onEdit()}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white shadow-lg shadow-teal-500/30 transition-all hover:scale-105"
                    >
                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                        <span className="text-sm font-medium">Agregar</span>
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="glass-panel p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar transacción..."
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-3 w-full md:w-auto overflow-x-auto items-center">
                    <select
                        className="bg-zinc-900/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 cursor-pointer"
                        value={filters.type}
                        onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    >
                        <option value="all" className="bg-zinc-900">Todos los tipos</option>
                        <option value="ingreso" className="bg-zinc-900">Ingresos</option>
                        <option value="gasto" className="bg-zinc-900">Gastos</option>
                    </select>

                    {/* Month Selector */}
                    <div className="flex items-center gap-2 bg-zinc-900/50 border border-white/10 rounded-lg p-1">
                        <button
                            onClick={() => {
                                const [year, month] = filters.selectedMonth.split('-').map(Number);
                                const date = new Date(year, month - 1, 1);
                                date.setMonth(date.getMonth() - 1);
                                const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                                setFilters({ ...filters, selectedMonth: newMonth });
                            }}
                            className="p-1.5 hover:bg-white/10 rounded transition-colors text-white"
                            aria-label="Mes anterior"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <div className="px-3 text-white font-medium text-sm min-w-[120px] text-center">
                            {getMonthName(filters.selectedMonth)} {filters.selectedMonth.split('-')[0]}
                        </div>

                        <button
                            onClick={() => {
                                const [year, month] = filters.selectedMonth.split('-').map(Number);
                                const date = new Date(year, month - 1, 1);
                                date.setMonth(date.getMonth() + 1);
                                const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                                setFilters({ ...filters, selectedMonth: newMonth });
                            }}
                            className="p-1.5 hover:bg-white/10 rounded transition-colors text-white"
                            aria-label="Mes siguiente"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Date Picker */}
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={filters.selectedDate || ''}
                            onChange={(e) => {
                                const date = e.target.value;
                                setFilters({ ...filters, selectedDate: date || null });
                                setPage(1);
                            }}
                            className="bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50 cursor-pointer [color-scheme:dark]"
                            placeholder="Filtrar por día"
                        />
                        {filters.selectedDate && (
                            <button
                                onClick={() => {
                                    setFilters({ ...filters, selectedDate: null });
                                    setPage(1);
                                }}
                                className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 text-sm transition-colors"
                                title="Limpiar filtro de fecha"
                            >
                                Limpiar
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Indicador de filtro por día (Desktop) */}
            {filters.selectedDate && (
                <div className="glass-panel p-3">
                    <div className="flex items-center justify-between bg-teal-500/10 border border-teal-500/20 rounded-lg px-4 py-2">
                        <span className="text-sm text-teal-400 flex items-center gap-2">
                            <span>📅</span>
                            <span>Filtrando por: <strong>{new Date(filters.selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { 
                                day: 'numeric', 
                                month: 'long', 
                                year: 'numeric' 
                            })}</strong></span>
                        </span>
                        <button
                            onClick={() => {
                                setFilters({ ...filters, selectedDate: null });
                                setPage(1);
                            }}
                            className="text-sm text-teal-400 hover:text-teal-300 underline transition-colors"
                        >
                            Limpiar filtro
                        </button>
                    </div>
                </div>
            )}

            {/* Transactions List */}
            <div className="glass-panel overflow-hidden relative">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20">
                    <table className="w-full min-w-[900px]">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="px-4 py-4 text-center w-12">
                                    <input
                                        type="checkbox"
                                        checked={selectedTransactions.size === transactions.length && transactions.length > 0}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                                    />
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/3">Transacción</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-40">Categoría</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">Fecha</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-40">Método</th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">Monto</th>
                                <th className="px-6 py-4 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-32"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-20"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-20 ml-auto"></div></td>
                                        <td className="px-6 py-4"><div className="h-8 bg-white/10 rounded w-8 mx-auto"></div></td>
                                    </tr>
                                ))
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-muted-foreground">
                                        No se encontraron transacciones
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((t) => {
                                    const isIncome = (t.Tipo || t.tipo) === 'ingreso';
                                    const CategoryIcon = isIncome ? ArrowDownLeft : ArrowUpRight;

                                    return (
                                        <tr key={t.id || t.Id} className="group hover:bg-white/5 transition-colors cursor-pointer" onClick={() => onEdit && onEdit(t)}>
                                            <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTransactions.has(t.id || t.Id)}
                                                    onChange={() => handleSelectTransaction(t.id || t.Id)}
                                                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3 max-w-xs">
                                                    <div className={`p-2 rounded-full flex-shrink-0 ${isIncome ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                        <CategoryIcon className="w-4 h-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-white truncate">{t.Descripcion || t.descripcion || 'Sin descripción'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-muted-foreground border border-white/10 max-w-[150px] truncate">
                                                    {(t.Categorias?.Nombre || t.Categorias?.nombre || t.categoria?.nombre || 'Sin categoría')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                {formatDate(t.FechaTransaccion || t.fecha_transaccion)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                <span className="truncate block max-w-[150px]">
                                                {(t.MetodosPago?.Nombre || t.MetodosPago?.nombre || t.metodo_pago?.nombre || 'Efectivo')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex flex-col items-end gap-0.5">
                                                    <span className={`font-bold ${isIncome ? 'text-emerald-500' : 'text-red-500'}`}>
                                                        {isIncome ? '+' : '-'}{getCurrencySymbol(normalizeCurrency(t.Moneda || t.moneda || 'ARS'))} {formatCurrency(t.Monto || t.monto)}
                                                    </span>
                                                    {(() => {
                                                        const normalizedCurrency = normalizeCurrency(t.Moneda || t.moneda);
                                                        return normalizedCurrency && normalizedCurrency !== 'ARS' && (
                                                            <span className="text-xs text-zinc-500">
                                                                {normalizedCurrency}
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex justify-center gap-2">
                                                    {/* Ver Comprobante Button Desktop */}
                                                    {(t.ArchivoAdjunto || t.archivo_adjunto || t.comprobante) && (
                                                        <a
                                                            href={t.ArchivoAdjunto || t.archivo_adjunto || t.comprobante}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="text-blue-400 hover:text-blue-300 transition-colors p-2 hover:bg-blue-500/10 rounded-lg"
                                                            title="Ver comprobante"
                                                        >
                                                            <Eye className="w-5 h-5" />
                                                        </a>
                                                    )}
                                                    
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onEdit && onEdit(t);
                                                        }}
                                                        className="text-muted-foreground hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                                                    >
                                                        <ChevronRight className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDeleteClick(t, e)}
                                                        className="text-muted-foreground hover:text-red-500 transition-colors p-2 hover:bg-white/10 rounded-lg"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 💰 Totales por Moneda */}
                {Object.keys(currencyTotals).length > 0 && (
                    <div className="px-6 py-4 border-t border-white/5 bg-white/5">
                        <h4 className="text-sm font-semibold text-white mb-3">Totales por Moneda</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Object.entries(currencyTotals).map(([moneda, totals]) => (
                                <div key={moneda} className="bg-white/5 border border-white/10 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold text-white">{getCurrencySymbol(moneda)} {moneda}</span>
                                        <span className="text-xs text-zinc-400">{totals.count} tx</span>
                                    </div>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-emerald-400">+ Ingresos:</span>
                                            <span className="text-emerald-400 font-medium">{formatCurrency(totals.ingresos)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-red-400">- Gastos:</span>
                                            <span className="text-red-400 font-medium">{formatCurrency(totals.gastos)}</span>
                                        </div>
                                        <div className="flex justify-between pt-1 border-t border-white/10">
                                            <span className={`font-bold ${totals.balance >= 0 ? 'text-white' : 'text-red-400'}`}>Balance:</span>
                                            <span className={`font-bold ${totals.balance >= 0 ? 'text-white' : 'text-red-400'}`}>
                                                {formatCurrency(Math.abs(totals.balance))}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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

            {/* Bulk Delete Modal */}
            {bulkDeleteModalOpen && (
                <div 
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                    onClick={(e) => {
                        // Close on backdrop click
                        if (e.target === e.currentTarget) {
                            setBulkDeleteModalOpen(false);
                        }
                    }}
                >
                    <div 
                        className="bg-[#1a1a1a] border border-white/10 rounded-xl max-w-md w-full shadow-xl animate-in fade-in zoom-in-95 duration-200 m-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-3 text-red-400">
                                <div className="p-2 bg-red-500/10 rounded-lg">
                                    <Trash2 className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-semibold">Eliminar Múltiples Transacciones</h3>
                            </div>
                            
                            <p className="text-white/70">
                                ¿Estás seguro de que deseas eliminar {selectedTransactions.size} transacciones?
                                <br />
                                <span className="text-sm text-white/50 block mt-2">
                                    Esta acción no se puede deshacer.
                                </span>
                            </p>

                            <div className="flex gap-3 justify-end pt-2">
                                <button
                                    onClick={() => setBulkDeleteModalOpen(false)}
                                    className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirmBulkDelete}
                                    className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransactionsFullView;
