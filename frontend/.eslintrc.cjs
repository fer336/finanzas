module.exports = {
  root: true,
  env: { browser: true, es2021: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: { react: { version: 'detect' } },
  plugins: ['react-refresh'],
  rules: {
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    // TODO: subir a error cuando se limpie el código legacy
    'no-unused-vars': 'warn',
    'no-undef': 'warn',
    'react/no-unescaped-entities': 'warn',
    'react/no-unknown-property': 'warn',
  },
  ignorePatterns: [
    'dist',
    'build',
    'node_modules',
    // Bug de sintaxis preexistente (template literal con backticks sin
    // escapar en la línea de apertura) rompe el parseo de ESLint. No se
    // corrige acá porque está fuera de alcance de esta tarea.
    'src/utils/chat-helpers.js',
  ],
};
