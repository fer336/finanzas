import React from 'react';
import { useAuth } from './auth-provider';
import { LoginButton } from './login-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Shield } from 'lucide-react';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
              <Shield className="h-6 w-6 text-blue-400" />
            </div>
            <CardTitle className="text-xl text-white">Sistema de Gastos</CardTitle>
            <CardDescription className="text-gray-400">
              Inicia sesión para acceder a tu panel de control
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <LoginButton className="w-full" />
            <p className="mt-4 text-xs text-gray-500">
              Solo usuarios autorizados pueden acceder al sistema
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return children;
}