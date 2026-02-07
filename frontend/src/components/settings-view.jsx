import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { 
  Settings, 
  CreditCard, 
  Tag,
  ArrowLeft
} from 'lucide-react';
import { PaymentMethodsView } from './payment-methods-view';
import { CategoriesView } from './categories-view';

export function SettingsView() {
  const [currentSection, setCurrentSection] = useState('main');

  const renderMainView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Configuración</h1>
          <p className="text-sm sm:text-base text-gray-400">Gestiona los métodos de pago y categorías del sistema</p>
        </div>
      </div>

      {/* Secciones de configuración */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Métodos de Pago */}
        <Card 
          className="border-gray-800/50 backdrop-blur-sm cursor-pointer hover:border-blue-400/50 transition-all duration-200"
          style={{ backgroundColor: 'hsl(0, 0%, 9%)' }}
          onClick={() => setCurrentSection('payment-methods')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <div className="p-2 rounded-lg bg-blue-400/10 border border-blue-400/20">
                <CreditCard className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <div className="text-lg font-semibold">Métodos de Pago</div>
                <div className="text-sm text-gray-400 font-normal">
                  Gestiona efectivo, tarjetas, transferencias
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-gray-300 text-sm">
                Administra los métodos de pago disponibles para registrar tus transacciones e ingresos.
              </p>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  Configura efectivo, tarjetas, transferencias y más
                </div>
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSection('payment-methods');
                  }}
                >
                  Gestionar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categorías */}
        <Card 
          className="border-gray-800/50 backdrop-blur-sm cursor-pointer hover:border-green-400/50 transition-all duration-200"
          style={{ backgroundColor: 'hsl(0, 0%, 9%)' }}
          onClick={() => setCurrentSection('categories')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <div className="p-2 rounded-lg bg-green-400/10 border border-green-400/20">
                <Tag className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <div className="text-lg font-semibold">Categorías</div>
                <div className="text-sm text-gray-400 font-normal">
                  Organiza ingresos y gastos por categoría
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-gray-300 text-sm">
                Crea y administra categorías para clasificar tus ingresos y gastos de manera organizada.
              </p>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  Alimentación, salarios, servicios, entretenimiento
                </div>
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSection('categories');
                  }}
                >
                  Gestionar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información adicional */}
      <Card className="border-gray-800/50 backdrop-blur-sm" style={{ backgroundColor: 'hsl(0, 0%, 9%)' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Settings className="h-5 w-5 text-gray-400" />
            Información del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-white mb-2">Métodos de Pago</h4>
              <ul className="space-y-1 text-gray-400">
                <li>• Efectivo, tarjetas de crédito/débito</li>
                <li>• Transferencias bancarias</li>
                <li>• Cheques y otros métodos</li>
                <li>• Estados activo/inactivo</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">Categorías</h4>
              <ul className="space-y-1 text-gray-400">
                <li>• Categorías para ingresos y gastos</li>
                <li>• Colores personalizables</li>
                <li>• Iconos y descripciones</li>
                <li>• Control de visibilidad</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSectionView = () => {
    switch (currentSection) {
      case 'payment-methods':
        return <PaymentMethodsView />;
      case 'categories':
        return <CategoriesView />;
      default:
        return renderMainView();
    }
  };

  return (
    <div className="space-y-6">
      {/* Navegación interna */}
      {currentSection !== 'main' && (
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentSection('main')}
            className="text-gray-400 hover:text-white hover:bg-gray-800/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Configuración
          </Button>
        </div>
      )}

      {/* Contenido de la sección */}
      {renderSectionView()}
    </div>
  );
}