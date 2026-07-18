const SECOND_DUE_DATE_ALIASES = [
  'segunda_fecha_vencimiento',
  'segundaFechaVencimiento',
  'SegundaFechaVencimiento',
  'fecha_segundo_vencimiento',
  'fechasegundovencimiento',
];

const FIRST_DUE_DATE_ALIASES = [
  'fechavencimiento',
  'fecha_vencimiento',
  'FechaVencimiento',
  'Fechavencimiento',
  'fechaVencimiento',
];

export const PENDING_PAYMENT_STATUS = {
  PENDING: 'pendiente',
  IN_ARREARS: 'en_mora',
  OVERDUE: 'vencido',
  PAID: 'pagado',
};

export function parseLocalDateOnly(value) {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const text = String(value).trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year
    || parsed.getMonth() !== month - 1
    || parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

export function formatLocalDateOnly(value) {
  const date = parseLocalDateOnly(value);
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatLocalDateDisplay(value, locale = 'es-AR', options = undefined) {
  const date = parseLocalDateOnly(value);
  return date ? date.toLocaleDateString(locale, options) : '';
}

export function compareLocalDateOnly(a, b) {
  const dateA = parseLocalDateOnly(a);
  const dateB = parseLocalDateOnly(b);
  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;
  return dateA.getTime() - dateB.getTime();
}

function pickFirstValue(source, aliases) {
  if (!source || typeof source !== 'object') return null;
  for (const key of aliases) {
    if (Object.prototype.hasOwnProperty.call(source, key)) return source[key];
  }
  return null;
}

export function getFirstDueDateValue(payment) {
  return pickFirstValue(payment, FIRST_DUE_DATE_ALIASES);
}

export function getSecondDueDateValue(payment) {
  return pickFirstValue(payment, SECOND_DUE_DATE_ALIASES);
}

export function normalizePendingPaymentDueDates(payment) {
  const firstDueDate = formatLocalDateOnly(getFirstDueDateValue(payment));
  const secondDueDate = formatLocalDateOnly(getSecondDueDateValue(payment));

  return {
    firstDueDate: firstDueDate || null,
    secondDueDate: secondDueDate || null,
  };
}

export function isPagoPaid(payment) {
  const estado = (payment?.estado ?? payment?.Estado ?? '').toString().toLowerCase();
  return estado === PENDING_PAYMENT_STATUS.PAID || estado === 'true' || payment?.pagada === true;
}

export function derivePendingPaymentStatus(payment, today = new Date()) {
  if (isPagoPaid(payment)) return PENDING_PAYMENT_STATUS.PAID;

  const { firstDueDate, secondDueDate } = normalizePendingPaymentDueDates(payment);
  const todayDate = parseLocalDateOnly(today);
  const first = parseLocalDateOnly(firstDueDate);
  const second = parseLocalDateOnly(secondDueDate);

  if (!todayDate || !first) return PENDING_PAYMENT_STATUS.PENDING;
  if (todayDate.getTime() <= first.getTime()) return PENDING_PAYMENT_STATUS.PENDING;
  if (!second) return PENDING_PAYMENT_STATUS.OVERDUE;
  if (todayDate.getTime() <= second.getTime()) return PENDING_PAYMENT_STATUS.IN_ARREARS;
  return PENDING_PAYMENT_STATUS.OVERDUE;
}

export function getEffectiveOverdueDate(payment) {
  const { firstDueDate, secondDueDate } = normalizePendingPaymentDueDates(payment);
  return secondDueDate || firstDueDate || null;
}

export function daysUntilLocalDate(value, today = new Date()) {
  const target = parseLocalDateOnly(value);
  const todayDate = parseLocalDateOnly(today);
  if (!target || !todayDate) return 999;
  return Math.ceil((target.getTime() - todayDate.getTime()) / 86400000);
}

export function validateSecondDueDateAfterFirst(firstDueDate, secondDueDate) {
  const first = parseLocalDateOnly(firstDueDate);
  const second = parseLocalDateOnly(secondDueDate);
  if (!first || !second) return true;
  return second.getTime() > first.getTime();
}

function addMonthsClamped(date, months) {
  const source = parseLocalDateOnly(date);
  if (!source) return null;
  const desiredDay = source.getDate();
  const result = new Date(source.getFullYear(), source.getMonth() + months, 1);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(desiredDay, lastDay));
  return result;
}

export function addRecurrenceToLocalDate(date, frequency = 'mensual') {
  const source = parseLocalDateOnly(date);
  if (!source) return null;

  if (frequency === 'semanal') {
    const next = new Date(source);
    next.setDate(next.getDate() + 7);
    return formatLocalDateOnly(next);
  }

  if (frequency === 'anual') {
    return formatLocalDateOnly(addMonthsClamped(source, 12));
  }

  return formatLocalDateOnly(addMonthsClamped(source, 1));
}

export function buildRecurringPendingPaymentDates(firstDueDate, secondDueDate, frequency = 'mensual') {
  const nextFirst = addRecurrenceToLocalDate(firstDueDate, frequency);
  if (!nextFirst) return { fechavencimiento: null, segunda_fecha_vencimiento: null };

  const first = parseLocalDateOnly(firstDueDate);
  const second = parseLocalDateOnly(secondDueDate);
  if (!first || !second) {
    return { fechavencimiento: nextFirst, segunda_fecha_vencimiento: null };
  }

  const offsetDays = Math.round((second.getTime() - first.getTime()) / 86400000);
  const nextSecond = parseLocalDateOnly(nextFirst);
  nextSecond.setDate(nextSecond.getDate() + offsetDays);

  return {
    fechavencimiento: nextFirst,
    segunda_fecha_vencimiento: formatLocalDateOnly(nextSecond),
  };
}
