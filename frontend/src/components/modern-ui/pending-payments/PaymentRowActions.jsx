import PropTypes from 'prop-types';
import { Edit, Eye, Trash2 } from 'lucide-react';

const actionClassName = 'inline-flex items-center justify-center rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

const PaymentRowActions = ({
  onDocument,
  onEdit,
  onDelete,
  documentLabel = 'Ver documento',
  editLabel = 'Editar',
  deleteLabel = 'Eliminar',
}) => (
  <div data-testid="payment-row-actions" className="flex items-center gap-1">
    <span data-action-slot="document" className="inline-flex h-7 w-7" aria-hidden={!onDocument}>
      {onDocument && (
        <button type="button" onClick={onDocument} className={actionClassName} title={documentLabel} aria-label={documentLabel}>
          <Eye className="h-4 w-4" />
        </button>
      )}
    </span>
    <span data-action-slot="edit" className="inline-flex h-7 w-7">
      <button type="button" onClick={onEdit} className={actionClassName} title={editLabel} aria-label={editLabel}>
        <Edit className="h-4 w-4" />
      </button>
    </span>
    <span data-action-slot="delete" className="inline-flex h-7 w-7">
      <button type="button" onClick={onDelete} className={`${actionClassName} hover:text-destructive`} title={deleteLabel} aria-label={deleteLabel}>
        <Trash2 className="h-4 w-4" />
      </button>
    </span>
  </div>
);

PaymentRowActions.propTypes = {
  onDocument: PropTypes.func,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  documentLabel: PropTypes.string,
  editLabel: PropTypes.string,
  deleteLabel: PropTypes.string,
};

export default PaymentRowActions;
