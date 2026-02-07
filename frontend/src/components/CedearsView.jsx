import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, 
  TrendingUp,
  TrendingDown,
  BarChart3,
  X,
  Activity,
  ChevronDown,
  Wifi,
  WifiOff,
  ArrowLeft
} from 'lucide-react';
import yfinanceService from '../services/yfinanceService';
import useWebSocket from '../hooks/useWebSocket';
import CedearDetailModal from './CedearDetailModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function CedearsView({ onBack }) { // Added onBack prop support
  const [cedears, setCedears] = useState([]);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sectores, setSectores] = useState([]);
  const [useWebSocketMode] = useState(false);
  const itemsPerPage = 20;
  const [selectedCedear, setSelectedCedear] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadedCount, setLoadedCount] = useState(25);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // ... (WebSocket and Data Loading logic kept same, simplified for brevity in this rewrite but logically identical)
  const handleWebSocketMessage = useCallback((data) => {
    if (data.type === 'connected') {
      console.log('✅ Conectado al stream de CEDEARs:', data.tickers);
    } else if (data.type === 'cedear_update') {
      setCedears((prev) => {
        const index = prev.findIndex((c) => c.ticker === data.ticker);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...data, last_update: data.timestamp };
          return updated;
        } else {
          return [...prev, { ...data, last_update: data.timestamp }];
        }
      });
    }
  }, []);

  const WS_URL = useWebSocketMode ? `ws://127.0.0.1:8000/api/yfinance/cedears/stream` : null;
  const { isConnected: wsConnected } = useWebSocket(WS_URL, handleWebSocketMessage, {
      reconnectInterval: 5000, reconnectAttempts: 3,
      onOpen: () => console.log('🔌 WebSocket conectado'),
      onClose: () => console.log('🔌 WebSocket desconectado'),
      onError: (err) => console.error('❌ Error en WebSocket:', err)
  });

  const loadCacheFromLocalStorage = useCallback(() => {
    try {
      const cached = localStorage.getItem('cedears_cache');
      if (cached) {
        const { cedears: cachedCedears, timestamp } = JSON.parse(cached);
        if ((Date.now() - timestamp) < 5 * 60 * 1000 && Array.isArray(cachedCedears)) return cachedCedears;
      }
    } catch (err) { console.warn('⚠️ Cache load error:', err); }
    return null;
  }, []);

  const saveCacheToLocalStorage = useCallback((data) => {
    try {
      localStorage.setItem('cedears_cache', JSON.stringify({ cedears: data, timestamp: Date.now() }));
    } catch (err) { console.warn('⚠️ Cache error:', err); }
  }, []);

  const loadCedears = useCallback(async (sector = null, search = null) => {
    try {
      setLoading(true);
      setError(null);
      const [cedearsData, sectoresData] = await Promise.all([
        yfinanceService.getAllCedears(25, sector !== 'all' ? sector : null, search),
        yfinanceService.getSectores()
      ]);
      
      if (Array.isArray(cedearsData) && cedearsData.length > 0) {
        setCedears(cedearsData);
        setSectores(sectoresData);
        setCurrentPage(1);
        setLoadedCount(25);
        if (!search && sector === 'all') { // Only cache full list without filters
            saveCacheToLocalStorage(cedearsData);
        }
      } else {
        if (search) {
             setCedears([]); // Empty results for search
        } else {
             setError('No se pudieron cargar los CEDEARs.');
        }
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [saveCacheToLocalStorage]);

  const loadInitialData = useCallback(async () => {
     try {
       setLoading(true);
       const cached = loadCacheFromLocalStorage();
       if (cached) {
         setCedears(cached);
         setLoadedCount(cached.length);
         setSectores([...new Set(cached.map(c => c.sector).filter(Boolean))]);
         setLoading(false);
         return;
       }
       // Fallback
       loadCedears();
     } catch(e) { console.error(e); }
  }, [loadCacheFromLocalStorage, loadCedears]);

  useEffect(() => {
    if (useWebSocketMode) loadInitialData();
    else loadCedears();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useWebSocketMode]);

  const loadMoreCedears = async () => {
    try {
      setIsLoadingMore(true);
      const nextCount = loadedCount + 25;
      const cedearsData = await yfinanceService.getAllCedears(nextCount, filterSector !== 'all' ? filterSector : null);
      if (Array.isArray(cedearsData) && cedearsData.length > 0) {
        setCedears(cedearsData);
        setLoadedCount(nextCount);
        saveCacheToLocalStorage(cedearsData);
      }
    } catch (err) { setError(`Error: ${err.message}`); } finally { setIsLoadingMore(false); }
  };

  const refreshCedears = async () => {
    try {
      localStorage.removeItem('cedears_cache');
      setLoadedCount(25);
      loadCedears();
    } catch (err) { console.error(err); }
  };

  // Debounced search effect
  useEffect(() => {
      const delaySearch = setTimeout(() => {
          if (searchTerm) {
              loadCedears(filterSector, searchTerm);
          } else if (!loading && cedears.length === 0) {
              loadCedears(filterSector); // Load initial if search cleared
          } else if (searchTerm === '' && cedears.length < 25) {
              // Reload full list if search was cleared and we have partial results
              loadCedears(filterSector); 
          }
      }, 500); // 500ms debounce

      return () => clearTimeout(delaySearch);
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterSector]);

  // Remove client-side filtering since backend handles it now
  const filteredCedears = cedears;

  // Pagination logic remains (frontend pagination of backend results batch)
  const totalPages = Math.ceil(filteredCedears.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCedears = filteredCedears.slice(startIndex, startIndex + itemsPerPage);

  const formatCurrency = (amount) => `$${parseFloat(amount).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (loading && cedears.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent"></div>
              <p className="text-white font-medium">Cargando CEDEARs...</p>
          </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white pb-32 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4 pt-8 md:p-8 mb-8">
        <div className="flex items-center gap-4">
            {onBack && (
                <button onClick={onBack} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                    <ArrowLeft className="w-6 h-6" />
                </button>
            )}
            <div>
                <h1 className="text-3xl font-bold md:text-4xl tracking-tight">CEDEARs</h1>
                <div className="flex items-center gap-2 mt-2">
                    <p className="text-white/40 text-sm font-medium uppercase tracking-wide">Mercado Argentino</p>
                    {useWebSocketMode && (
                        <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${wsConnected ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                            {wsConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
                            {wsConnected ? 'LIVE' : 'OFF'}
                        </span>
                    )}
                </div>
            </div>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
            <button
                onClick={refreshCedears}
                disabled={loading}
                className="flex-1 md:flex-none px-6 py-3 bg-[#161616] hover:bg-white/5 border border-white/10 text-white rounded-xl font-bold text-xs uppercase transition-colors flex items-center justify-center gap-2"
            >
                <Activity size={16} />
                Actualizar
            </button>
             <button
                onClick={loadMoreCedears}
                disabled={loading || isLoadingMore || cedears.length >= 300}
                className="flex-1 md:flex-none px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold text-xs uppercase transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/20"
            >
                <BarChart3 size={16} />
                {isLoadingMore ? 'Cargando...' : 'Cargar Más'}
            </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 px-4 md:px-8 mb-8">
        <div className="bg-[#161616] border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-2">Total</span>
            <span className="text-2xl font-bold text-white">{cedears.length}</span>
        </div>
        <div className="bg-[#161616] border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-2">Sectores</span>
            <span className="text-2xl font-bold text-cyan-400">{sectores.length}</span>
        </div>
         <div className="bg-[#161616] border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-2">Filtrados</span>
            <span className="text-2xl font-bold text-purple-400">{filteredCedears.length}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 md:px-8 flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input 
                type="text" 
                placeholder="Buscar ticker..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#161616] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-base text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 transition-all"
            />
            {searchTerm && (
                <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                    <X size={14} className="text-white" />
                </button>
            )}
        </div>
        
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="px-6 py-4 bg-[#161616] border border-white/10 rounded-2xl text-white text-base font-medium flex items-center justify-between gap-3 min-w-[200px]">
                    <span className="truncate max-w-[150px]">{filterSector === 'all' ? 'Todos los sectores' : filterSector}</span>
                    <ChevronDown size={16} className="text-white/50" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#161616] border border-white/10 text-white max-h-[300px] overflow-y-auto">
                <DropdownMenuItem onClick={() => { setFilterSector('all'); loadCedears('all'); }} className="focus:bg-white/10 cursor-pointer">
                    Todos los sectores
                </DropdownMenuItem>
                {sectores.map(sector => (
                    <DropdownMenuItem key={sector} onClick={() => { setFilterSector(sector); loadCedears(sector); }} className="focus:bg-white/10 cursor-pointer">
                        {sector}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Grid */}
      <div className="px-4 md:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginatedCedears.map((cedear) => {
             const isPositive = parseFloat(cedear.cambio_porcentual || 0) >= 0;
             return (
                <div 
                    key={cedear.ticker}
                    onClick={() => { setSelectedCedear(cedear); setIsModalOpen(true); }}
                    className="bg-[#161616] border border-white/5 rounded-3xl p-5 relative overflow-hidden group hover:bg-[#1a1a1a] transition-all cursor-pointer active:scale-[0.98]"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-white tracking-tight">{cedear.ticker}</h3>
                            <p className="text-xs text-white/40 font-medium uppercase truncate max-w-[140px]">{cedear.nombre}</p>
                        </div>
                        <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-1 ${isPositive ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            <span className="text-xs font-bold">{Math.abs(cedear.cambio_porcentual || 0).toFixed(2)}%</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 mb-4">
                         <span className="text-2xl font-bold text-white tracking-tight">{formatCurrency(cedear.precio_ars || 0)}</span>
                         <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Precio en Pesos</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold text-white/50 uppercase">
                            {cedear.mercado || 'BYMA'}
                        </span>
                        {cedear.sector && (
                             <span className="px-2 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase truncate">
                                {cedear.sector}
                             </span>
                        )}
                    </div>
                </div>
             );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8 px-4">
            <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-colors border border-white/5 text-white"
            >
                Anterior
            </button>
            <span className="text-sm font-medium text-white/60">
                Página <span className="text-white">{currentPage}</span> de {totalPages}
            </span>
            <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-colors border border-white/5 text-white"
            >
                Siguiente
            </button>
        </div>
      )}

      {/* Modal - Rendered via Portal to escape container constraints */}
      {isModalOpen && createPortal(
        <CedearDetailModal
          cedear={selectedCedear}
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setSelectedCedear(null); }}
        />,
        document.body
      )}
    </div>
  );
}

export default CedearsView;
