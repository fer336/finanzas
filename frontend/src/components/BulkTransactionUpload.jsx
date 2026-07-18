import React, { useState, useEffect } from 'react';
import { X, Upload, FileSpreadsheet, Plus, Trash2, Download, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import apiServices from '../services/api';

// Parser de línea CSV que respeta campos entre comillas (soporta comas
// dentro de una descripción, ej: "Compra, supermercado").
const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
};

const BulkTransactionUpload = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('csv'); // 'csv' or 'manual'
  const [loading, setLoading] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [dragActive, setDragActive] = useState(false);
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

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
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
      const headers = parseCSVLine(lines[0]).map(h => h.trim());

      const data = lines.slice(1).map((line, index) => {
        const values = parseCSVLine(line);
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

  const tipoBadgeClass = (tipo) =>
    tipo === 'ingreso'
      ? 'border border-[#526a3a] text-[#526a3a]'
      : 'border border-[#c8bf91] text-[#b83245]';

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-4"
      style={{ background: 'rgba(32,36,44,.4)' }}
    >
      <div className="relative flex w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-[#c8bf91] bg-[#e5ddb0] max-h-[95vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#c8bf91] bg-[#e5ddb0] px-3 py-3 sm:px-6 sm:py-4">
          <div className="flex-1 min-w-0">
            <h2 className="truncate font-serif text-[17px] font-bold text-foreground sm:text-[20px]">
              {isMobile ? 'Carga Masiva' : 'Carga Masiva de Transacciones'}
            </h2>
            {!isMobile && (
              <p className="mt-0.5 text-[12.5px] text-[#625f55]">Importa desde CSV o agregá múltiples transacciones manualmente</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-sm p-2 text-[#625f55] transition-colors hover:bg-black/5 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#c8bf91] bg-[#f6f1e4] px-2 sm:px-6">
          <button
            onClick={() => setActiveTab('csv')}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-[12.5px] sm:text-[13.5px] font-medium transition-colors ${
              activeTab === 'csv'
                ? 'border-b-2 border-primary text-primary'
                : 'text-[#625f55] hover:text-foreground'
            }`}
          >
            <FileSpreadsheet size={isMobile ? 14 : 16} />
            {isMobile ? 'CSV' : 'Importar CSV'}
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-[12.5px] sm:text-[13.5px] font-medium transition-colors ${
              activeTab === 'manual'
                ? 'border-b-2 border-primary text-primary'
                : 'text-[#625f55] hover:text-foreground'
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
              <div className="flex flex-col items-start justify-between gap-3 rounded-md border border-[#c8bf91] bg-[#4d699b]/5 p-3 sm:flex-row sm:items-center sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Download className="h-4 w-4 flex-shrink-0 text-[#4d699b] sm:h-5 sm:w-5" />
                  <div>
                    <p className="text-[12.5px] font-medium text-foreground sm:text-[13.5px]">Descargar plantilla CSV</p>
                    {!isMobile && <p className="mt-0.5 text-[11.5px] text-[#625f55]">Usá esta plantilla para preparar tus datos</p>}
                  </div>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="w-full rounded-sm bg-primary px-4 py-2 text-[12.5px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-[#5f7841] sm:w-auto sm:text-[13px]"
                >
                  Descargar
                </button>
              </div>

              {/* Upload Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => document.getElementById('csv-upload').click()}
                className={`cursor-pointer rounded-md border-2 border-dashed p-6 text-center transition-colors sm:p-12 ${
                  dragActive
                    ? 'border-primary bg-[#e4d794]'
                    : 'border-[#c8bf91] bg-white hover:border-[#625f55] hover:bg-[#e4d794]/50'
                }`}
              >
                <Upload className="mx-auto mb-3 h-8 w-8 text-[#625f55] sm:mb-4 sm:h-12 sm:w-12" />
                <p className="mb-1 text-[13px] font-medium text-foreground sm:text-[15px]">
                  {isMobile ? 'Seleccionar archivo CSV' : dragActive ? 'Soltá el archivo aquí' : 'Click para seleccionar o arrastrá el archivo aquí'}
                </p>
                <p className="text-[11.5px] text-[#625f55] sm:text-[12.5px]">Formato: CSV (máximo 1000 transacciones)</p>
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
                    <h3 className="text-[12.5px] font-semibold text-foreground sm:text-[13.5px]">Vista previa ({csvData.length} transacciones)</h3>
                    <button
                      onClick={() => {
                        setCsvFile(null);
                        setCsvData([]);
                        setPreviewData([]);
                      }}
                      className="text-[11.5px] text-[#b83245] hover:text-[#8a3a29]"
                    >
                      Limpiar
                    </button>
                  </div>

                  {/* Mobile: Card View */}
                  {isMobile ? (
                    <div className="space-y-2">
                      {previewData.map((row, index) => (
                        <div key={index} className="space-y-2 rounded-md border border-[#c8bf91] bg-card p-3">
                          <div className="flex items-center justify-between">
                            <span className={`rounded-full px-2 py-0.5 font-mono text-[10.5px] uppercase ${tipoBadgeClass(row.tipo)}`}>
                              {row.tipo}
                            </span>
                            <span className="text-[11px] text-[#625f55]">{row.fecha_transaccion}</span>
                          </div>
                          <p className="text-[13.5px] font-medium text-foreground">{row.descripcion}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-[11.5px] text-[#625f55]">{row.notas || 'Sin notas'}</span>
                            <span className="font-mono text-[13.5px] font-semibold text-foreground">${row.monto}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Desktop: Table View */
                    <div className="overflow-hidden overflow-x-auto rounded-md border border-[#c8bf91] bg-card">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-[#c8bf91]">
                            <th className="px-3 py-2.5 text-left font-mono text-[10.5px] uppercase tracking-[.08em] text-[#625f55]">Fecha</th>
                            <th className="px-3 py-2.5 text-left font-mono text-[10.5px] uppercase tracking-[.08em] text-[#625f55]">Tipo</th>
                            <th className="px-3 py-2.5 text-left font-mono text-[10.5px] uppercase tracking-[.08em] text-[#625f55]">Descripción</th>
                            <th className="px-3 py-2.5 text-right font-mono text-[10.5px] uppercase tracking-[.08em] text-[#625f55]">Monto</th>
                            <th className="px-3 py-2.5 text-left font-mono text-[10.5px] uppercase tracking-[.08em] text-[#625f55]">Notas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.map((row, index) => (
                            <tr key={index} className="border-b border-[#d5cea3] transition-colors hover:bg-[#e4d794]">
                              <td className="px-3 py-2 font-mono text-[12px] text-[#43436c]">{row.fecha_transaccion}</td>
                              <td className="px-3 py-2">
                                <span className={`rounded-full px-2 py-0.5 font-mono text-[10.5px] uppercase ${tipoBadgeClass(row.tipo)}`}>
                                  {row.tipo}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-[12.5px] text-foreground">{row.descripcion}</td>
                              <td className="px-3 py-2 text-right font-mono text-[12.5px] text-foreground">${row.monto}</td>
                              <td className="max-w-xs truncate px-3 py-2 text-[12px] text-[#625f55]">{row.notas}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {csvData.length > 10 && (
                    <p className="text-center text-[11.5px] text-[#625f55]">Mostrando 10 de {csvData.length} transacciones</p>
                  )}
                </div>
              )}

              {/* Import Button */}
              {csvData.length > 0 && !result && (
                <button
                  onClick={handleImportCSV}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-sm bg-primary px-4 py-3 text-[13.5px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-[#5f7841] disabled:opacity-50 sm:px-6"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Importando…
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Importar {csvData.length} transacciones
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
                    <div key={row.id} className="space-y-3 rounded-md border border-[#c8bf91] bg-card p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[11.5px] font-semibold text-[#625f55]">Transacción #{index + 1}</span>
                        <button
                          onClick={() => removeRow(row.id)}
                          disabled={manualRows.length === 1}
                          className="rounded-sm p-1.5 text-[#b83245] hover:bg-[#b83245]/10 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="col-span-2">
                          <label className="mb-1 block text-[11.5px] text-[#43436c]">Descripción *</label>
                          <input
                            type="text"
                            value={row.descripcion}
                            onChange={(e) => updateRow(row.id, 'descripcion', e.target.value)}
                            placeholder="Ej: Supermercado"
                            className="w-full rounded-sm border border-[#c8bf91] bg-white p-2.5 text-[13px] text-foreground placeholder:text-[#625f55] focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-[11.5px] text-[#43436c]">Tipo</label>
                          <select
                            value={row.tipo}
                            onChange={(e) => updateRow(row.id, 'tipo', e.target.value)}
                            className="w-full rounded-sm border border-[#c8bf91] bg-white p-2.5 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <option value="gasto">Gasto</option>
                            <option value="ingreso">Ingreso</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-[11.5px] text-[#43436c]">Monto *</label>
                          <input
                            type="number"
                            value={row.monto}
                            onChange={(e) => updateRow(row.id, 'monto', e.target.value)}
                            placeholder="0.00"
                            className="w-full rounded-sm border border-[#c8bf91] bg-white p-2.5 text-right font-mono text-[13px] text-foreground placeholder:text-[#625f55] focus:outline-none focus:ring-2 focus:ring-ring"
                            step="0.01"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="mb-1 block text-[11.5px] text-[#43436c]">Fecha</label>
                          <input
                            type="date"
                            value={row.fecha_transaccion}
                            onChange={(e) => updateRow(row.id, 'fecha_transaccion', e.target.value)}
                            className="w-full rounded-sm border border-[#c8bf91] bg-white p-2.5 font-mono text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-[11.5px] text-[#43436c]">Categoría</label>
                          <select
                            value={row.categoria_id}
                            onChange={(e) => updateRow(row.id, 'categoria_id', e.target.value)}
                            className="w-full rounded-sm border border-[#c8bf91] bg-white p-2.5 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <option value="">Sin categoría</option>
                            {categorias.map(c => (
                              <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-[11.5px] text-[#43436c]">Método</label>
                          <select
                            value={row.metodo_pago_id}
                            onChange={(e) => updateRow(row.id, 'metodo_pago_id', e.target.value)}
                            className="w-full rounded-sm border border-[#c8bf91] bg-white p-2.5 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
                <div className="overflow-hidden overflow-x-auto rounded-md border border-[#c8bf91] bg-card">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-[#c8bf91]">
                        <th className="w-28 px-2 py-2.5 text-left font-mono text-[10.5px] uppercase tracking-[.08em] text-[#625f55]">Fecha</th>
                        <th className="w-24 px-2 py-2.5 text-left font-mono text-[10.5px] uppercase tracking-[.08em] text-[#625f55]">Tipo</th>
                        <th className="px-2 py-2.5 text-left font-mono text-[10.5px] uppercase tracking-[.08em] text-[#625f55]">Descripción</th>
                        <th className="w-28 px-2 py-2.5 text-right font-mono text-[10.5px] uppercase tracking-[.08em] text-[#625f55]">Monto</th>
                        <th className="w-32 px-2 py-2.5 text-left font-mono text-[10.5px] uppercase tracking-[.08em] text-[#625f55]">Categoría</th>
                        <th className="w-32 px-2 py-2.5 text-left font-mono text-[10.5px] uppercase tracking-[.08em] text-[#625f55]">Método</th>
                        <th className="w-12 px-2 py-2.5 text-center font-mono text-[10.5px] uppercase text-[#625f55]" />
                      </tr>
                    </thead>
                    <tbody>
                      {manualRows.map((row) => (
                        <tr key={row.id} className="border-b border-[#d5cea3] transition-colors hover:bg-[#e4d794]">
                          <td className="px-2 py-2">
                            <input
                              type="date"
                              value={row.fecha_transaccion}
                              onChange={(e) => updateRow(row.id, 'fecha_transaccion', e.target.value)}
                              className="w-full rounded-sm border border-[#c8bf91] bg-white p-1.5 font-mono text-[12px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={row.tipo}
                              onChange={(e) => updateRow(row.id, 'tipo', e.target.value)}
                              className="w-full rounded-sm border border-[#c8bf91] bg-white p-1.5 text-[12px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
                              className="w-full rounded-sm border border-[#c8bf91] bg-white p-1.5 text-[12px] text-foreground placeholder:text-[#625f55] focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              value={row.monto}
                              onChange={(e) => updateRow(row.id, 'monto', e.target.value)}
                              placeholder="0.00"
                              className="w-full rounded-sm border border-[#c8bf91] bg-white p-1.5 text-right font-mono text-[12px] text-foreground placeholder:text-[#625f55] focus:outline-none focus:ring-2 focus:ring-ring"
                              step="0.01"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={row.categoria_id}
                              onChange={(e) => updateRow(row.id, 'categoria_id', e.target.value)}
                              className="w-full rounded-sm border border-[#c8bf91] bg-white p-1.5 text-[12px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
                              className="w-full rounded-sm border border-[#c8bf91] bg-white p-1.5 text-[12px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
                              className="rounded-sm p-1 text-[#b83245] hover:bg-[#b83245]/10 disabled:cursor-not-allowed disabled:opacity-30"
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
                className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-[#c8bf91] px-4 py-3 text-[13px] font-medium text-[#625f55] transition-colors hover:border-primary hover:text-primary"
              >
                <Plus size={18} />
                Agregar fila
              </button>

              {/* Save Button */}
              {!result && (
                <button
                  onClick={handleSaveManual}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-sm bg-primary px-4 py-3 text-[13.5px] font-semibold text-primary-foreground transition-colors duration-150 hover:bg-[#5f7841] disabled:opacity-50 sm:px-6"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Guardando…
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      Guardar {manualRows.filter(r => r.descripcion && r.monto).length} transacciones
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Result Summary */}
          {result && (
            <div className={`mt-6 rounded-md border p-4 sm:p-6 ${
              (result.created_count || 0) > 0
                ? 'border-[#526a3a] bg-primary/5'
                : 'border-[#b83245] bg-[#b83245]/5'
            }`}>
              <div className="flex items-start gap-3 sm:gap-4">
                {(result.created_count || 0) > 0 ? (
                  <CheckCircle className="h-6 w-6 flex-shrink-0 text-primary sm:h-7 sm:w-7" />
                ) : (
                  <AlertCircle className="h-6 w-6 flex-shrink-0 text-[#b83245] sm:h-7 sm:w-7" />
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="mb-2 text-[15px] font-semibold text-foreground sm:text-[17px]">
                    {(result.created_count || 0) > 0 ? 'Importación exitosa' : 'Error en la importación'}
                  </h3>
                  <div className="space-y-1 text-[12.5px] sm:text-[13px]">
                    <p className="text-[#43436c]">
                      <span className="font-semibold text-[#526a3a]">{result.created_count || 0}</span> transacciones creadas
                    </p>
                    {result.failed_count > 0 && (
                      <p className="text-[#43436c]">
                        <span className="font-semibold text-[#b83245]">{result.failed_count}</span> fallidas
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
                    className="mt-4 rounded-sm border border-[#c8bf91] bg-white px-4 py-2 text-[13px] font-medium text-foreground transition-colors duration-150 hover:bg-[#e4d794]"
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
