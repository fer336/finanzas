import { describe, expect, it } from 'vitest';
import { UNCATEGORIZED_LABEL, buildCategoryChips, getPaymentCategory } from './pendingPaymentCategories';

describe('getPaymentCategory', () => {
  it('reads the category name from every backend alias', () => {
    expect(getPaymentCategory({ Categorias: { nombre: 'Colegio' } })).toBe('Colegio');
    expect(getPaymentCategory({ categorias1: { Nombre: 'Luz' } })).toBe('Luz');
    expect(getPaymentCategory({ categoria: { nombre: 'Seguros' } })).toBe('Seguros');
  });

  it('falls back to "Sin categoría" when the payment has no category', () => {
    expect(getPaymentCategory({})).toBe(UNCATEGORIZED_LABEL);
    expect(getPaymentCategory({ Categorias: {} })).toBe('Sin categoría');
  });
});

describe('buildCategoryChips', () => {
  it('returns one chip per category present, sorted by count and then by name', () => {
    const chips = buildCategoryChips([
      { categoria: 'Luz' },
      { categoria: 'Colegio' },
      { categoria: 'Agua' },
      { categoria: 'Colegio' },
    ]);

    expect(chips).toEqual([
      { key: 'Colegio', label: 'Colegio', count: 2 },
      { key: 'Agua', label: 'Agua', count: 1 },
      { key: 'Luz', label: 'Luz', count: 1 },
    ]);
  });

  it('groups payments without a category under "Sin categoría"', () => {
    expect(buildCategoryChips([{}, { categoria: '' }])).toEqual([
      { key: 'Sin categoría', label: 'Sin categoría', count: 2 },
    ]);
  });

  it('returns no chips for an empty list', () => {
    expect(buildCategoryChips([])).toEqual([]);
    expect(buildCategoryChips()).toEqual([]);
  });
});
