import React, { createContext, useContext, useEffect, useState } from 'react';
import { themes, applyTheme, getCurrentTheme, initializeTheme } from '../themes/theme-config';

const ThemeContext = createContext({
  currentTheme: 'primary',
  themes: [],
  changeTheme: () => {},
  themeConfig: null
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(getCurrentTheme());

  useEffect(() => {
    // Inicializar tema al montar el componente
    initializeTheme();

    // Escuchar cambios de tema
    const handleThemeChange = (event) => {
      setCurrentTheme(event.detail.themeName);
    };

    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  const changeTheme = (themeName) => {
    if (themes[themeName]) {
      applyTheme(themeName);
      setCurrentTheme(themeName);
    }
  };

  const value = {
    currentTheme,
    themes: Object.keys(themes),
    themesList: Object.entries(themes).map(([key, theme]) => ({
      key,
      name: theme.name,
      ...theme
    })),
    changeTheme,
    themeConfig: themes[currentTheme]
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;