// Category chips for the due-dates view. They are derived from the categories
// actually present in the list, so each payment lands in the chip of the same
// category shown on its row badge. There is no fixed catalogue here.

export const UNCATEGORIZED_LABEL = 'Sin categoría';

export function getPaymentCategory(payment) {
  const category = payment?.Categorias || payment?.categorias1 || payment?.categoria || null;
  return category?.nombre || category?.Nombre || UNCATEGORIZED_LABEL;
}

// Expects payments already normalized by the view (`categoria` is a string).
export function buildCategoryChips(payments = []) {
  const counts = new Map();
  payments.forEach((payment) => {
    const label = payment?.categoria || UNCATEGORIZED_LABEL;
    counts.set(label, (counts.get(label) || 0) + 1);
  });

  return [...counts.entries()]
    .map(([label, count]) => ({ key: label, label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'es'));
}
