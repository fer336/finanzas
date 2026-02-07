import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Heart
} from 'lucide-react';
import apiServices from '../services/api';
import { NuevoGastoHijaModal } from './nuevo-gasto-hija-modal';
import { ExportadorCuotaAlimentaria } from './exportador-cuota-alimentaria';
// import { ValidadorCuotaAlimentaria } from './validador-cuota-alimentaria';
import { GestionPagosCuota } from './gestion-pagos-cuota';
import { HistorialIngresosCuota } from './historial-ingresos-cuota';

// Componentes custom con estilo dark/retro para reemplazar los eliminados
const Card = ({ children, className = '' }) => (
  <div className={`bg-zinc-900 border-2 border-zinc-800 rounded-2xl ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }) => (
  <div className={`p-6 pb-4 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-bold text-white ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`p-6 pt-2 ${className}`}>
    {children}
  </div>
);

export function CuotaAlimentariaView() {
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(8); // Septiembre
  const [selectedYear, setSelectedYear] = useState(2025);
  
  const [ingresosMensuales, setIngresosMensuales] = useState(0);
  const [ingresosCuotaDetalle, setIngresosCuotaDetalle] = useState([]);
  const [gastosConHija, setGastosConHija] = useState([]);
  const [cuotasPagadas, setCuotasPagadas] = useState([]);

  const cuotaMensual = ingresosMensuales * 0.30;
  const totalGastosHija = gastosConHija.reduce((sum, gasto) => sum + (gasto.monto || gasto.Monto || 0), 0);
  const gastosPorAnotar = totalGastosHija * 0.50;

  // eslint-disable-next-line no-unused-vars
  const estadosPago = gastosConHija.reduce((acc, gasto) => {
    const notas = gasto.notas || gasto.Notas || '';
    if (notas.includes('[PAGO_TOTAL]')) {
      acc.total++;
    } else if (notas.includes('[PAGO_PARCIAL')) { // Corregido para buscar parcial
      acc.parcial++;
    } else {
      acc.impago++;
    }
    return acc;
  }, { total: 0, parcial: 0, impago: 0 });

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { transaccionesApi, pagosPendientesApi } = apiServices;
      const fechaInicio = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0];
      const fechaFin = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0];
      
      console.log('🍼 Cargando datos cuota alimentaria para:', { fechaInicio, fechaFin });
      
      // Usar el nuevo método de la API
      const resultadoCuota = await transaccionesApi.getCuotaAlimentaria(fechaInicio, fechaFin);
      console.log('🍼 Resultado cuota alimentaria:', resultadoCuota);
      
      // Procesar ingresos marcados para cuota alimentaria
      const ingresosCuota = resultadoCuota.ingresosCuota || [];
      const totalIngresos = ingresosCuota.reduce((sum, t) => sum + (t.monto || 0), 0);
      setIngresosMensuales(totalIngresos);
      setIngresosCuotaDetalle(ingresosCuota);
      
      // Usar los gastos ya filtrados por el método de la API
      const gastosConHijaNuevos = resultadoCuota.gastosConHija || [];
      setGastosConHija(gastosConHijaNuevos);
      
      console.log('🍼 Datos procesados:', {
        totalIngresos,
        cantidadIngresosCuota: ingresosCuota.length,
        cantidadGastosHija: gastosConHijaNuevos.length
      });

      // Cargar cuotas pagadas (pagos que incluyen "cuota" en la descripción)
      try {
        const pagosPendientes = await pagosPendientesApi.getAll(200, 0);
        const pagosPendientesList = pagosPendientes.list || [];
        
        const cuotasPagadasDelMes = pagosPendientesList.filter(p => {
          const fechaVencimiento = p.fechavencimiento || p.Fechavencimiento;
          if (!fechaVencimiento) return false;
          
          const fecha = new Date(fechaVencimiento);
          return fecha.getMonth() === selectedMonth && 
                 fecha.getFullYear() === selectedYear &&
                 (p.descripcion?.toLowerCase().includes('cuota') || 
                  p.Descripcion?.toLowerCase().includes('cuota'));
        });
        
        setCuotasPagadas(cuotasPagadasDelMes);
      } catch (error) {
        console.error('Error cargando cuotas pagadas:', error);
        setCuotasPagadas([]);
      }

    } catch (error) {
      console.error("Error al cargar datos de cuota alimentaria:", error);
      setError("No se pudieron cargar los datos. " + error.message);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleGastoCreado = () => {
    cargarDatos();
  };

  return (
    <div className="h-full p-0" style={{background: '#000000'}}>
      <div className="h-full w-full p-4 md:p-6 space-y-6">
        {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-pink-500/20 border-2 border-pink-500/30 flex items-center justify-center rounded-lg">
              <Heart className="h-6 w-6 text-pink-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase text-white tracking-tight">Cuota Alimentaria</h1>
              <p className="text-zinc-400 text-sm font-bold mt-1">GESTIÓN DE GASTOS Y CUOTA PARA TU HIJA</p>
            </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full sm:w-auto px-4 py-2.5 bg-zinc-900 border-2 border-zinc-700 rounded-lg text-white font-bold uppercase text-xs hover:bg-zinc-800 focus:outline-none"
            >
                {meses.map((mes, index) => (
                <option key={index} value={index}>{mes}</option>
              ))}
            </select>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full sm:w-auto px-4 py-2.5 bg-zinc-900 border-2 border-zinc-700 rounded-lg text-white font-bold uppercase text-xs hover:bg-zinc-800 focus:outline-none"
            >
                    {[2025, 2024, 2023].map(year => (
                <option key={year} value={year}>{year}</option>
                ))}
            </select>
        </div>
      </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900 p-4 rounded-lg border-2 border-zinc-800">
            <p className="text-zinc-400 text-sm font-bold uppercase">Ingresos Base</p>
            <p className="text-3xl font-bold text-blue-400 mt-1">
              ${ingresosMensuales.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            </div>
          <div className="bg-zinc-900 p-4 rounded-lg border-2 border-zinc-800">
            <p className="text-zinc-400 text-sm font-bold uppercase">Cuota Legal (30%)</p>
            <p className="text-3xl font-bold text-green-400 mt-1">
              ${cuotaMensual.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            </div>
          <div className="bg-zinc-900 p-4 rounded-lg border-2 border-zinc-800">
            <p className="text-zinc-400 text-sm font-bold uppercase">Gastos Adicionales</p>
            <p className="text-3xl font-bold text-pink-400 mt-1">
              ${gastosPorAnotar.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            </div>
          <div className="bg-zinc-900 p-4 rounded-lg border-2 border-zinc-800">
            <p className="text-zinc-400 text-sm font-bold uppercase">Total Documentado</p>
            <p className="text-3xl font-bold text-purple-400 mt-1">
              ${(cuotaMensual + gastosPorAnotar).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
      </div>
          <div className="bg-zinc-900 p-4 rounded-lg border-2 border-zinc-800">
            <p className="text-zinc-400 text-sm font-bold uppercase">Cuotas Pagadas</p>
            <p className="text-3xl font-bold text-orange-400 mt-1">
              {cuotasPagadas.length}
            </p>
            </div>
      </div>

        {/* Progress Bar */}
        <div className="bg-zinc-900 p-4 rounded-lg border-2 border-zinc-800">
            <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-white">Resumen Visual del Período</span>
            <span className="text-sm text-zinc-400">Total: ${(cuotaMensual + gastosPorAnotar).toLocaleString()}</span>
            </div>
          <div className="relative h-6 bg-zinc-800 rounded-full overflow-hidden border-2 border-zinc-700">
              <div 
              className="absolute left-0 top-0 h-full bg-green-500/50 flex items-center justify-center text-white text-xs font-bold"
                style={{ width: `${Math.min((cuotaMensual / (cuotaMensual + gastosPorAnotar)) * 100, 100)}%` }}
              >
              {cuotaMensual > 0 && '30%'}
              </div>
              <div 
              className="absolute top-0 h-full bg-pink-500/50 flex items-center justify-center text-white text-xs font-bold"
                style={{ 
                  left: `${Math.min((cuotaMensual / (cuotaMensual + gastosPorAnotar)) * 100, 100)}%`,
                  width: `${Math.min((gastosPorAnotar / (cuotaMensual + gastosPorAnotar)) * 100, 100)}%` 
                }}
              >
              {gastosPorAnotar > 0 && 'Extras'}
            </div>
            </div>
          </div>

      <Tabs defaultValue="gastos-hija" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 h-auto bg-transparent p-0">
            <TabsTrigger value="gastos-hija">Gastos Hija</TabsTrigger>
            <TabsTrigger value="calculo">Cálculo</TabsTrigger>
            <TabsTrigger value="pagos">Pagos</TabsTrigger>
            <TabsTrigger value="comprobantes">Comprobantes</TabsTrigger>
            <TabsTrigger value="validacion">Validación</TabsTrigger>
            <TabsTrigger value="reportes">Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="gastos-hija" className="space-y-4">
            <div className="bg-zinc-900 p-4 rounded-lg border-2 border-zinc-800">
              <div className="flex flex-row items-center justify-between mb-4">
              <div>
                  <h3 className="text-lg font-bold text-white">Gastos con tu Hija</h3>
                  <p className="text-zinc-400 text-sm">Registro detallado de todos los gastos relacionados</p>
                </div>
                <NuevoGastoHijaModal onGastoCreado={handleGastoCreado} />
              </div>
              <div>
                    {gastosConHija.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500">No hay gastos registrados para este mes.</div>
                    ) : (
                        <div className="space-y-2">
                            {gastosConHija.map((gasto, index) => (
                      <div key={index} className="bg-zinc-800/50 p-3 rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-bold text-white">{gasto.Descripcion}</p>
                          <p className="text-xs text-zinc-400">{new Date(gasto.FechaTransaccion).toLocaleDateString()}</p>
                            </div>
                        <p className="font-bold text-lg text-pink-400">${gasto.Monto.toLocaleString()}</p>
                            </div>
                            ))}
                        </div>
                    )}
              </div>
            </div>
        </TabsContent>

        <TabsContent value="calculo" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Calculadora de Cuota Alimentaria</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold">Ingresos del Mes</h3>
                  <div>Total: ${ingresosMensuales.toLocaleString()}</div>
                  <div>Cuota (30%): ${cuotaMensual.toLocaleString()}</div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Gastos con tu Hija</h3>
                  <div>Total: ${totalGastosHija.toLocaleString()}</div>
                  <div>Por anotar (50%): ${gastosPorAnotar.toLocaleString()}</div>
                </div>
              </CardContent>
            </Card>
            <HistorialIngresosCuota selectedMonth={selectedMonth} selectedYear={selectedYear} />
          </div>
        </TabsContent>

        <TabsContent value="pagos" className="space-y-4">
           <GestionPagosCuota cuotaMensualCalculada={cuotaMensual} selectedMonth={selectedMonth} selectedYear={selectedYear} onPagoRegistrado={handleGastoCreado} />
        </TabsContent>

        <TabsContent value="comprobantes" className="space-y-4">
          <Card>
              <CardHeader><CardTitle>Gestión de Comprobantes</CardTitle></CardHeader>
              <CardContent><div className="text-center py-8">En desarrollo</div></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validacion" className="space-y-4">
              {/* <ValidadorCuotaAlimentaria ingresosMensuales={ingresosMensuales} gastosConHija={gastosConHija} cuotasPagadas={cuotasPagadas} selectedMonth={selectedMonth} selectedYear={selectedYear}/> */}
              <div className="p-4 text-center text-gray-400">Validador temporalmente deshabilitado</div>
        </TabsContent>

        <TabsContent value="reportes" className="space-y-4">
            <ExportadorCuotaAlimentaria data={{ ingresos: ingresosCuotaDetalle, gastos: gastosConHija, mes: meses[selectedMonth], anio: selectedYear, cuota: cuotaMensual }} />
        </TabsContent>

      </Tabs>
        </div>
    </div>
  );
}