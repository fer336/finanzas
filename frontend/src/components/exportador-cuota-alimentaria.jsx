import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Calendar, CheckSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import jsPDF from 'jspdf';
import apiServices from '../services/api';

export function ExportadorCuotaAlimentaria({ data }) {
  // Extraer datos del prop data con valores por defecto seguros
  const {
    ingresos = [],
    gastos = [],
    anio = 'N/A'
  } = data || {};

  // Calcular valores derivados de manera segura
  const ingresosMensuales = (ingresos || []).reduce((sum, ingreso) => sum + (ingreso.Monto || 0), 0);
  const gastosConHija = gastos || [];
  const cuotasPagadas = []; // Por ahora vacío, se puede agregar más tarde
  const selectedMonth = new Date().getMonth(); // Mes actual como fallback
  const selectedYear = anio;
  const [open, setOpen] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    formato: 'pdf',
    incluirResumen: true,
    incluirIngresos: true,
    incluirGastos: true,
    incluirCuotas: true,
    incluirCalculos: true,
    incluirComprobantes: true,
    rangoFechas: 'mes-actual',
    mesesSeleccionados: [selectedMonth],
    añoSeleccionado: selectedYear
  });

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const cuotaMensual = ingresosMensuales * 0.30;
  const totalGastosHija = (gastosConHija || []).reduce((sum, gasto) => sum + (gasto.MontoArs || gasto.Monto || 0), 0);
  const gastosPorAnotar = totalGastosHija * 0.50;

  // Función para obtener datos de múltiples meses
  const obtenerDatosMultiplesMeses = async () => {
    try {
      console.log('🔍 Obteniendo datos para meses:', exportConfig.mesesSeleccionados);
      
      let todosLosIngresos = [];
      let todosLosGastos = [];
      let totalIngresosPeriodo = 0;
      
      // Obtener datos para cada mes seleccionado
      for (const mesIndex of exportConfig.mesesSeleccionados) {
        const fechaInicio = new Date(exportConfig.añoSeleccionado, mesIndex, 1).toISOString().split('T')[0];
        const fechaFin = new Date(exportConfig.añoSeleccionado, mesIndex + 1, 0).toISOString().split('T')[0];
        
        console.log(`📅 Obteniendo datos para ${meses[mesIndex]} ${exportConfig.añoSeleccionado}`);
        console.log(`📅 Rango: ${fechaInicio} a ${fechaFin}`);
        
        // Obtener ingresos del mes
        const resultadoCuota = await apiServices.transaccionesApi.getCuotaAlimentaria(fechaInicio, fechaFin);
        const ingresosMes = resultadoCuota.ingresosCuota || [];
        console.log(`💰 Resultado cuota ${meses[mesIndex]}:`, resultadoCuota);
        console.log(`💰 Ingresos ${meses[mesIndex]}:`, ingresosMes);
        
        if (ingresosMes && ingresosMes.length > 0) {
          todosLosIngresos = [...todosLosIngresos, ...ingresosMes];
          
          // Sumar los montos (corregido campo)
          const totalMes = ingresosMes.reduce((sum, ingreso) => {
            return sum + (ingreso.Monto || 0);
          }, 0);
          
          totalIngresosPeriodo += totalMes;
          console.log(`💰 Total ingresos ${meses[mesIndex]}: $${totalMes.toLocaleString()}`);
        }
        
        // Obtener gastos del mes (usando la API general y filtrando)
        try {
          const todasTransacciones = await apiServices.transaccionesApi.getAll();
          const gastosMes = todasTransacciones.filter(transaccion => {
            const fechaTransaccion = new Date(transaccion.FechaTransaccion);
            const mesTransaccion = fechaTransaccion.getMonth();
            const anoTransaccion = fechaTransaccion.getFullYear();
            
            return mesTransaccion === mesIndex && 
                   anoTransaccion === exportConfig.añoSeleccionado &&
                   transaccion.TipoTransaccion === 'Gasto' &&
                   (transaccion.Etiquetas?.includes('gastos con hija') ||
                    transaccion.Categorias?.Nombre?.toLowerCase().includes('hija') ||
                    transaccion.Categorias?.Nombre?.toLowerCase().includes('colegio'));
          });
          
          todosLosGastos = [...todosLosGastos, ...gastosMes];
          console.log(`🏪 Gastos ${meses[mesIndex]}:`, gastosMes.length);
        } catch (error) {
          console.error(`Error obteniendo gastos para ${meses[mesIndex]}:`, error);
        }
      }
      
      // Calcular totales del período
      const cuotaCalculadaPeriodo = totalIngresosPeriodo * 0.30;
      const totalGastosPeriodo = todosLosGastos.reduce((sum, gasto) => sum + (gasto.MontoArs || gasto.Monto || 0), 0);
      const gastosPorAnotarPeriodo = totalGastosPeriodo * 0.50;
      
      console.log('📊 Totales del período:');
      console.log(`💰 Ingresos totales: $${totalIngresosPeriodo.toLocaleString()}`);
      console.log(`💙 Cuota calculada (30%): $${cuotaCalculadaPeriodo.toLocaleString()}`);
      console.log(`🏪 Gastos totales: $${totalGastosPeriodo.toLocaleString()}`);
      console.log(`📝 Por anotar (50%): $${gastosPorAnotarPeriodo.toLocaleString()}`);
      
      return {
        ingresos: todosLosIngresos,
        gastos: todosLosGastos,
        totales: {
          ingresosTotales: totalIngresosPeriodo,
          cuotaCalculada: cuotaCalculadaPeriodo,
          gastosTotales: totalGastosPeriodo,
          gastosPorAnotar: gastosPorAnotarPeriodo,
          totalDocumentado: cuotaCalculadaPeriodo + gastosPorAnotarPeriodo
        }
      };
      
    } catch (error) {
      console.error('Error obteniendo datos de múltiples meses:', error);
      return {
        ingresos: [],
        gastos: [],
        totales: {
          ingresosTotales: 0,
          cuotaCalculada: 0,
          gastosTotales: 0,
          gastosPorAnotar: 0,
          totalDocumentado: 0
        }
      };
    }
  };

  const generarReporteCompleto = async (datosMultiplesMeses = null) => {
    // Usar datos de múltiples meses si están disponibles, sino usar datos actuales
    const datos = datosMultiplesMeses || {
      totales: {
        ingresosTotales: ingresosMensuales,
        cuotaCalculada: cuotaMensual,
        gastosTotales: totalGastosHija,
        gastosPorAnotar: gastosPorAnotar,
        totalDocumentado: cuotaMensual + gastosPorAnotar
      },
      ingresos: [],
      gastos: gastosConHija
    };

    const mesesTexto = exportConfig.mesesSeleccionados.length === 1 
      ? meses[exportConfig.mesesSeleccionados[0]]
      : exportConfig.mesesSeleccionados.length === 12
        ? 'Año completo'
        : exportConfig.mesesSeleccionados.map(m => meses[m]).join(', ');

    const reporte = {
      metadata: {
        titulo: 'Reporte de Cuota Alimentaria',
        periodo: `${mesesTexto} ${exportConfig.añoSeleccionado}`,
        fechaGeneracion: new Date().toISOString(),
        version: '2.0',
        mesesIncluidos: exportConfig.mesesSeleccionados.map(m => meses[m])
      },
      resumen: {
        ingresosMensuales: datos.totales.ingresosTotales,
        cuotaCalculada: datos.totales.cuotaCalculada,
        porcentajeCuota: 30,
        totalGastosHija: datos.totales.gastosTotales,
        gastosPorAnotar: datos.totales.gastosPorAnotar,
        porcentajeGastos: 50,
        totalDocumentado: datos.totales.totalDocumentado,
        cantidadMeses: exportConfig.mesesSeleccionados.length
      },
      ingresos: exportConfig.incluirIngresos ? [] : null, // Se llenarían con datos reales
      gastosConHija: exportConfig.incluirGastos ? datos.gastos.map(gasto => ({
        fecha: gasto.FechaTransaccion,
        descripcion: gasto.Descripcion,
        montoTotal: gasto.MontoArs || gasto.Monto,
        montoPorAnotar: (gasto.MontoArs || gasto.Monto) * 0.5,
        categoria: gasto.Categorias?.Nombre || 'Sin categoría',
        metodoPago: gasto.MetodosPago?.Nombre || 'No especificado',
        tieneComprobante: !!gasto.ArchivoAdjunto,
        notas: gasto.Notas
      })) : null,
      ingresosCuota: exportConfig.incluirIngresos ? datos.ingresos.map(ingreso => ({
        fecha: ingreso.FechaTransaccion,
        descripcion: ingreso.Descripcion,
            montoOriginal: ingreso.Monto,
            cuota30Porciento: ingreso.CuotaAlimentaria30Porciento || (ingreso.Monto) * 0.3,
        notas: ingreso.Notas
      })) : null,
      cuotasPagadas: exportConfig.incluirCuotas ? cuotasPagadas.map(cuota => ({
        fecha: cuota.FechaTransaccion,
        monto: cuota.MontoArs || cuota.Monto,
        descripcion: cuota.Descripcion,
        tieneComprobante: !!cuota.ArchivoAdjunto
      })) : null,
      calculos: exportConfig.incluirCalculos ? {
        baseCalculoCuota: {
          ingresosBrutos: ingresosMensuales,
          porcentaje: 30,
          cuotaMensual: cuotaMensual
        },
        baseCalculoGastos: {
          totalGastos: totalGastosHija,
          porcentaje: 50,
          montoAnotar: gastosPorAnotar
        },
        totales: {
          cuotaObligatoria: cuotaMensual,
          gastosAdicionales: gastosPorAnotar,
          totalMensual: cuotaMensual + gastosPorAnotar
        }
      } : null,
      estadisticas: {
        cantidadGastos: gastosConHija.length,
        gastosConComprobante: gastosConHija.filter(g => g.ArchivoAdjunto).length,
        porcentajeDocumentacion: gastosConHija.length > 0 ? 
          Math.round((gastosConHija.filter(g => g.ArchivoAdjunto).length / gastosConHija.length) * 100) : 0,
        cuotasPagadas: cuotasPagadas.length,
        cumplimientoMensual: cuotasPagadas.length > 0 ? 'Cumplido' : 'Pendiente'
      }
    };

    return reporte;
  };

  const exportarCSV = (datos, nombreArchivo) => {
    // Convertir a CSV
    const csvContent = convertirACSV(datos);
    descargarArchivo(csvContent, `${nombreArchivo}.csv`, 'text/csv');
  };

  const exportarJSON = (datos, nombreArchivo) => {
    const jsonContent = JSON.stringify(datos, null, 2);
    descargarArchivo(jsonContent, `${nombreArchivo}.json`, 'application/json');
  };

  const convertirACSV = (datos) => {
    let csv = '';
    
    // Encabezado del reporte
    csv += `Reporte de Cuota Alimentaria\n`;
    csv += `Período: ${datos.metadata.periodo}\n`;
    csv += `Fecha de generación: ${new Date(datos.metadata.fechaGeneracion).toLocaleString()}\n\n`;
    
    // Resumen
    csv += `RESUMEN EJECUTIVO\n`;
    csv += `Ingresos mensuales,${datos.resumen.ingresosMensuales}\n`;
    csv += `Cuota calculada (30%),${datos.resumen.cuotaCalculada}\n`;
    csv += `Total gastos con hija,${datos.resumen.totalGastosHija}\n`;
    csv += `Gastos por anotar (50%),${datos.resumen.gastosPorAnotar}\n`;
    csv += `Total documentado,${datos.resumen.totalDocumentado}\n\n`;
    
    // Gastos con hija
    if (datos.gastosConHija && datos.gastosConHija.length > 0) {
      csv += `GASTOS CON HIJA\n`;
      csv += `Fecha,Descripción,Monto Total,Monto por Anotar,Categoría,Método Pago,Tiene Comprobante,Notas\n`;
      datos.gastosConHija.forEach(gasto => {
        csv += `${gasto.fecha},${gasto.descripcion},${gasto.montoTotal},${gasto.montoPorAnotar},${gasto.categoria},${gasto.metodoPago},${gasto.tieneComprobante ? 'Sí' : 'No'},${gasto.notas || ''}\n`;
      });
      csv += '\n';
    }
    
    // Cuotas pagadas
    if (datos.cuotasPagadas && datos.cuotasPagadas.length > 0) {
      csv += `CUOTAS PAGADAS\n`;
      csv += `Fecha,Monto,Descripción,Tiene Comprobante\n`;
      datos.cuotasPagadas.forEach(cuota => {
        csv += `${cuota.fecha},${cuota.monto},${cuota.descripcion},${cuota.tieneComprobante ? 'Sí' : 'No'}\n`;
      });
      csv += '\n';
    }
    
    // Estadísticas
    csv += `ESTADÍSTICAS\n`;
    csv += `Cantidad de gastos,${datos.estadisticas.cantidadGastos}\n`;
    csv += `Gastos con comprobante,${datos.estadisticas.gastosConComprobante}\n`;
    csv += `Porcentaje de documentación,${datos.estadisticas.porcentajeDocumentacion}%\n`;
    csv += `Cuotas pagadas,${datos.estadisticas.cuotasPagadas}\n`;
    csv += `Cumplimiento mensual,${datos.estadisticas.cumplimientoMensual}\n`;
    
    return csv;
  };

  const descargarArchivo = (contenido, nombreArchivo, tipoMime) => {
    const blob = new Blob([contenido], { type: tipoMime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportarPDF = async (datos, nombreArchivo) => {
    try {
      // Crear PDF directamente sin html2canvas para reducir tamaño
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;
      const usableWidth = pageWidth - (margin * 2);
      let yPosition = margin;
      
      // Configurar fuentes y colores
      pdf.setFont('helvetica');
      
      // Función para agregar nueva página si es necesario
      const checkPageBreak = (requiredHeight) => {
        if (yPosition + requiredHeight > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };
      
      
      // ENCABEZADO
      pdf.setFillColor(30, 64, 175); // Azul
      pdf.rect(margin, yPosition, usableWidth, 25, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('REPORTE DE CUOTA ALIMENTARIA', margin + 5, yPosition + 8);
      
      const mesesTexto = exportConfig.mesesSeleccionados.length === 1 
        ? meses[exportConfig.mesesSeleccionados[0]]
        : exportConfig.mesesSeleccionados.length === 12
          ? 'Año completo'
          : exportConfig.mesesSeleccionados.map(m => meses[m]).join(', ');
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Período: ${mesesTexto} ${exportConfig.añoSeleccionado}`, margin + 5, yPosition + 15);
      pdf.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, margin + 5, yPosition + 20);
      
      yPosition += 35;
      
      // RESUMEN EJECUTIVO
      if (exportConfig.incluirResumen) {
        checkPageBreak(40);
        
        pdf.setTextColor(31, 41, 55);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('RESUMEN EJECUTIVO', margin, yPosition);
        yPosition += 10;
        
        // Tabla de resumen simplificada
        const tableData = [
          ['CONCEPTO', 'PERÍODO', '%', 'MONTO'],
          ['Ingresos Totales', `${datos.resumen.cantidadMeses || 1} mes(es)`, '100%', `$${datos.resumen.ingresosMensuales.toLocaleString()}`],
          ['Cuota Alimentaria', 'Base Legal', '30%', `$${datos.resumen.cuotaCalculada.toLocaleString()}`],
          ['Gastos con Hija', `${datos.resumen.cantidadMeses || 1} mes(es)`, '100%', `$${datos.resumen.totalGastosHija.toLocaleString()}`],
          ['Por Anotar (50%)', 'Calculado', '50%', `$${datos.resumen.gastosPorAnotar.toLocaleString()}`],
          ['TOTAL DOCUMENTADO', 'PERÍODO', '-', `$${datos.resumen.totalDocumentado.toLocaleString()}`]
        ];
        
        // Dibujar tabla simple
        const rowHeight = 8;
        const colWidths = [60, 30, 20, 40];
        let tableY = yPosition;
        
        tableData.forEach((row, index) => {
          checkPageBreak(rowHeight);
          
          if (index === 0) {
            // Header
            pdf.setFillColor(59, 130, 246);
            pdf.rect(margin, tableY, usableWidth, rowHeight, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFont('helvetica', 'bold');
          } else if (index === tableData.length - 1) {
            // Total row
            pdf.setFillColor(220, 252, 231);
            pdf.rect(margin, tableY, usableWidth, rowHeight, 'F');
            pdf.setTextColor(21, 128, 61);
            pdf.setFont('helvetica', 'bold');
          } else {
            // Normal row
            if (index % 2 === 0) {
              pdf.setFillColor(248, 250, 252);
            } else {
              pdf.setFillColor(255, 255, 255);
            }
            pdf.rect(margin, tableY, usableWidth, rowHeight, 'F');
            pdf.setTextColor(55, 65, 81);
            pdf.setFont('helvetica', 'normal');
          }
          
          pdf.setFontSize(9);
          let xPos = margin + 2;
          row.forEach((cell, colIndex) => {
            const align = colIndex === 3 ? 'right' : 'left';
            const cellWidth = colWidths[colIndex];
            
            if (align === 'right') {
              pdf.text(cell, xPos + cellWidth - 2, tableY + 5);
            } else {
              pdf.text(cell, xPos, tableY + 5);
            }
            xPos += cellWidth;
          });
          
          tableY += rowHeight;
        });
        
        yPosition = tableY + 10;
      }
      
      // INGRESOS PARA CUOTA
      if (exportConfig.incluirIngresos && datos.ingresosCuota && datos.ingresosCuota.length > 0) {
        checkPageBreak(30);
        
        pdf.setTextColor(31, 41, 55);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`INGRESOS PARA CUOTA (${datos.ingresosCuota.length} registros)`, margin, yPosition);
        yPosition += 10;
        
        // Tabla simplificada de ingresos
        const rowHeight = 6;
        let tableY = yPosition;
        
        // Header
        pdf.setFillColor(5, 150, 105);
        pdf.rect(margin, tableY, usableWidth, rowHeight, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        
        pdf.text('FECHA', margin + 2, tableY + 4);
        pdf.text('DESCRIPCION', margin + 25, tableY + 4);
        pdf.text('MONTO ORIGINAL', margin + 100, tableY + 4);
        pdf.text('CUOTA (30%)', margin + 140, tableY + 4);
        
        tableY += rowHeight;
        
        // Datos
        datos.ingresosCuota.forEach((ingreso, index) => {
          checkPageBreak(rowHeight);
          
          if (index % 2 === 0) {
            pdf.setFillColor(248, 250, 252);
          } else {
            pdf.setFillColor(255, 255, 255);
          }
          pdf.rect(margin, tableY, usableWidth, rowHeight, 'F');
          
          pdf.setTextColor(55, 65, 81);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
          
          const fecha = new Date(ingreso.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
          pdf.text(fecha, margin + 2, tableY + 4);
          
          const descripcion = ingreso.descripcion.length > 35 ? ingreso.descripcion.substring(0, 35) + '...' : ingreso.descripcion;
          pdf.text(descripcion, margin + 25, tableY + 4);
          
          pdf.text(`$${ingreso.montoOriginal.toLocaleString()}`, margin + 100, tableY + 4);
          pdf.text(`$${ingreso.cuota30Porciento.toLocaleString()}`, margin + 140, tableY + 4);
          
          tableY += rowHeight;
        });
        
        // Total
        checkPageBreak(rowHeight);
        pdf.setFillColor(240, 249, 255);
        pdf.rect(margin, tableY, usableWidth, rowHeight, 'F');
        pdf.setTextColor(30, 64, 175);
        pdf.setFont('helvetica', 'bold');
        pdf.text('TOTALES:', margin + 70, tableY + 4);
        pdf.text(`$${datos.ingresosCuota.reduce((sum, ing) => sum + ing.montoOriginal, 0).toLocaleString()}`, margin + 100, tableY + 4);
        pdf.text(`$${datos.ingresosCuota.reduce((sum, ing) => sum + ing.cuota30Porciento, 0).toLocaleString()}`, margin + 140, tableY + 4);
        
        yPosition = tableY + 15;
      }
      
      // GASTOS CON HIJA
      if (exportConfig.incluirGastos && datos.gastosConHija && datos.gastosConHija.length > 0) {
        checkPageBreak(30);
        
        pdf.setTextColor(31, 41, 55);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`GASTOS CON HIJA (${datos.gastosConHija.length} registros)`, margin, yPosition);
        yPosition += 10;
        
        // Tabla simplificada de gastos
        const rowHeight = 6;
        let tableY = yPosition;
        
        // Header
        pdf.setFillColor(217, 119, 6);
        pdf.rect(margin, tableY, usableWidth, rowHeight, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        
        pdf.text('FECHA', margin + 2, tableY + 4);
        pdf.text('DESCRIPCION', margin + 25, tableY + 4);
        pdf.text('MONTO TOTAL', margin + 90, tableY + 4);
        pdf.text('POR ANOTAR (50%)', margin + 130, tableY + 4);
        pdf.text('COMP.', margin + 170, tableY + 4);
        
        tableY += rowHeight;
        
        // Datos (limitamos a los primeros 50 para no hacer el PDF muy pesado)
        const gastosLimitados = datos.gastosConHija.slice(0, 50);
        gastosLimitados.forEach((gasto, index) => {
          checkPageBreak(rowHeight);
          
          if (index % 2 === 0) {
            pdf.setFillColor(254, 247, 237);
          } else {
            pdf.setFillColor(255, 255, 255);
          }
          pdf.rect(margin, tableY, usableWidth, rowHeight, 'F');
          
          pdf.setTextColor(55, 65, 81);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
          
          const fecha = new Date(gasto.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
          pdf.text(fecha, margin + 2, tableY + 4);
          
          const descripcion = gasto.descripcion.length > 30 ? gasto.descripcion.substring(0, 30) + '...' : gasto.descripcion;
          pdf.text(descripcion, margin + 25, tableY + 4);
          
          pdf.text(`$${gasto.montoTotal.toLocaleString()}`, margin + 90, tableY + 4);
          pdf.text(`$${gasto.montoPorAnotar.toLocaleString()}`, margin + 130, tableY + 4);
          
          if (gasto.tieneComprobante) {
            pdf.setTextColor(5, 150, 105);
            pdf.text('SI', margin + 175, tableY + 4);
          } else {
            pdf.setTextColor(220, 38, 38);
            pdf.text('NO', margin + 175, tableY + 4);
          }
          
          tableY += rowHeight;
        });
        
        // Mostrar nota si hay más gastos
        if (datos.gastosConHija.length > 50) {
          checkPageBreak(rowHeight);
          pdf.setFillColor(249, 250, 251);
          pdf.rect(margin, tableY, usableWidth, rowHeight, 'F');
          pdf.setTextColor(107, 114, 128);
          pdf.setFont('helvetica', 'italic');
          pdf.text(`... y ${datos.gastosConHija.length - 50} gastos más (consultar sistema para detalle completo)`, margin + 2, tableY + 4);
          tableY += rowHeight;
        }
        
        // Total
        checkPageBreak(rowHeight);
        pdf.setFillColor(254, 243, 199);
        pdf.rect(margin, tableY, usableWidth, rowHeight, 'F');
        pdf.setTextColor(217, 119, 6);
        pdf.setFont('helvetica', 'bold');
        pdf.text('TOTALES:', margin + 60, tableY + 4);
        pdf.text(`$${datos.gastosConHija.reduce((sum, gasto) => sum + gasto.montoTotal, 0).toLocaleString()}`, margin + 90, tableY + 4);
        pdf.text(`$${datos.gastosConHija.reduce((sum, gasto) => sum + gasto.montoPorAnotar, 0).toLocaleString()}`, margin + 130, tableY + 4);
        
        const conComprobante = datos.gastosConHija.filter(g => g.tieneComprobante).length;
        pdf.text(`${conComprobante}/${datos.gastosConHija.length}`, margin + 170, tableY + 4);
        
        yPosition = tableY + 15;
      }
      
      // ESTADÍSTICAS RESUMIDAS
      checkPageBreak(25);
      pdf.setTextColor(31, 41, 55);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ESTADISTICAS', margin, yPosition);
      yPosition += 10;
      
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, yPosition, usableWidth, 15, 'F');
      
      pdf.setTextColor(55, 65, 81);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const porcentajeDoc = Math.round((datos.estadisticas.gastosConComprobante / datos.estadisticas.cantidadGastos) * 100) || 0;
      pdf.text(`Gastos registrados: ${datos.estadisticas.cantidadGastos}`, margin + 5, yPosition + 5);
      pdf.text(`Con comprobante: ${datos.estadisticas.gastosConComprobante} (${porcentajeDoc}%)`, margin + 5, yPosition + 10);
      pdf.text(`Cumplimiento: ${porcentajeDoc >= 80 ? 'Excelente' : 'Mejorable'}`, margin + 100, yPosition + 5);
      pdf.text(`Base legal: Art. 658-664 CCyC`, margin + 100, yPosition + 10);
      
      yPosition += 20;
      
      // PIE DE PÁGINA SIMPLE
      checkPageBreak(20);
      pdf.setFillColor(55, 65, 81);
      pdf.rect(margin, yPosition, usableWidth, 15, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Sistema de Gestion de Gastos - Documento valido para presentacion legal', margin + 2, yPosition + 5);
      pdf.text(`Generado: ${new Date().toLocaleString('es-ES')}`, margin + 2, yPosition + 10);
      
      // Descargar PDF optimizado
      pdf.save(`${nombreArchivo}.pdf`);
      
    } catch (error) {
      console.error('Error generando PDF optimizado:', error);
      alert('Error al generar el PDF. Inténtalo de nuevo.');
    }
  };


  const handleExportar = async () => {
    try {
      // Validar que se hayan seleccionado meses
      if (exportConfig.mesesSeleccionados.length === 0) {
        alert('Por favor selecciona al menos un mes para exportar.');
        return;
      }

      console.log('🚀 Iniciando exportación...');
      console.log('📅 Meses seleccionados:', exportConfig.mesesSeleccionados.map(m => meses[m]));
      
      // Mostrar indicador de carga
      const loadingElement = document.createElement('div');
      loadingElement.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 9999;">
          <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
            <div style="margin-bottom: 10px;">⏳ Obteniendo datos de ${exportConfig.mesesSeleccionados.length} mes(es)...</div>
            <div style="font-size: 12px; color: #666;">Generando PDF optimizado (< 3MB)</div>
          </div>
        </div>
      `;
      document.body.appendChild(loadingElement);
      
      // Obtener datos de múltiples meses
      const datosMultiplesMeses = await obtenerDatosMultiplesMeses();
      console.log('📊 Datos obtenidos:', datosMultiplesMeses);
      
      // Generar reporte con los datos obtenidos
      const reporte = await generarReporteCompleto(datosMultiplesMeses);
      
      const mesesTexto = exportConfig.mesesSeleccionados.length === 1 
        ? meses[exportConfig.mesesSeleccionados[0]]
        : exportConfig.mesesSeleccionados.length === 12
          ? 'año-completo'
          : exportConfig.mesesSeleccionados.map(m => meses[m]).join('-');
      const nombreBase = `cuota-alimentaria-${mesesTexto}-${exportConfig.añoSeleccionado}`;
      
      // Actualizar indicador
      loadingElement.querySelector('div > div').innerHTML = '📄 Generando PDF optimizado...';
    
    switch (exportConfig.formato) {
        case 'pdf':
          await exportarPDF(reporte, nombreBase);
          break;
      case 'excel':
      case 'csv':
        exportarCSV(reporte, nombreBase);
        break;
      case 'json':
        exportarJSON(reporte, nombreBase);
        break;
      default:
          await exportarPDF(reporte, nombreBase);
    }
    
      // Remover indicador de carga
      document.body.removeChild(loadingElement);
      
      console.log('✅ Exportación completada');
    setOpen(false);
      
    } catch (error) {
      console.error('❌ Error en exportación:', error);
      
      // Remover indicador si existe
      const loadingElement = document.querySelector('[style*="z-index: 9999"]');
      if (loadingElement) {
        document.body.removeChild(loadingElement);
      }
      
      alert(`Error al generar el reporte: ${error.message || 'Error desconocido'}. Inténtalo de nuevo.`);
    }
  };

  const toggleMes = (mesIndex) => {
    setExportConfig(prev => ({
      ...prev,
      mesesSeleccionados: prev.mesesSeleccionados.includes(mesIndex)
        ? prev.mesesSeleccionados.filter(m => m !== mesIndex)
        : [...prev.mesesSeleccionados, mesIndex].sort()
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full sm:w-auto gap-2 bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black">
          <Download className="h-4 w-4 mr-2" />
          Exportar Reporte
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Exportar Reporte de Cuota Alimentaria</DialogTitle>
          <DialogDescription>
            Configura los datos y período que deseas incluir en el reporte
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formato de exportación */}
          <div className="space-y-2">
            <Label>Formato de exportación</Label>
            <Select value={exportConfig.formato} onValueChange={(value) => 
              setExportConfig(prev => ({ ...prev, formato: value }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PDF (Recomendado)
                  </div>
                </SelectItem>
                <SelectItem value="excel">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel/CSV
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    JSON
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Selección de año */}
          <div className="space-y-2">
            <Label>Año</Label>
            <Select value={exportConfig.añoSeleccionado.toString()} onValueChange={(value) => 
              setExportConfig(prev => ({ ...prev, añoSeleccionado: parseInt(value) }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selección de meses */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Meses a incluir
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {meses.map((mes, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`mes-${index}`}
                    checked={exportConfig.mesesSeleccionados.includes(index)}
                    onCheckedChange={() => toggleMes(index)}
                  />
                  <Label htmlFor={`mes-${index}`} className="text-sm cursor-pointer">
                    {mes}
                  </Label>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white text-black border-gray-300 hover:bg-blue-50 hover:text-blue-700"
                onClick={() => setExportConfig(prev => ({ 
                  ...prev, 
                  mesesSeleccionados: Array.from({length: 12}, (_, i) => i) 
                }))}
              >
                <CheckSquare className="h-3 w-3 mr-1" />
                Todos
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white text-black border-gray-300 hover:bg-blue-50 hover:text-blue-700"
                onClick={() => setExportConfig(prev => ({ 
                  ...prev, 
                  mesesSeleccionados: [selectedMonth] 
                }))}
              >
                Solo actual
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Datos a incluir</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="resumen"
                  checked={exportConfig.incluirResumen}
                  onCheckedChange={(checked) => 
                    setExportConfig(prev => ({ ...prev, incluirResumen: checked }))
                  }
                />
                <Label htmlFor="resumen">Resumen ejecutivo</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="ingresos"
                  checked={exportConfig.incluirIngresos}
                  onCheckedChange={(checked) => 
                    setExportConfig(prev => ({ ...prev, incluirIngresos: checked }))
                  }
                />
                <Label htmlFor="ingresos">Detalle de ingresos</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="gastos"
                  checked={exportConfig.incluirGastos}
                  onCheckedChange={(checked) => 
                    setExportConfig(prev => ({ ...prev, incluirGastos: checked }))
                  }
                />
                <Label htmlFor="gastos">Gastos con hija</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="cuotas"
                  checked={exportConfig.incluirCuotas}
                  onCheckedChange={(checked) => 
                    setExportConfig(prev => ({ ...prev, incluirCuotas: checked }))
                  }
                />
                <Label htmlFor="cuotas">Cuotas pagadas</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="calculos"
                  checked={exportConfig.incluirCalculos}
                  onCheckedChange={(checked) => 
                    setExportConfig(prev => ({ ...prev, incluirCalculos: checked }))
                  }
                />
                <Label htmlFor="calculos">Cálculos detallados</Label>
              </div>
            </div>
          </div>

          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2">Vista previa del reporte:</h4>
              <div className="text-sm space-y-1">
                <p>• <strong>Formato:</strong> {exportConfig.formato.toUpperCase()}</p>
                <p>• <strong>Período:</strong> {exportConfig.mesesSeleccionados.length === 1 
                  ? meses[exportConfig.mesesSeleccionados[0]]
                  : exportConfig.mesesSeleccionados.length === 12 
                    ? 'Año completo'
                    : `${exportConfig.mesesSeleccionados.length} meses seleccionados`
                } {exportConfig.añoSeleccionado}</p>
                <p>• <strong>Meses:</strong> {exportConfig.mesesSeleccionados.map(m => meses[m]).join(', ')}</p>
                <p>• <strong>Secciones incluidas:</strong> {[
                  exportConfig.incluirResumen && 'Resumen',
                  exportConfig.incluirIngresos && 'Ingresos', 
                  exportConfig.incluirGastos && 'Gastos',
                  exportConfig.incluirCuotas && 'Cuotas',
                  exportConfig.incluirCalculos && 'Cálculos'
                ].filter(Boolean).join(', ')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="bg-white text-black border-gray-300 hover:bg-gray-50">
            Cancelar
          </Button>
          <Button onClick={handleExportar} className="gap-2 bg-green-600 text-white hover:bg-green-700">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}