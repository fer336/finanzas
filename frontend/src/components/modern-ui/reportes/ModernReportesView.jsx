import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { BarChart3, Download, PieChart, DollarSign, TrendingUp } from 'lucide-react';

const ModernReportesView = ({ onGenerateReport, onExportPDF }) => {
  const [selectedPeriodo, setSelectedPeriodo] = useState('mes');
  const [selectedTipo, setSelectedTipo] = useState('general');

  const reportTypes = [
    { id: 'general', nombre: 'Reporte General', descripcion: 'Resumen completo de ingresos, gastos y balance', icon: BarChart3, color: '#10b981' },
    { id: 'categoria', nombre: 'Reporte por Categoría', descripcion: 'Análisis detallado de gastos por categoría', icon: PieChart, color: '#34d399' },
    { id: 'metodo', nombre: 'Reporte por Método de Pago', descripcion: 'Distribución de gastos según método de pago', icon: DollarSign, color: '#a78bfa' },
    { id: 'tendencias', nombre: 'Análisis de Tendencias', descripcion: 'Proyecciones y tendencias de tus finanzas', icon: TrendingUp, color: '#10b981' }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      
      {/* Configuración */}
      <div className="bg-[#18181b] rounded-3xl p-6 border border-white/5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#10b981]/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-[#10b981]" />
            </div>
            <h2 className="text-base font-semibold text-white">Configuración del Reporte</h2>
          </div>
          <button onClick={onExportPDF} className="px-4 py-2 bg-[#18181b] text-white border border-white/5 rounded-xl hover:bg-white/5 transition-colors flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select value={selectedPeriodo} onChange={(e) => setSelectedPeriodo(e.target.value)} className="px-4 py-2.5 rounded-xl bg-[#0a0a0a] text-white border border-white/5 focus:outline-none focus:border-[#10b981]/30 transition-colors">
            <option value="mes">Este mes</option>
            <option value="trimestre">Este trimestre</option>
            <option value="año">Este año</option>
          </select>
          <select value={selectedTipo} onChange={(e) => setSelectedTipo(e.target.value)} className="px-4 py-2.5 rounded-xl bg-[#0a0a0a] text-white border border-white/5 focus:outline-none focus:border-[#10b981]/30 transition-colors">
            {reportTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.nombre}</option>)}
          </select>
          <button onClick={() => onGenerateReport && onGenerateReport(selectedTipo, selectedPeriodo)} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#10b981] to-[#34d399] text-white font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Generar Reporte
          </button>
        </div>
      </div>

      {/* Tipos de Reporte */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <div key={report.id} className="bg-[#18181b] rounded-3xl p-6 border border-white/5 cursor-pointer hover:border-[#10b981]/30 transition-all" onClick={() => { setSelectedTipo(report.id); onGenerateReport && onGenerateReport(report.id, selectedPeriodo); }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${report.color}20` }}>
                  <Icon className="w-6 h-6" style={{ color: report.color }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">{report.nombre}</h3>
                  <p className="text-sm text-gray-400">{report.descripcion}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

ModernReportesView.propTypes = {
  onGenerateReport: PropTypes.func,
  onExportPDF: PropTypes.func,
};

export default ModernReportesView;
