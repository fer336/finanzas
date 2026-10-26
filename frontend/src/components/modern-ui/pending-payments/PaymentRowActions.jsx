import PropTypes from 'prop-types';
import { Edit, Eye, Trash2 } from 'lucide-react';

const actionButtonClassName = 'inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

const PaymentRowActions = ({ entityName, entityType, onDocument, onEdit, onDelete }) => (
  <div className="flex items-center gap-1" aria-label={`Acciones de ${entityType} ${entityName}`}>
    <span data-action-slot="document" className="flex h-8 w-8 items-center justify-center">
      {onDocument && (
        <button
          type="button"
          onClick={onDocument}
          className={actionButtonClassName}
          title="Ver documento"
          aria-label={`Ver documento de ${entityName}`}
        >
          <Eye className="h-4 w-4" />
        </button>
      )}
    </span>
    <span data-action-slot="edit" className="flex h-8 w-8 items-center justify-center">
      <button
        type="button"
        onClick={onEdit}
        className={actionButtonClassName}
        title="Editar"
        aria-label={`Editar ${entityType} ${entityName}`}
      >
        <Edit className="h-4 w-4" />
      </button>
    </span>
    <span data-action-slot="delete" className="flex h-8 w-8 items-center justify-center">
      <button
        type="button"
        onClick={onDelete}
        className={`${actionButtonClassName} hover:text-destructive`}
        title="Eliminar"
        aria-label={`Eliminar ${entityType} ${entityName}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </span>
  </div>
);

PaymentRowActions.propTypes = {
  entityName: PropTypes.string.isRequired,
  entityType: PropTypes.string.isRequired,
  onDocument: PropTypes.func,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default PaymentRowActions;
