import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Por defecto inicia en tema light
  const [theme, setTheme] = useState(() => {
    // Intentar obtener el tema guardado del localStorage
    const savedTheme = localStorage.getItem('finance-theme');
    return savedTheme || 'light';
  });

  // Guardar el tema en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('finance-theme', theme);
    
    // Aplicar la clase del tema al documento
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    document.documentElement.dataset.theme = theme === 'dark' ? 'kanagawa-violet-dark' : 'kanagawa-violet-light';
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const value = {
    theme,
    toggleTheme,
    isLight: theme === 'light',
    isDark: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
