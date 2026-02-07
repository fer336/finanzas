/**
 * 🛠️ Helpers para generar componentes interactivos de chat
 * 
 * Funciones que simplifican la creación de mensajes con componentes
 * para usar desde el backend (webhook)
 */

/**
 * Genera un mensaje con card de KPIs
 * @param {string} title - Título del card
 * @param {Array} kpis - Array de {label, value, change}
 * @param {string} [intro] - Texto introductorio opcional
 * @returns {string} Mensaje markdown con card embebido
 */
export const createKPIMessage = (title, kpis, intro = '') => {
  const cardJSON = JSON.stringify({
    type: 'kpi-card',
    title,
    kpis
  }, null, 2);

  return `${intro ? intro + '\n\n' : ''}```card
${cardJSON}
\`\`\``;
};

/**
 * Genera un mensaje con tabla
 * @param {string} title - Título de la tabla
 * @param {Array<string>} columns - Nombres de columnas
 * @param {Array<Array>} rows - Datos de filas
 * @param {string} [intro] - Texto introductorio opcional
 * @returns {string} Mensaje markdown con tabla embebida
 */
export const createTableMessage = (title, columns, rows, intro = '') => {
  const cardJSON = JSON.stringify({
    type: 'table',
    title,
    columns,
    rows
  }, null, 2);

  return `${intro ? intro + '\n\n' : ''}```card
${cardJSON}
\`\`\``;
};

/**
 * Genera un mensaje con botones de acción
 * @param {Array} actions - Array de {label, action, payload}
 * @param {string} [intro] - Texto introductorio opcional
 * @returns {string} Mensaje markdown con botones embebidos
 */
export const createActionsMessage = (actions, intro = '') => {
  const cardJSON = JSON.stringify({
    type: 'actions',
    actions
  }, null, 2);

  return `${intro ? intro + '\n\n' : ''}```card
${cardJSON}
\`\`\``;
};

/**
 * Genera un mensaje completo con KPI + Botones
 * @param {string} kpiTitle - Título del KPI card
 * @param {Array} kpis - Métricas a mostrar
 * @param {Array} actions - Botones de acción
 * @param {string} [intro] - Texto introductorio
 * @param {string} [middle] - Texto entre KPI y botones
 * @returns {string} Mensaje completo
 */
export const createKPIWithActionsMessage = (kpiTitle, kpis, actions, intro = '', middle = '¿Qué querés hacer?') => {
  const kpiCard = createKPIMessage(kpiTitle, kpis);
  const actionsCard = createActionsMessage(actions);
  
  return `${intro ? intro + '\n\n' : ''}${kpiCard}\n\n${middle}\n\n${actionsCard}`;
};

// 🎯 Ejemplos de uso rápido para casos comunes

/**
 * Genera resumen financiero estándar
 */
export const createFinancialSummary = (ingresos, gastos, balance, period = 'este mes') => {
  const kpis = [
    { label: 'Ingresos', value: `$${ingresos.toLocaleString('es-AR')}`, change: '+5%' },
    { label: 'Gastos', value: `$${gastos.toLocaleString('es-AR')}`, change: '+2%' },
    { label: 'Balance', value: `$${balance.toLocaleString('es-AR')}`, change: balance > 0 ? '+8%' : '-3%' }
  ];

  const actions = [
    { label: '📊 Ver Detalles', action: 'filter', payload: { message: 'Mostrar detalle de gastos' } },
    { label: '📈 Ver Gráficos', action: 'charts', payload: { message: 'Mostrar gráficos financieros' } },
    { label: '📤 Exportar', action: 'export', payload: { format: 'excel' } }
  ];

  return createKPIWithActionsMessage(
    `Resumen Financiero - ${period}`,
    kpis,
    actions,
    `## 💰 Tu situación financiera de ${period}`
  );
};

/**
 * Genera tabla de transacciones recientes
 */
export const createTransactionsTable = (transactions) => {
  const columns = ['Fecha', 'Descripción', 'Monto', 'Categoría'];
  const rows = transactions.map(t => [
    t.fecha,
    t.descripcion,
    `$${t.monto.toLocaleString('es-AR')}`,
    t.categoria
  ]);

  const actions = [
    { label: 'Ver Todas', action: 'filter', payload: { message: 'Mostrar todas las transacciones' } },
    { label: 'Filtrar por Fecha', action: 'filter', payload: { type: 'date' } }
  ];

  return createTableMessage('Transacciones Recientes', columns, rows, '## 📋 Tus últimas transacciones') +
         '\n\n' + 
         createActionsMessage(actions);
};

/**
 * Genera análisis por categorías
 */
export const createCategoryAnalysis = (categories) => {
  const columns = ['Categoría', 'Gastos', '% del Total'];
  const rows = categories.map(cat => [
    cat.nombre,
    `$${cat.total.toLocaleString('es-AR')}`,
    `${cat.porcentaje}%`
  ]);

  return createTableMessage('Análisis por Categoría', columns, rows, '## 📊 Tus gastos por categoría');
};

// 🚀 Para usar desde el backend (Python/Node.js):

/*
// Python ejemplo:
def webhook_handler(query, user_id):
    if "balance" in query.lower():
        return {
            "message": create_financial_summary(50000, 30000, 20000, "enero")
        }
    
    elif "transacciones" in query.lower():
        transactions = get_user_transactions(user_id, limit=5)
        return {
            "message": create_transactions_table(transactions)
        }

// Node.js ejemplo:
app.post('/webhook/chat', async (req, res) => {
    const { message, userId } = req.body;
    
    if (message.includes('balance')) {
        const data = await getUserFinancialData(userId);
        res.json({
            message: createFinancialSummary(data.income, data.expenses, data.balance)
        });
    }
});
*/

export default {
  createKPIMessage,
  createTableMessage, 
  createActionsMessage,
  createKPIWithActionsMessage,
  createFinancialSummary,
  createTransactionsTable,
  createCategoryAnalysis
};