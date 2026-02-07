// Configuración de temas dinámicos para el sistema
export const themes = {
  // Tema principal basado en el diseño proporcionado
  primary: {
    name: 'Primary Dark Theme',
    colors: {
      // Fondos principales
      '--bg-dark': '#111827',
      '--card-dark': '#1F2937',
      '--surface-hover': 'rgba(255, 255, 255, 0.1)',

      // Textos
      '--text-main': '#F9FAFB',
      '--text-secondary': '#9CA3AF',
      '--text-muted': '#6B7280',

      // Colores de acento
      '--green-light': '#6EE7B7',
      '--green-dark': '#10B981',
      '--green-muted': 'rgba(110, 231, 183, 0.1)',

      // Estados y badges
      '--success-bg': '#065F46',
      '--success-text': '#A7F3D0',
      '--error-bg': '#7F1D1D',
      '--error-text': '#FCA5A5',
      '--warning-bg': '#78350F',
      '--warning-text': '#FDE68A',
      '--info-bg': '#1E3A8A',
      '--info-text': '#93C5FD',

      // Bordes y separadores
      '--border-color': '#374151',
      '--border-light': '#4B5563',

      // Shadows
      '--shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',

      // Chart colors
      '--chart-income': '#6EE7B7',
      '--chart-expense': '#F87171',
      '--chart-grid': 'rgba(255, 255, 255, 0.1)',
    }
  },
  
  // Tema alternativo (azul)
  blue: {
    name: 'Blue Theme',
    colors: {
      '--bg-dark': '#0F172A',
      '--card-dark': '#1E293B',
      '--surface-hover': 'rgba(255, 255, 255, 0.1)',
      
      '--text-main': '#F1F5F9',
      '--text-secondary': '#94A3B8',
      '--text-muted': '#64748B',
      
      '--green-light': '#60A5FA',
      '--green-dark': '#2563EB',
      '--green-muted': 'rgba(96, 165, 250, 0.1)',
      
      '--success-bg': '#14532D',
      '--success-text': '#BBF7D0',
      '--error-bg': '#7F1D1D',
      '--error-text': '#FCA5A5',
      '--warning-bg': '#78350F',
      '--warning-text': '#FDE68A',
      '--info-bg': '#1E3A8A',
      '--info-text': '#93C5FD',
      
      '--border-color': '#334155',
      '--border-light': '#475569',
      
      '--shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      
      '--chart-income': '#60A5FA',
      '--chart-expense': '#F87171',
      '--chart-grid': 'rgba(255, 255, 255, 0.1)',
    }
  },
  
  // Tema púrpura
  purple: {
    name: 'Purple Theme',
    colors: {
      '--bg-dark': '#1A0B2E',
      '--card-dark': '#2D1B69',
      '--surface-hover': 'rgba(255, 255, 255, 0.1)',
      
      '--text-main': '#F8FAFC',
      '--text-secondary': '#A78BFA',
      '--text-muted': '#8B5CF6',
      
      '--green-light': '#C4B5FD',
      '--green-dark': '#8B5CF6',
      '--green-muted': 'rgba(196, 181, 253, 0.1)',
      
      '--success-bg': '#14532D',
      '--success-text': '#BBF7D0',
      '--error-bg': '#7F1D1D',
      '--error-text': '#FCA5A5',
      '--warning-bg': '#78350F',
      '--warning-text': '#FDE68A',
      '--info-bg': '#553C9A',
      '--info-text': '#DDD6FE',
      
      '--border-color': '#4C1D95',
      '--border-light': '#5B21B6',
      
      '--shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      
      '--chart-income': '#C4B5FD',
      '--chart-expense': '#F87171',
      '--chart-grid': 'rgba(255, 255, 255, 0.1)',
    }
  }
};

// Función para aplicar un tema
export const applyTheme = (themeName) => {
  const theme = themes[themeName];
  if (!theme) {
    console.error(`Theme "${themeName}" not found`);
    return;
  }
  
  const root = document.documentElement;
  
  // Aplicar todas las variables CSS del tema
  Object.entries(theme.colors).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
  
  // Guardar el tema actual en localStorage
  localStorage.setItem('selectedTheme', themeName);
  
  // Disparar evento personalizado para que los componentes se actualicen
  window.dispatchEvent(new CustomEvent('themeChanged', { 
    detail: { themeName, theme } 
  }));
};

// Función para obtener el tema actual
export const getCurrentTheme = () => {
  return localStorage.getItem('selectedTheme') || 'primary';
};

// Función para inicializar el tema
export const initializeTheme = () => {
  const savedTheme = getCurrentTheme();
  applyTheme(savedTheme);
};

// Hook personalizado para React se encuentra en ThemeProvider.jsx
// Esta función está aquí solo como referencia - no usar directamente

export default themes;