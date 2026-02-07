import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, CheckCircle, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import apiServices from '../services/api';

export function HistorialIngresosCuota({ selectedMonth, selectedYear }) {
  const [ingresosCuota, setIngresosCuota] = useState([]);
  const [loading, setLoading] = useState(false);

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const cargarIngresosCuota = useCallback(async () => {
    setLoading(true);
    try {
      const { transaccionesApi } = apiServices;
      
      // Calcular fechas del mes seleccionado
      const fechaInicio = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0];
      const fechaFin = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0];
      
      // Usar el nuevo endpoint de cuota alimentaria
      const resultadoCuota = await transaccionesApi.getCuotaAlimentaria(fechaInicio, fechaFin);
      const ingresosCuota = resultadoCuota.ingresosCuota || [];
      
      console.log('📥 Historial - Resultado completo:', resultadoCuota);
      console.log('📥 Historial - Ingresos cuota array:', ingresosCuota);
      
      setIngresosCuota(ingresosCuota);
    } catch (error) {
      console.error('Error cargando ingresos de cuota:', error);
      // En caso de error, intentar con el método anterior como fallback
      try {
        const { transaccionesApi: fallbackApi } = apiServices;
        const response = await fallbackApi.getAll(1000, 0);
        const transacciones = response.list || [];

        // Filtrar ingresos del mes que están marcados para cuota alimentaria
        const ingresosDelMes = transacciones.filter(t => {
          const fecha = new Date(t.FechaTransaccion);
          return (
            fecha.getMonth() === selectedMonth &&
            fecha.getFullYear() === selectedYear &&
            t.Tipo?.toLowerCase() === 'ingreso' &&
            (t.Notas?.includes('[CUOTA_ALIMENTARIA]') || 
             t.IncluirEnCuotaAlimentaria === true || 
             t.Etiquetas?.IncluirEnCuotaAlimentaria === true)
          );
        });

        setIngresosCuota(ingresosDelMes);
      } catch (fallbackError) {
        console.error('Error en fallback:', fallbackError);
        setIngresosCuota([]);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    cargarIngresosCuota();
  }, [selectedMonth, selectedYear, cargarIngresosCuota]);

  // Usar los campos calculados del backend si están disponibles
  const totalIngresos = ingresosCuota.reduce((sum, ingreso) => {
    return sum + (ingreso.MontoOriginal || ingreso.MontoArs || ingreso.Monto || 0);
  }, 0);
  
  const cuotaCalculada = ingresosCuota.reduce((sum, ingreso) => {
    return sum + (ingreso.CuotaAlimentaria30Porciento || ((ingreso.MontoOriginal || ingreso.MontoArs || ingreso.Monto || 0) * 0.30));
  }, 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-muted-foreground">Cargando ingresos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-400" />
          Ingresos para Cuota - {meses[selectedMonth]} {selectedYear}
        </CardTitle>
        <CardDescription>
          Ingresos marcados para el cálculo de cuota alimentaria
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-green-950/20 rounded-lg border border-green-500/20">
          <div className="text-center">
            <p className="text-sm text-green-300">Total Ingresos</p>
            <p className="text-base sm:text-lg font-bold text-green-200 break-words">${totalIngresos.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-blue-300">Cuota Calculada (30%)</p>
            <p className="text-base sm:text-lg font-bold text-blue-200 break-words">${cuotaCalculada.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-300">Cantidad</p>
            <p className="text-base sm:text-lg font-bold text-gray-200">{ingresosCuota.length}</p>
          </div>
        </div>

        {/* Lista de ingresos */}
        {ingresosCuota.length === 0 ? (
          <div className="text-center py-8">
            <Info className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No hay ingresos marcados para cuota alimentaria este mes</p>
            <p className="text-sm text-muted-foreground mt-2">
              Marca tus ingresos con "Incluir en cuota alimentaria" al crearlos
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground">DETALLE DE INGRESOS</h4>
            {ingresosCuota.map((ingreso, index) => {
              // Usar los campos calculados del backend si están disponibles
              const montoOriginal = ingreso.MontoOriginal || ingreso.MontoArs || ingreso.Monto || 0;
              const cuotaIndividual = ingreso.CuotaAlimentaria30Porciento || (montoOriginal * 0.30);
              
              return (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">{ingreso.Descripcion}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {ingreso.Categorias?.Nombre || 'Sin categoría'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(ingreso.FechaTransaccion).toLocaleDateString()}
                        </span>
                        {ingreso.Notas && (
                          <span className="text-xs text-muted-foreground">
                            💬 {ingreso.Notas}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-lg">
                      ${montoOriginal.toLocaleString()}
                    </p>
                    <p className="text-sm text-blue-600">
                      Cuota: ${cuotaIndividual.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">{ingreso.Moneda}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Información adicional */}
        {ingresosCuota.length > 0 && (
          <div className="p-4 bg-blue-950/20 rounded-lg border border-blue-500/20">
            <h4 className="font-semibold mb-2 text-blue-200">Información de Cálculo</h4>
            <div className="space-y-1 text-sm text-blue-300">
              <p>• Se aplica el 30% sobre cada ingreso marcado para cuota alimentaria</p>
              <p>• Los ingresos se identifican con la etiqueta [CUOTA_ALIMENTARIA] en las notas</p>
              <p>• El cálculo se actualiza automáticamente al agregar nuevos ingresos</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}