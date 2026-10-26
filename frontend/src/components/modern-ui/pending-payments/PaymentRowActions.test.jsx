import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PaymentRowActions from './PaymentRowActions';

afterEach(cleanup);

describe('PaymentRowActions', () => {
  it('keeps document, edit, and delete slots stable when no document exists', () => {
    render(
      <PaymentRowActions
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        editLabel="Editar préstamo de Ana"
        deleteLabel="Eliminar préstamo de Ana"
      />,
    );

    const actions = screen.getByTestId('payment-row-actions');
    expect(actions.children).toHaveLength(3);
    expect(actions.children[0]).toHaveAttribute('data-action-slot', 'document');
    expect(actions.children[0]).toHaveAttribute('aria-hidden', 'true');
    expect(actions.children[0].querySelector('button')).toBeNull();
    expect(actions.children[1]).toHaveAttribute('data-action-slot', 'edit');
    expect(actions.children[2]).toHaveAttribute('data-action-slot', 'delete');
  });

  it('renders visible, named, focusable document, edit, and delete controls in order', () => {
    const onDocument = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <PaymentRowActions
        onDocument={onDocument}
        onEdit={onEdit}
        onDelete={onDelete}
        documentLabel="Ver recibo de Ana"
        editLabel="Editar préstamo de Ana"
        deleteLabel="Eliminar préstamo de Ana"
      />,
    );

    const actions = screen.getByTestId('payment-row-actions');
    expect([...actions.querySelectorAll('button')].map((button) => button.getAttribute('aria-label'))).toEqual([
      'Ver recibo de Ana',
      'Editar préstamo de Ana',
      'Eliminar préstamo de Ana',
    ]);
    expect(screen.getByRole('button', { name: 'Ver recibo de Ana' }).className).toContain('focus:ring-2');

    fireEvent.click(screen.getByRole('button', { name: 'Ver recibo de Ana' }));
    fireEvent.click(screen.getByRole('button', { name: 'Editar préstamo de Ana' }));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar préstamo de Ana' }));

    expect(onDocument).toHaveBeenCalledOnce();
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
