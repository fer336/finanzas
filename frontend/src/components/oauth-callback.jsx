import { useEffect } from 'react';

export function OAuthCallback({ onLogin }) {
  useEffect(() => {
    const handleCallback = async () => {
      // Obtener los parámetros de la URL
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        // Redirigir de vuelta al login con error
        window.location.href = '/login?error=' + encodeURIComponent(error);
        return;
      }

      if (code) {
        try {
          // Enviar el código al backend para intercambiar por tokens
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/auth/google/callback`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code, state }),
          });

          if (response.ok) {
            const userData = await response.json();
            
            // Llamar a la función onLogin con los datos del usuario
            onLogin(userData.email, {
              name: userData.name,
              picture: userData.picture,
              provider: 'google'
            });
          } else {
            throw new Error('Error en el callback de OAuth');
          }
        } catch (error) {
          console.error('Error processing OAuth callback:', error);
          window.location.href = '/login?error=callback_error';
        }
      } else {
        // No hay código, redirigir al login
        window.location.href = '/login';
      }
    };

    handleCallback();
  }, [onLogin]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg">Completando autenticación...</p>
        <p className="text-gray-400 text-sm mt-2">Por favor espera un momento</p>
      </div>
    </div>
  );
}