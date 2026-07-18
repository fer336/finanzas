import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import {
  PENDING_PAYMENT_STATUS,
  buildRecurringPendingPaymentDates,
  derivePendingPaymentStatus,
  formatLocalDateOnly,
  getEffectiveOverdueDate,
  normalizePendingPaymentDueDates,
  parseLocalDateOnly,
  validateSecondDueDateAfterFirst,
} from './pendingPaymentStatus';

describe('pending payment date-only status helpers', () => {
  it('does not shift date-only parsing across representative timezones', () => {
    const moduleUrl = pathToFileURL(`${process.cwd()}/src/utils/pendingPaymentStatus.js`).href;
    for (const timezone of ['America/Argentina/Buenos_Aires', 'America/Los_Angeles', 'Pacific/Kiritimati']) {
      const output = execFileSync(
        process.execPath,
        [
          '--input-type=module',
          '--eval',
          `import { parseLocalDateOnly, formatLocalDateOnly } from ${JSON.stringify(moduleUrl)}; const d = parseLocalDateOnly('2026-07-01'); console.log([d.getFullYear(), d.getMonth() + 1, d.getDate(), formatLocalDateOnly(d)].join('|'));`,
        ],
        { env: { ...process.env, TZ: timezone }, encoding: 'utf8' },
      ).trim();

      expect(output).toBe('2026|7|1|2026-07-01');
    }
  });

  it('parses YYYY-MM-DD as a local calendar date without UTC shifting', () => {
    const parsed = parseLocalDateOnly('2026-07-01');

    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(6);
    expect(parsed.getDate()).toBe(1);
    expect(formatLocalDateOnly(parsed)).toBe('2026-07-01');
  });

  it('normalizes first and second due date aliases', () => {
    expect(normalizePendingPaymentDueDates({
      FechaVencimiento: '2026-07-10',
      SegundaFechaVencimiento: '2026-07-15T00:00:00',
    })).toEqual({ firstDueDate: '2026-07-10', secondDueDate: '2026-07-15' });

    expect(normalizePendingPaymentDueDates({
      fechavencimiento: '2026-07-10',
      fecha_segundo_vencimiento: '2026-07-20',
    })).toEqual({ firstDueDate: '2026-07-10', secondDueDate: '2026-07-20' });
  });

  it('keeps due today pending', () => {
    expect(derivePendingPaymentStatus(
      { fechavencimiento: '2026-07-15', estado: 'pendiente' },
      new Date(2026, 6, 15, 12),
    )).toBe(PENDING_PAYMENT_STATUS.PENDING);
  });

  it('classifies first passed and second today as en_mora', () => {
    expect(derivePendingPaymentStatus(
      { fechavencimiento: '2026-07-10', segunda_fecha_vencimiento: '2026-07-15' },
      new Date(2026, 6, 15, 12),
    )).toBe(PENDING_PAYMENT_STATUS.IN_ARREARS);
  });

  it('classifies second passed as vencido', () => {
    expect(derivePendingPaymentStatus(
      { fechavencimiento: '2026-07-10', segunda_fecha_vencimiento: '2026-07-14' },
      new Date(2026, 6, 15, 12),
    )).toBe(PENDING_PAYMENT_STATUS.OVERDUE);
  });

  it('classifies no second date and first passed as vencido', () => {
    expect(derivePendingPaymentStatus(
      { fechavencimiento: '2026-07-10' },
      new Date(2026, 6, 15, 12),
    )).toBe(PENDING_PAYMENT_STATUS.OVERDUE);
  });

  it('paid always wins over temporal status', () => {
    expect(derivePendingPaymentStatus(
      { fechavencimiento: '2026-07-01', segunda_fecha_vencimiento: '2026-07-02', estado: 'pagado' },
      new Date(2026, 6, 15, 12),
    )).toBe(PENDING_PAYMENT_STATUS.PAID);
  });

  it('returns the second date as effective overdue date when present', () => {
    expect(getEffectiveOverdueDate({
      fechavencimiento: '2026-07-10',
      segunda_fecha_vencimiento: '2026-07-20',
    })).toBe('2026-07-20');
  });

  it('validates second due date strictly after first due date', () => {
    expect(validateSecondDueDateAfterFirst('2026-07-10', '2026-07-11')).toBe(true);
    expect(validateSecondDueDateAfterFirst('2026-07-10', '2026-07-10')).toBe(false);
    expect(validateSecondDueDateAfterFirst('2026-07-10', '2026-07-09')).toBe(false);
  });

  it('preserves recurrence offset and clamps month-end safely', () => {
    expect(buildRecurringPendingPaymentDates('2026-01-31', '2026-02-05', 'mensual')).toEqual({
      fechavencimiento: '2026-02-28',
      segunda_fecha_vencimiento: '2026-03-05',
    });
  });

  it('keeps generated recurrence second date null when source has no second date', () => {
    expect(buildRecurringPendingPaymentDates('2026-01-31', null, 'mensual')).toEqual({
      fechavencimiento: '2026-02-28',
      segunda_fecha_vencimiento: null,
    });
  });
});
