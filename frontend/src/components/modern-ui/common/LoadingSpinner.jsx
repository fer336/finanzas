import PropTypes from 'prop-types';

/**
 * LoadingSpinner — spinner de carga del tema "Papel" (fallback de Suspense /
 * queries todavía en curso). Un solo anillo sutil en vez del combo
 * spinner+pulso+puntos rebotando de antes — el pedido fue "más lindo pero
 * sutil, manteniendo el diseño nuevo".
 * `fullScreen=false` lo hace embebible dentro de una card/sección (sin
 * `min-h-screen`), para casos como ModernCategoriesView dentro de Ajustes.
 */
const LoadingSpinner = ({ message = 'Cargando…', fullScreen = true }) => {
  const content = (
    <div className="text-center">
      <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-[3px] border-[#e7e0cf] border-t-[#3d5a80]" />
      <p className="font-mono text-[11px] uppercase text-[#8a8677]" style={{ letterSpacing: '.14em' }}>
        {message}
      </p>
    </div>
  );

  if (!fullScreen) {
    return <div className="flex items-center justify-center py-14">{content}</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      {content}
    </div>
  );
};

LoadingSpinner.propTypes = {
  message: PropTypes.string,
  fullScreen: PropTypes.bool,
};

export default LoadingSpinner;
