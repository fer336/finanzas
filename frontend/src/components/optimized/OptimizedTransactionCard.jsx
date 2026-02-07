/**
 * Optimized Transaction Card Component
 * Uses React.memo to prevent unnecessary re-renders
 * Example of performance optimization best practices
 */
import React, { memo, useMemo } from 'react';
import { formatCurrency, formatDate } from '../../utils/formatters';

const TransactionCard = ({ 
  transaction, 
  onEdit, 
  onDelete,
  showCategory = true,
  showPaymentMethod = true 
}) => {
  // Memoize expensive calculations
  const formattedAmount = useMemo(() => {
    return formatCurrency(transaction.monto_ars || transaction.Monto);
  }, [transaction.monto_ars, transaction.Monto]);

  const formattedDate = useMemo(() => {
    return formatDate(transaction.fecha_transaccion || transaction.FechaTransaccion);
  }, [transaction.fecha_transaccion, transaction.FechaTransaccion]);

  const amountColorClass = useMemo(() => {
    const amount = transaction.monto_ars || transaction.Monto;
    if (amount < 0) return 'text-red-400';
    if (amount > 0) return 'text-green-400';
    return 'text-gray-400';
  }, [transaction.monto_ars, transaction.Monto]);

  // Extract common data
  const categoryName = transaction.categoria?.nombre || transaction.Categorias?.Nombre || 'Sin categoría';
  const paymentMethodName = transaction.metodo_pago?.nombre || transaction.MetodoPago?.Nombre || 'Sin método';
  const description = transaction.descripcion || transaction.Descripcion || '';

  return (
    <div className="bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-all group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Description */}
          <h3 className="text-white font-medium truncate">
            {description}
          </h3>

          {/* Metadata */}
          <div className="flex flex-wrap gap-2 mt-2 text-sm text-gray-400">
            {showCategory && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                {categoryName}
              </span>
            )}
            {showPaymentMethod && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                {paymentMethodName}
              </span>
            )}
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Amount */}
        <div className="flex flex-col items-end gap-2">
          <span className={`text-lg font-bold ${amountColorClass}`}>
            {formattedAmount}
          </span>

          {/* Actions - Only visible on hover */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <button
              onClick={() => onEdit?.(transaction)}
              className="text-xs px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded transition-colors"
              aria-label="Editar transacción"
            >
              Editar
            </button>
            <button
              onClick={() => onDelete?.(transaction)}
              className="text-xs px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded transition-colors"
              aria-label="Eliminar transacción"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Custom comparison function for React.memo
 * Only re-render if these props change
 */
const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.transaction.id === nextProps.transaction.id &&
    prevProps.transaction.monto_ars === nextProps.transaction.monto_ars &&
    prevProps.transaction.descripcion === nextProps.transaction.descripcion &&
    prevProps.showCategory === nextProps.showCategory &&
    prevProps.showPaymentMethod === nextProps.showPaymentMethod
  );
};

// Export memoized version
export const OptimizedTransactionCard = memo(TransactionCard, areEqual);

export default OptimizedTransactionCard;

