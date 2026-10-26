import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PaymentRowActions from './PaymentRowActions';

afterEach(cleanup);

describe('PaymentRowActions', () => {
  it('keeps document, edit, and delete slots in a fixed order when no document exists', () => {
    render(
      <PaymentRowActions
        entityName="Seguro"
        entityType="vencimiento"
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const actions = screen.getByLabelText('Acciones de vencimiento Seguro');
    expect(actions.children).toHaveLength(3);
    expect(actions.children[0]).toHaveAttribute('data-action-slot', 'document');
    expect(actions.children[0].querySelector('button')).toBeNull();
    expect(actions.children[1]).toHaveAttribute('data-action-slot', 'edit');
    expect(actions.children[2]).toHaveAttribute('data-action-slot', 'delete');
    expect(screen.queryByRole('button', { name: /ver documento/i })).not.toBeInTheDocument();
  });

  it('renders visible labelled controls in document, edit, and delete order', () => {
    const onDocument = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <PaymentRowActions
        entityName="Seguro"
        entityType="vencimiento"
        onDocument={onDocument}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    const actions = screen.getByLabelText('Acciones de vencimiento Seguro');
    expect([...actions.querySelectorAll('button')].map((button) => button.getAttribute('aria-label'))).toEqual([
      'Ver documento de Seguro',
      'Editar vencimiento Seguro',
      'Eliminar vencimiento Seguro',
    ]);
    expect(actions.className).not.toContain('opacity-0');
    expect(screen.getByRole('button', { name: 'Editar vencimiento Seguro' }).className).toContain('focus:ring-2');

    fireEvent.click(screen.getByRole('button', { name: 'Ver documento de Seguro' }));
    fireEvent.click(screen.getByRole('button', { name: 'Editar vencimiento Seguro' }));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar vencimiento Seguro' }));

    expect(onDocument).toHaveBeenCalledOnce();
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
