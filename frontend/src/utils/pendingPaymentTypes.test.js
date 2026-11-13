import { describe, expect, it } from 'vitest';
import {
  PAYMENT_TYPES,
  countByPaymentType,
  getPaymentType,
  normalizePaymentType,
} from './pendingPaymentTypes';

describe('pendingPaymentTypes', () => {
  it('exposes the five payment types in display order', () => {
    expect(PAYMENT_TYPES.map((t) => t.value)).toEqual([
      'servicio',
      'colegio',
      'actividad',
      'seguro',
      'otro',
    ]);
  });

  it('keeps new slugs regardless of case and spacing', () => {
    expect(normalizePaymentType('colegio')).toBe('colegio');
    expect(normalizePaymentType('  Actividad ')).toBe('actividad');
    expect(normalizePaymentType('SEGURO')).toBe('seguro');
  });

  it('maps legacy values: factura is a servicio, alquiler and unknown are otro', () => {
    expect(normalizePaymentType('factura')).toBe('servicio');
    expect(normalizePaymentType('Servicio')).toBe('servicio');
    expect(normalizePaymentType('alquiler')).toBe('otro');
    expect(normalizePaymentType('prestamo')).toBe('otro');
    expect(normalizePaymentType('')).toBe('otro');
    expect(normalizePaymentType(null)).toBe('otro');
    expect(normalizePaymentType(undefined)).toBe('otro');
  });

  it('reads the type from either casing of the API field', () => {
    expect(getPaymentType({ tipo: 'seguro' }).value).toBe('seguro');
    expect(getPaymentType({ Tipo: 'colegio' }).value).toBe('colegio');
    expect(getPaymentType({}).value).toBe('otro');
  });

  it('counts payments per type, with every type present', () => {
    const counts = countByPaymentType([
      { tipo: 'factura' },
      { tipo: 'servicio' },
      { Tipo: 'actividad' },
      { tipo: 'rara' },
    ]);
    expect(counts).toEqual({ servicio: 2, colegio: 0, actividad: 1, seguro: 0, otro: 1 });
  });
});
