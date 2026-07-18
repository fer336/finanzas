import PropTypes from 'prop-types';

/**
 * LoadingSpinner — spinner de carga del tema "Kanagawa" (fallback de Suspense /
 * queries todavía en curso). Un solo anillo sutil en vez del combo
 * spinner+pulso+puntos rebotando de antes — el pedido fue "más lindo pero
 * sutil, manteniendo el diseño nuevo".
 * `fullScreen=false` lo hace embebible dentro de una card/sección (sin
 * `min-h-screen`), para casos como ModernCategoriesView dentro de Ajustes.
 */
const LoadingSpinner = ({ message = 'Cargando…', fullScreen = true }) => {
  const content = (
    <div className="text-center">
      <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-[3px] border-[#d5cea3] dark:border-[#363646] border-t-[#4d699b] dark:border-t-[#7c9cc9]" />
      <p className="font-mono text-[11px] uppercase text-[#625f55] dark:text-[#c8c093]" style={{ letterSpacing: '.14em' }}>
        {message}
      </p>
    </div>
  );

  if (!fullScreen) {
    return <div className="flex items-center justify-center py-14">{content}</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      {content}
    </div>
  );
};

LoadingSpinner.propTypes = {
  message: PropTypes.string,
  fullScreen: PropTypes.bool,
};

export default LoadingSpinner;
