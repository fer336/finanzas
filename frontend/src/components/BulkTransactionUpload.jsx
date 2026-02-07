import React, { useState, useEffect } from 'react';
import { X, Upload, FileSpreadsheet, Plus, Trash2, Download, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import apiServices from '../services/api';

const BulkTransactionUpload = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('csv'); // 'csv' or 'manual'
  const [loading, setLoading] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);
  const [result, setResult] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Manual form rows
  const [manualRows, setManualRows] = useState([
    { id: 1, fecha_transaccion: new Date().toISOString().split('T')[0], tipo: 'gasto', descripcion: '', monto: '', categoria_id: '', metodo_pago_id: '', notas: '' }
  ]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [categoriasRes, metodosRes] = await Promise.all([
        apiServices.categoriasApi.getAll(),
        apiServices.metodosPagoApi.getAll()
      ]);
      setCategorias(categoriasRes.list || []);
      setMetodosPago(metodosRes.list || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // CSV Handlers
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCsvFile(file);
      parseCSV(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      setCsvFile(file);
      parseCSV(file);
    }
  };

  const parseCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      
      const data = lines.slice(1).map((line, index) => {
        const values = line.split(',');
        const obj = { _rowNumber: index + 2 };
        headers.forEach((header, i) => {
          obj[header] = values[i] ? values[i].trim() : '';
        });
        return obj;
      });

      setCsvData(data);
      setPreviewData(data.slice(0, 10));
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    apiServices.transaccionesApi.downloadCsvTemplate();
  };

  const handleImportCSV = async () => {
    if (csvData.length === 0) {
      alert('No hay datos para importar');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const transactions = csvData.map(row => {
        // Helper to convert empty strings to null
        const toNullIfEmpty = (val) => (val && val.trim() !== '') ? val.trim() : null;
        
        return {
          fecha_transaccion: row.fecha_transaccion || new Date().toISOString().split('T')[0],
          tipo: row.tipo?.toLowerCase() || 'gasto',
          descripcion: row.descripcion || 'Sin descripción',
          monto: parseFloat(row.monto) || 0,
          moneda: row.moneda || 'ARS',
          monto_ars: parseFloat(row.monto) || 0,
          tasa_cambio: 1,
          categoria_id: toNullIfEmpty(row.categoria_id),
          metodo_pago_id: toNullIfEmpty(row.metodo_pago_id),
          notas: row.notas || '',
          archivo_adjunto: ''
        };
      });

      const response = await apiServices.transaccionesApi.bulkCreate(transactions);
      
      // Transform backend response to match frontend expectations
      const transformedResult = {
        success: Array(response.created_count || 0).fill({}),
        failed: response.errors || [],
        created_count: response.created_count || 0,
        failed_count: response.failed_count || 0,
        errors: response.errors || []
      };
      
      setResult(transformedResult);

      if (transformedResult.created_count > 0) {
        setCsvFile(null);
        setCsvData([]);
        setPreviewData([]);
        
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      setResult({ success: [], failed: csvData.map((_, i) => ({ index: i, reason: error.message })) });
    } finally {
      setLoading(false);
    }
  };

  // Manual form handlers
  const addRow = () => {
    setManualRows([...manualRows, {
      id: Date.now(),
      fecha_transaccion: new Date().toISOString().split('T')[0],
      tipo: 'gasto',
      descripcion: '',
      monto: '',
      categoria_id: '',
      metodo_pago_id: '',
      notas: ''
    }]);
  };

  const removeRow = (id) => {
    setManualRows(manualRows.filter(row => row.id !== id));
  };

  const updateRow = (id, field, value) => {
    setManualRows(manualRows.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const handleSaveManual = async () => {
    const validRows = manualRows.filter(row => row.descripcion.trim() && row.monto);
    
    if (validRows.length === 0) {
      alert('Por favor completa al menos una transacción con descripción y monto');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const transactions = validRows.map(row => ({
        fecha_transaccion: row.fecha_transaccion,
        tipo: row.tipo,
        descripcion: row.descripcion,
        monto: Math.abs(parseFloat(row.monto)), // ✅ El backend maneja el signo según el tipo
        moneda: 'ARS',
        monto_ars: Math.abs(parseFloat(row.monto)), // ✅ El backend maneja el signo según el tipo
        tasa_cambio: 1,
        categoria_id: row.categoria_id || null,
        metodo_pago_id: row.metodo_pago_id || null,
        notas: row.notas || '',
        archivo_adjunto: ''
      }));

      const response = await apiServices.transaccionesApi.bulkCreate(transactions);
      
      // Transform backend response to match frontend expectations
      const transformedResult = {
        success: Array(response.created_count || 0).fill({}),
        failed: response.errors || [],
        created_count: response.created_count || 0,
        failed_count: response.failed_count || 0,
        errors: response.errors || []
      };
      
      setResult(transformedResult);

      if (transformedResult.created_count > 0) {
        setManualRows([{ 
          id: Date.now(), 
          fecha_transaccion: new Date().toISOString().split('T')[0], 
          tipo: 'gasto', 
          descripcion: '', 
          monto: '', 
          categoria_id: '', 
          metodo_pago_id: '', 
          notas: '' 
        }]);
        
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Error saving transactions:', error);
      setResult({ success: [], failed: validRows.map((_, i) => ({ index: i, reason: error.message })) });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[1000] flex items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-6xl bg-[#09090b] rounded-xl sm:rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-white/5 bg-[#09090b]">
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-xl font-bold text-white tracking-tight truncate">
              {isMobile ? 'Carga Masiva' : 'Carga Masiva de Transacciones'}
            </h2>
            {!isMobile && (
              <p className="text-zinc-400 mt-0.5 text-xs sm:text-sm">Importa desde CSV o agrega múltiples transacciones manualmente</p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors group flex-shrink-0"
          >
            <X className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 px-2 sm:px-6 bg-zinc-900/30">
          <button
            onClick={() => setActiveTab('csv')}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all relative ${
              activeTab === 'csv'
                ? 'text-blue-400 border-b-2 border-blue-500'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet size={isMobile ? 14 : 16} />
            {isMobile ? 'CSV' : 'Importar CSV'}
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all relative ${
              activeTab === 'manual'
                ? 'text-blue-400 border-b-2 border-blue-500'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Plus size={isMobile ? 14 : 16} />
            {isMobile ? 'Manual' : 'Formulario Manual'}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          {activeTab === 'csv' ? (
            <div className="space-y-4 sm:space-y-6">
              {/* Download Template */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Download className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-white">Descargar Plantilla CSV</p>
                    {!isMobile && <p className="text-xs text-zinc-400 mt-0.5">Usa esta plantilla para preparar tus datos</p>}
                  </div>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors"
                >
                  Descargar
                </button>
              </div>

              {/* Upload Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-zinc-700 hover:border-blue-500/50 rounded-lg p-6 sm:p-12 text-center transition-all cursor-pointer bg-zinc-900/30 hover:bg-zinc-900/50"
                onClick={() => document.getElementById('csv-upload').click()}
              >
                <Upload className="w-8 h-8 sm:w-12 sm:h-12 text-zinc-600 mx-auto mb-3 sm:mb-4" />
                <p className="text-white font-medium mb-1 text-sm sm:text-base">
                  {isMobile ? 'Seleccionar archivo CSV' : 'Click para seleccionar o arrastra el archivo aquí'}
                </p>
                <p className="text-xs sm:text-sm text-zinc-500">Formato: CSV (máximo 1000 transacciones)</p>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Preview */}
              {previewData.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs sm:text-sm font-bold text-white">Vista Previa ({csvData.length} transacciones)</h3>
                    <button
                      onClick={() => {
                        setCsvFile(null);
                        setCsvData([]);
                        setPreviewData([]);
                      }}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Limpiar
                    </button>
                  </div>

                  {/* Mobile: Card View */}
                  {isMobile ? (
                    <div className="space-y-2">
                      {previewData.map((row, index) => (
                        <div key={index} className="p-3 bg-zinc-900/50 border border-white/10 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              row.tipo === 'ingreso' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                            }`}>
                              {row.tipo}
                            </span>
                            <span className="text-xs text-zinc-500">{row.fecha_transaccion}</span>
                          </div>
                          <p className="text-sm text-white font-medium">{row.descripcion}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-zinc-400">{row.notas || 'Sin notas'}</span>
                            <span className="text-sm font-mono text-white font-bold">${row.monto}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Desktop: Table View */
                    <div className="overflow-x-auto border border-white/10 rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-zinc-900/50 border-b border-white/5">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400">Fecha</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400">Tipo</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400">Descripción</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-zinc-400">Monto</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400">Notas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {previewData.map((row, index) => (
                            <tr key={index} className="hover:bg-white/5">
                              <td className="px-3 py-2 text-xs text-white">{row.fecha_transaccion}</td>
                              <td className="px-3 py-2 text-xs">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  row.tipo === 'ingreso' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                }`}>
                                  {row.tipo}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-xs text-white">{row.descripcion}</td>
                              <td className="px-3 py-2 text-xs text-right font-mono text-white">${row.monto}</td>
                              <td className="px-3 py-2 text-xs text-zinc-400 truncate max-w-xs">{row.notas}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {csvData.length > 10 && (
                    <p className="text-xs text-zinc-500 text-center">Mostrando 10 de {csvData.length} transacciones</p>
                  )}
                </div>
              )}

              {/* Import Button */}
              {csvData.length > 0 && !result && (
                <button
                  onClick={handleImportCSV}
                  disabled={loading}
                  className="w-full px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload size={20} />
                      Importar {csvData.length} Transacciones
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Manual Form - Mobile: Card View */}
              {isMobile ? (
                <div className="space-y-3">
                  {manualRows.map((row, index) => (
                    <div key={row.id} className="p-3 bg-zinc-900/50 border border-white/10 rounded-lg space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-zinc-400">Transacción #{index + 1}</span>
                        <button
                          onClick={() => removeRow(row.id)}
                          disabled={manualRows.length === 1}
                          className="p-1.5 hover:bg-red-500/10 text-red-400 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="col-span-2">
                          <label className="text-xs text-zinc-400 mb-1 block">Descripción *</label>
                          <input
                            type="text"
                            value={row.descripcion}
                            onChange={(e) => updateRow(row.id, 'descripcion', e.target.value)}
                            placeholder="Ej: Supermercado"
                            className="w-full p-2.5 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-zinc-400 mb-1 block">Tipo</label>
                          <select
                            value={row.tipo}
                            onChange={(e) => updateRow(row.id, 'tipo', e.target.value)}
                            className="w-full p-2.5 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white focus:border-blue-500 focus:outline-none"
                          >
                            <option value="gasto">Gasto</option>
                            <option value="ingreso">Ingreso</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs text-zinc-400 mb-1 block">Monto *</label>
                          <input
                            type="number"
                            value={row.monto}
                            onChange={(e) => updateRow(row.id, 'monto', e.target.value)}
                            placeholder="0.00"
                            className="w-full p-2.5 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-right text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
                            step="0.01"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="text-xs text-zinc-400 mb-1 block">Fecha</label>
                          <input
                            type="date"
                            value={row.fecha_transaccion}
                            onChange={(e) => updateRow(row.id, 'fecha_transaccion', e.target.value)}
                            className="w-full p-2.5 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white focus:border-blue-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-zinc-400 mb-1 block">Categoría</label>
                          <select
                            value={row.categoria_id}
                            onChange={(e) => updateRow(row.id, 'categoria_id', e.target.value)}
                            className="w-full p-2.5 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white focus:border-blue-500 focus:outline-none"
                          >
                            <option value="">Sin categoría</option>
                            {categorias.map(c => (
                              <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs text-zinc-400 mb-1 block">Método</label>
                          <select
                            value={row.metodo_pago_id}
                            onChange={(e) => updateRow(row.id, 'metodo_pago_id', e.target.value)}
                            className="w-full p-2.5 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white focus:border-blue-500 focus:outline-none"
                          >
                            <option value="">Sin método</option>
                            {metodosPago.map(m => (
                              <option key={m.id} value={m.id}>{m.nombre}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Desktop: Table View */
                <div className="overflow-x-auto border border-white/10 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-900/50 border-b border-white/5">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-medium text-zinc-400 w-28">Fecha</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-zinc-400 w-24">Tipo</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-zinc-400">Descripción</th>
                        <th className="px-2 py-2 text-right text-xs font-medium text-zinc-400 w-28">Monto</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-zinc-400 w-32">Categoría</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-zinc-400 w-32">Método</th>
                        <th className="px-2 py-2 text-center text-xs font-medium text-zinc-400 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {manualRows.map((row) => (
                        <tr key={row.id} className="hover:bg-white/5">
                          <td className="px-2 py-2">
                            <input
                              type="date"
                              value={row.fecha_transaccion}
                              onChange={(e) => updateRow(row.id, 'fecha_transaccion', e.target.value)}
                              className="w-full p-1.5 bg-zinc-900/50 border border-white/10 rounded text-xs text-white focus:border-blue-500 focus:outline-none"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={row.tipo}
                              onChange={(e) => updateRow(row.id, 'tipo', e.target.value)}
                              className="w-full p-1.5 bg-zinc-900/50 border border-white/10 rounded text-xs text-white focus:border-blue-500 focus:outline-none"
                            >
                              <option value="ingreso">Ingreso</option>
                              <option value="gasto">Gasto</option>
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={row.descripcion}
                              onChange={(e) => updateRow(row.id, 'descripcion', e.target.value)}
                              placeholder="Descripción"
                              className="w-full p-1.5 bg-zinc-900/50 border border-white/10 rounded text-xs text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              value={row.monto}
                              onChange={(e) => updateRow(row.id, 'monto', e.target.value)}
                              placeholder="0.00"
                              className="w-full p-1.5 bg-zinc-900/50 border border-white/10 rounded text-xs text-right text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
                              step="0.01"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={row.categoria_id}
                              onChange={(e) => updateRow(row.id, 'categoria_id', e.target.value)}
                              className="w-full p-1.5 bg-zinc-900/50 border border-white/10 rounded text-xs text-white focus:border-blue-500 focus:outline-none"
                            >
                              <option value="">Sin categoría</option>
                              {categorias.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={row.metodo_pago_id}
                              onChange={(e) => updateRow(row.id, 'metodo_pago_id', e.target.value)}
                              className="w-full p-1.5 bg-zinc-900/50 border border-white/10 rounded text-xs text-white focus:border-blue-500 focus:outline-none"
                            >
                              <option value="">Sin método</option>
                              {metodosPago.map(m => (
                                <option key={m.id} value={m.id}>{m.nombre}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <button
                              onClick={() => removeRow(row.id)}
                              disabled={manualRows.length === 1}
                              className="p-1 hover:bg-red-500/10 text-red-400 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Add Row Button */}
              <button
                onClick={addRow}
                className="w-full px-4 py-3 border-2 border-dashed border-zinc-700 hover:border-blue-500/50 text-zinc-400 hover:text-white rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Plus size={18} />
                Agregar Fila
              </button>

              {/* Save Button */}
              {!result && (
                <button
                  onClick={handleSaveManual}
                  disabled={loading}
                  className="w-full px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      Guardar {manualRows.filter(r => r.descripcion && r.monto).length} Transacciones
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Result Summary */}
          {result && (
            <div className={`mt-6 p-4 sm:p-6 rounded-lg border-2 ${
              (result.created_count || 0) > 0
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex items-start gap-3 sm:gap-4">
                {(result.created_count || 0) > 0 ? (
                  <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-400 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-2">
                    {(result.created_count || 0) > 0 ? '✅ Importación Exitosa' : '❌ Error en Importación'}
                  </h3>
                  <div className="space-y-1 text-xs sm:text-sm">
                    <p className="text-zinc-300">
                      <span className="font-bold text-green-400">{result.created_count || 0}</span> transacciones creadas
                    </p>
                    {result.failed_count > 0 && (
                      <p className="text-zinc-300">
                        <span className="font-bold text-red-400">{result.failed_count}</span> fallidas
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setResult(null);
                      if ((result.success?.length || 0) > 0) {
                        onClose();
                      }
                    }}
                    className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkTransactionUpload;
