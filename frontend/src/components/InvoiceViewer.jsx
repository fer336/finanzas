import React from 'react';
import { X, ExternalLink, Download, FileText } from 'lucide-react';

const InvoiceViewer = ({ isOpen, onClose, payment, invoiceUrl }) => {
  if (!isOpen) return null;

  const handleOpenExternal = () => {
    if (invoiceUrl) {
      window.open(invoiceUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownload = () => {
    if (invoiceUrl) {
      // Crear un enlace temporal para descarga
      const link = document.createElement('a');
      link.href = invoiceUrl;
      link.download = `factura_${payment?.descripcion || 'documento'}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="border-3 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-6xl h-[90vh] flex flex-col" style={{background: '#1a1a1a'}}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 border-b-3 border-black p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <FileText size={20} className="text-black" strokeWidth={3} />
              </div>
              <div>
                <h1 className="text-lg font-black uppercase text-white tracking-tight">
                  Ver Factura
                </h1>
                <p className="text-sm text-blue-100 font-medium">
                  {payment?.descripcion || 'Documento PDF'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {invoiceUrl && (
                <>
                  <button
                    onClick={handleDownload}
                    className="px-3 py-2 bg-green-500 border-2 border-black text-black font-black text-xs uppercase hover:bg-green-400 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1"
                    title="Descargar PDF"
                  >
                    <Download size={12} strokeWidth={3} />
                    Descargar
                  </button>
                  
                  <button
                    onClick={handleOpenExternal}
                    className="px-3 py-2 bg-blue-400 border-2 border-black text-black font-black text-xs uppercase hover:bg-blue-300 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1"
                    title="Abrir en nueva ventana"
                  >
                    <ExternalLink size={12} strokeWidth={3} />
                    Externa
                  </button>
                </>
              )}
              
              <button
                onClick={onClose}
                className="w-8 h-8 bg-red-500 border-2 border-black flex items-center justify-center hover:bg-red-400 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <X size={16} strokeWidth={3} className="text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-hidden" style={{background: '#242424'}}>
          {invoiceUrl ? (
            <div className="w-full h-full bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <iframe
                src={invoiceUrl}
                className="w-full h-full border-none"
                title={`Factura - ${payment?.descripcion || 'Documento'}`}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" style={{background: '#2a2a2a'}}>
              <div className="text-center">
                <FileText size={64} className="text-zinc-500 mx-auto mb-4" strokeWidth={2} />
                <h3 className="text-xl font-black text-white mb-2">
                  No se encontró la factura
                </h3>
                <p className="text-zinc-400 text-sm">
                  No hay URL de factura disponible para este pago
                </p>
                
                {payment && (
                  <div className="mt-6 p-4 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-left" style={{background: '#1a1a1a'}}>
                    <h4 className="text-white font-black text-sm mb-2">Información del Pago:</h4>
                    <div className="space-y-1 text-xs text-zinc-300">
                      <p><strong>Descripción:</strong> {payment.descripcion}</p>
                      <p><strong>Beneficiario:</strong> {payment.beneficiario}</p>
                      <p><strong>Monto:</strong> ${payment.monto?.toLocaleString('es-AR')}</p>
                      <p><strong>Vencimiento:</strong> {payment.fecha_vencimiento}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer con información adicional */}
        {payment && (
          <div className="border-t-3 border-black p-3 flex-shrink-0" style={{background: '#242424'}}>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-4 text-zinc-300">
                <span><strong>Beneficiario:</strong> {payment.beneficiario}</span>
                <span><strong>Monto:</strong> ${payment.monto?.toLocaleString('es-AR')}</span>
                <span><strong>Vencimiento:</strong> {payment.fecha_vencimiento}</span>
              </div>
              
              <div className={`px-2 py-1 text-xs font-black uppercase border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                payment.estado === 'pendiente' ? 'bg-yellow-500 text-black border-black' :
                payment.estado === 'vencido' ? 'bg-red-500 text-white border-black' :
                'bg-green-500 text-black border-black'
              }`}>
                {payment.estado}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceViewer;