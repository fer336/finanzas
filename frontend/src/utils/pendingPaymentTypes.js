// Categories for pending payments. They are stored in the free-text `tipo`
// column (String(50)), so no migration is needed. Legacy values written by
// older versions of the form ('factura', 'alquiler', ...) are mapped on read.

export const PAYMENT_TYPES = [
  { value: 'servicio', label: 'Servicio o factura', chipLabel: 'Servicios', shortLabel: 'Servicio' },
  { value: 'colegio', label: 'Colegio y comedor', chipLabel: 'Colegio y comedor', shortLabel: 'Colegio' },
  { value: 'actividad', label: 'Actividad', chipLabel: 'Actividades', shortLabel: 'Actividad' },
  { value: 'seguro', label: 'Seguro', chipLabel: 'Seguros', shortLabel: 'Seguro' },
  { value: 'otro', label: 'Otro', chipLabel: 'Otros', shortLabel: 'Otro' },
];

export const DEFAULT_PAYMENT_TYPE = 'servicio';

const LEGACY_TYPE_MAP = {
  factura: 'servicio',
  alquiler: 'otro',
};

const KNOWN_TYPES = new Set(PAYMENT_TYPES.map((t) => t.value));

export function normalizePaymentType(raw) {
  const value = String(raw ?? '').trim().toLowerCase();
  if (KNOWN_TYPES.has(value)) return value;
  return LEGACY_TYPE_MAP[value] || 'otro';
}

export function getPaymentType(payment) {
  const value = normalizePaymentType(payment?.tipo ?? payment?.Tipo);
  return PAYMENT_TYPES.find((t) => t.value === value);
}

export function countByPaymentType(payments = []) {
  const counts = Object.fromEntries(PAYMENT_TYPES.map((t) => [t.value, 0]));
  payments.forEach((p) => {
    counts[getPaymentType(p).value] += 1;
  });
  return counts;
}
