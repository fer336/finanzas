import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, CreditCard, Clock, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import apiServices from '../services/api';

export function GestionPagosCuota({ 
  cuotaMensualCalculada, 
  selectedMonth, 
  selectedYear, 
  onPagoRegistrado 
}) {
  const [pagosRealizados, setPagosRealizados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);

  const [formPago, setFormPago] = useState({
    monto: '',
    moneda: 'ARS',
    metodoPago: '',
    fechaPago: new Date().toISOString().split('T')[0],
    comprobante: '',
    notas: ''
  });

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const [metodosPago, setMetodosPago] = useState([]);

  const cargarMetodosPago = async () => {
    try {
      const { metodosPagoApi } = apiServices;
      const response = await metodosPagoApi.getAll();
      setMetodosPago(response.list || []);
    } catch (error) {
      console.error('Error cargando métodos de pago:', error);
    }
  };

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const { transaccionesApi } = apiServices;
      const response = await transaccionesApi.getAll(1000, 0);
      const transacciones = response.list || [];

      // Filtrar pagos de cuota del mes seleccionado
      const pagosDelMes = transacciones.filter(t => {
        const fecha = new Date(t.FechaTransaccion);
        return (
          fecha.getMonth() === selectedMonth &&
          fecha.getFullYear() === selectedYear &&
          (
            t.Descripcion?.toLowerCase().includes('cuota alimentaria') ||
            t.Notas?.includes('[PAGO_CUOTA]')
          )
        );
      });

      setPagosRealizados(pagosDelMes);
    } catch (error) {
      console.error('Error cargando pagos:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    cargarDatos();
    cargarMetodosPago();
  }, [selectedMonth, selectedYear, cargarDatos]);

  const registrarPago = async () => {
    if (!formPago.monto || !formPago.metodoPago) {
      alert('Por favor completa los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      const { transaccionesApi } = apiServices;
      
      const nuevoPago = {
        Descripcion: `Cuota Alimentaria - ${meses[selectedMonth]} ${selectedYear}`,
        Monto: parseFloat(formPago.monto),
        Moneda: formPago.moneda,
        MontoArs: formPago.moneda === 'ARS' ? parseFloat(formPago.monto) : parseFloat(formPago.monto) * 1000,
        TasaCambio: formPago.moneda === 'ARS' ? 1 : 1000,
        Tipo: 'Gasto',
        FechaTransaccion: new Date(formPago.fechaPago),
        metodos_pago_id: formPago.metodoPago,
        Notas: `${formPago.notas} [PAGO_CUOTA]`,
        ArchivoAdjunto: formPago.comprobante || null,
        FechaCreacion: new Date(),
        FechaActualizacion: new Date()
      };

      const response = await transaccionesApi.create(nuevoPago);
      
      if (response) {
        // Resetear formulario
        setFormPago({
          monto: '',
          moneda: 'ARS',
          metodoPago: '',
          fechaPago: new Date().toISOString().split('T')[0],
          comprobante: '',
          notas: ''
        });
        
        setModalAbierto(false);
        cargarDatos(); // Recargar datos
        
        if (onPagoRegistrado) {
          onPagoRegistrado(response);
        }
      }
    } catch (error) {
      console.error('Error registrando pago:', error);
      alert('Error al registrar el pago');
    } finally {
      setLoading(false);
    }
  };

  const totalPagado = pagosRealizados.reduce((sum, pago) => sum + (pago.MontoArs || pago.Monto || 0), 0);
  const diferencia = totalPagado - cuotaMensualCalculada;
  const estadoPago = diferencia >= 0 ? 'completo' : diferencia > -cuotaMensualCalculada * 0.1 ? 'parcial' : 'pendiente';

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'completo': return 'text-green-400';
      case 'parcial': return 'text-yellow-400';
      case 'pendiente': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'completo': return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'parcial': return <Clock className="h-5 w-5 text-yellow-400" />;
      case 'pendiente': return <XCircle className="h-5 w-5 text-red-400" />;
      default: return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Resumen del estado de pago */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {getEstadoIcon(estadoPago)}
              Estado de Cuota - {meses[selectedMonth]} {selectedYear}
            </CardTitle>
            <CardDescription>
              Gestión de pagos de cuota alimentaria mensual
            </CardDescription>
          </div>
          <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Registrar Pago
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Registrar Pago de Cuota</DialogTitle>
                <DialogDescription>
                  Registra un pago de cuota alimentaria para {meses[selectedMonth]} {selectedYear}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="monto">Monto *</Label>
                    <Input
                      id="monto"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formPago.monto}
                      onChange={(e) => setFormPago(prev => ({ ...prev, monto: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="moneda">Moneda</Label>
                    <Select value={formPago.moneda} onValueChange={(value) => setFormPago(prev => ({ ...prev, moneda: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ARS">ARS</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metodoPago">Método de Pago *</Label>
                  <Select value={formPago.metodoPago} onValueChange={(value) => setFormPago(prev => ({ ...prev, metodoPago: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona método de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      {metodosPago.map((metodo, index) => (
                        <SelectItem key={metodo.id || metodo.Id || `metodo-${index}`} value={metodo.id || metodo.Id}>
                          {metodo.Nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fechaPago">Fecha de Pago</Label>
                  <Input
                    id="fechaPago"
                    type="date"
                    value={formPago.fechaPago}
                    onChange={(e) => setFormPago(prev => ({ ...prev, fechaPago: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notas">Notas</Label>
                  <Textarea
                    id="notas"
                    placeholder="Información adicional del pago..."
                    value={formPago.notas}
                    onChange={(e) => setFormPago(prev => ({ ...prev, notas: e.target.value }))}
                    rows={3}
                  />
                </div>

                {formPago.monto && cuotaMensualCalculada && (
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Resumen del Pago</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Cuota requerida:</span>
                        <span>${cuotaMensualCalculada.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monto a pagar:</span>
                        <span>${parseFloat(formPago.monto || 0).toLocaleString()} {formPago.moneda}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Diferencia:</span>
                        <span className={parseFloat(formPago.monto || 0) >= cuotaMensualCalculada ? 'text-green-600' : 'text-red-600'}>
                          ${Math.abs(parseFloat(formPago.monto || 0) - cuotaMensualCalculada).toLocaleString()}
                          {parseFloat(formPago.monto || 0) >= cuotaMensualCalculada ? ' (excedente)' : ' (faltante)'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setModalAbierto(false)}>
                  Cancelar
                </Button>
                <Button onClick={registrarPago} disabled={loading || !formPago.monto || !formPago.metodoPago}>
                  {loading ? 'Registrando...' : 'Registrar Pago'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Cuota Requerida</p>
              <p className="text-2xl font-bold">${cuotaMensualCalculada.toLocaleString()}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Pagado</p>
              <p className={`text-2xl font-bold ${getEstadoColor(estadoPago)}`}>
                ${totalPagado.toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Estado</p>
              <Badge variant={estadoPago === 'completo' ? 'default' : estadoPago === 'parcial' ? 'secondary' : 'destructive'}>
                {estadoPago === 'completo' ? 'Completo' : estadoPago === 'parcial' ? 'Parcial' : 'Pendiente'}
              </Badge>
              {diferencia !== 0 && (
                <p className={`text-sm ${diferencia > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {diferencia > 0 ? `+$${diferencia.toLocaleString()} excedente` : `$${Math.abs(diferencia).toLocaleString()} faltante`}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de pagos realizados */}
      {pagosRealizados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pagos Realizados</CardTitle>
            <CardDescription>
              Historial de pagos de cuota para este mes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pagosRealizados.map((pago, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="font-medium">{pago.Descripcion}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(pago.FechaTransaccion).toLocaleDateString()} • {pago.MetodosPago?.Nombre}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${(pago.MontoArs || pago.Monto).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{pago.Moneda}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="text-center py-4">
          <p className="text-muted-foreground">Cargando datos de pagos...</p>
        </div>
      )}
    </div>
  );
}