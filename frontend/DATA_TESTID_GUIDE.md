# 🎯 Data Test ID Guide - Frontend Components

Guía para agregar `data-testid` attributes a componentes React para testing E2E con Playwright.

---

## ❓ ¿Qué es data-testid?

`data-testid` es un atributo HTML que identifica elementos de forma única para testing, sin depender de:
- Clases CSS (pueden cambiar)
- IDs (pueden duplicarse)
- Texto visible (puede cambiar de idioma)
- Estructura del DOM (puede refactorizarse)

### Ejemplo

```jsx
// ❌ MAL - Frágil, depende de clase CSS
await page.click('.btn-primary.transaction-button');

// ✅ BIEN - Robusto, usa data-testid
await page.click('[data-testid="new-transaction-button"]');
```

---

## 📋 Data Test IDs Requeridos

### 1. Dashboard Principal (`MissionControlDashboard.jsx`)

```jsx
<div className="dashboard-container" data-testid="dashboard-loaded">
  {/* Indicador de que el dashboard terminó de cargar */}
  
  {/* Stats Cards */}
  <div className="balance-card" data-testid="balance-card-ars">
    <span data-testid="balance-amount">${balance}</span>
  </div>
  
  {/* Widgets */}
  <div data-testid="multi-currency-balance-widget">
    {/* Widget de balances multi-moneda */}
  </div>
  
  <div data-testid="recent-transactions-widget">
    {/* Widget de transacciones recientes */}
  </div>
  
  <div data-testid="categories-widget">
    {/* Widget de categorías */}
  </div>
  
  <div data-testid="pending-payments-widget">
    {/* Widget de pagos pendientes */}
  </div>
  
  <div data-testid="credit-card-debt-widget">
    <span data-testid="total-credit-debt">${debt}</span>
  </div>
  
  <div data-testid="bank-summaries-widget">
    {/* Widget de resúmenes bancarios */}
  </div>
  
  {/* User Menu */}
  <button data-testid="user-menu">
    <img src={user.avatar} alt="User" />
  </button>
  
  <a data-testid="manage-currencies" href="/currencies">
    Gestionar Monedas
  </a>
</div>
```

---

### 2. MultiCurrencyBalanceWidget

```jsx
<div className="multi-currency-widget" data-testid="multi-currency-balance-widget">
  {currencies.map(currency => (
    <div 
      key={currency.id} 
      data-testid="currency-balance-item"
      data-currency={currency.code}
    >
      <span data-testid="currency-code">{currency.code}</span>
      <span data-testid="currency-balance">{currency.balance}</span>
    </div>
  ))}
</div>
```

---

### 3. TransactionModal

```jsx
<Modal 
  isOpen={isOpen} 
  data-testid="transaction-modal"
>
  <form onSubmit={handleSubmit}>
    {/* Tipo */}
    <select data-testid="transaction-type" value={type} onChange={...}>
      <option value="ingreso">Ingreso</option>
      <option value="gasto">Gasto</option>
    </select>
    
    {/* Descripción */}
    <input 
      type="text"
      data-testid="transaction-description"
      value={description}
      onChange={...}
    />
    
    {/* Monto */}
    <input 
      type="number"
      data-testid="transaction-amount"
      value={amount}
      onChange={...}
    />
    {errors.amount && (
      <span data-testid="transaction-amount-error">
        {errors.amount}
      </span>
    )}
    
    {/* Moneda */}
    <select data-testid="transaction-currency" value={currency} onChange={...}>
      <option value="ARS">ARS</option>
      <option value="USD">USD</option>
      {/* ... */}
    </select>
    
    {/* Conversión ARS (readonly) */}
    <input 
      type="number"
      data-testid="transaction-ars-conversion"
      value={arsConversion}
      readOnly
    />
    
    {/* Categoría */}
    <select data-testid="transaction-category" value={categoryId} onChange={...}>
      <option value="">Seleccionar categoría</option>
      {categories.map(cat => (
        <option key={cat.id} value={cat.id}>{cat.nombre}</option>
      ))}
    </select>
    
    {/* Método de Pago */}
    <select data-testid="transaction-payment-method" value={methodId} onChange={...}>
      <option value="">Seleccionar método</option>
      {paymentMethods.map(method => (
        <option key={method.id} value={method.id}>{method.nombre}</option>
      ))}
    </select>
    
    {/* Es Crédito */}
    <input 
      type="checkbox"
      data-testid="transaction-is-credit"
      checked={isCredit}
      onChange={...}
    />
    
    {/* Objetivo */}
    {type === 'ingreso' && (
      <select data-testid="transaction-goal" value={goalId} onChange={...}>
        <option value="">Sin objetivo</option>
        {goals.map(goal => (
          <option key={goal.id} value={goal.id}>{goal.nombre}</option>
        ))}
      </select>
    )}
    
    {/* Botones */}
    <button type="submit" data-testid="transaction-submit-button">
      Guardar
    </button>
    <button type="button" data-testid="transaction-cancel-button">
      Cancelar
    </button>
  </form>
</Modal>
```

---

### 4. RecentTransactionsWidget

```jsx
<div className="transactions-widget" data-testid="recent-transactions-widget">
  {transactions.map(tx => (
    <div 
      key={tx.id} 
      data-testid="transaction-item"
      data-transaction-id={tx.id}
    >
      <span data-testid="transaction-description">{tx.descripcion}</span>
      <span data-testid="transaction-amount">{tx.monto}</span>
      <span data-testid="transaction-type">{tx.tipo}</span>
    </div>
  ))}
</div>
```

---

### 5. CurrencyManagement Page

```jsx
<div className="currencies-page">
  <button data-testid="new-currency-button" onClick={openModal}>
    Nueva Moneda
  </button>
  
  <div data-testid="currencies-list">
    {currencies.map(currency => (
      <div 
        key={currency.id}
        data-testid="currency-item"
        data-code={currency.codigo}
        data-active={currency.activa}
      >
        <span data-testid="currency-code">{currency.codigo}</span>
        <span data-testid="currency-name">{currency.nombre}</span>
        
        <button 
          data-testid="edit-button"
          onClick={() => editCurrency(currency)}
        >
          Editar
        </button>
        
        <button 
          data-testid="toggle-active-button"
          onClick={() => toggleActive(currency)}
        >
          {currency.activa ? 'Desactivar' : 'Activar'}
        </button>
      </div>
    ))}
  </div>
</div>
```

---

### 6. CurrencyModal

```jsx
<Modal isOpen={isOpen} data-testid="currency-modal">
  <form onSubmit={handleSubmit}>
    <input 
      type="text"
      data-testid="currency-code"
      placeholder="Código (ej: BTC)"
      value={code}
      onChange={...}
    />
    
    <input 
      type="text"
      data-testid="currency-name"
      placeholder="Nombre (ej: Bitcoin)"
      value={name}
      onChange={...}
    />
    
    <input 
      type="text"
      data-testid="currency-symbol"
      placeholder="Símbolo (ej: ₿)"
      value={symbol}
      onChange={...}
    />
    
    <input 
      type="number"
      data-testid="currency-exchange-rate"
      placeholder="Tasa de cambio a ARS"
      value={rate}
      onChange={...}
    />
    
    <button type="submit" data-testid="currency-submit-button">
      Guardar
    </button>
  </form>
</Modal>
```

---

### 7. BankSummariesWidget

```jsx
<div data-testid="bank-summaries-widget">
  {summaries.map(summary => (
    <div 
      key={summary.id}
      data-testid="bank-summary-item"
      data-paid={summary.total_pagado}
    >
      <span data-testid="summary-amount">{summary.totales.pago_total_pesos}</span>
      
      <button 
        data-testid="pay-summary-button"
        onClick={() => paySummary(summary)}
      >
        Pagar
      </button>
      
      <a 
        data-testid="view-pdf-button"
        href={summary.url_factura}
        target="_blank"
      >
        Ver PDF
      </a>
    </div>
  ))}
</div>
```

---

### 8. PaySummaryModal

```jsx
<Modal isOpen={isOpen} data-testid="pay-summary-modal">
  <form onSubmit={handlePayment}>
    <select data-testid="payment-method" value={methodId} onChange={...}>
      <option value="">Seleccionar método</option>
      {paymentMethods.map(method => (
        <option key={method.id} value={method.id}>{method.nombre}</option>
      ))}
    </select>
    
    <button type="submit" data-testid="confirm-payment-button">
      Confirmar Pago
    </button>
  </form>
</Modal>
```

---

## 🎨 Convenciones de Naming

### Formato General
```
data-testid="{component}-{element}-{action/type}"
```

### Ejemplos

| Elemento | data-testid |
|----------|-------------|
| Botón para crear | `new-{entity}-button` |
| Botón para editar | `edit-button` |
| Botón para eliminar | `delete-button` |
| Botón para guardar | `{entity}-submit-button` |
| Campo de texto | `{entity}-{field}` |
| Select/dropdown | `{entity}-{field}` |
| Checkbox | `{entity}-is-{property}` |
| Error message | `{field}-error` |
| Lista/container | `{entity}-list` |
| Item de lista | `{entity}-item` |
| Modal/dialog | `{entity}-modal` |

---

## ✅ Checklist de Implementación

### Dashboard
- [ ] `dashboard-loaded` (container principal)
- [ ] `balance-card-ars` (card de balance ARS)
- [ ] `balance-amount` (monto del balance)
- [ ] `multi-currency-balance-widget`
- [ ] `recent-transactions-widget`
- [ ] `categories-widget`
- [ ] `pending-payments-widget`
- [ ] `credit-card-debt-widget`
- [ ] `total-credit-debt`
- [ ] `bank-summaries-widget`
- [ ] `user-menu`
- [ ] `manage-currencies`

### TransactionModal
- [ ] `transaction-modal`
- [ ] `new-transaction-button` (botón que abre modal)
- [ ] `transaction-type`
- [ ] `transaction-description`
- [ ] `transaction-amount`
- [ ] `transaction-amount-error`
- [ ] `transaction-currency`
- [ ] `transaction-ars-conversion`
- [ ] `transaction-category`
- [ ] `transaction-payment-method`
- [ ] `transaction-is-credit`
- [ ] `transaction-goal`
- [ ] `transaction-submit-button`

### MultiCurrencyWidget
- [ ] `currency-balance-item` (con `data-currency`)
- [ ] `currency-code`
- [ ] `currency-balance`

### CurrencyManagement
- [ ] `new-currency-button`
- [ ] `currencies-list`
- [ ] `currency-item` (con `data-code` y `data-active`)
- [ ] `edit-button`
- [ ] `toggle-active-button`
- [ ] `currency-modal`
- [ ] `currency-code` (input)
- [ ] `currency-name` (input)
- [ ] `currency-symbol` (input)
- [ ] `currency-exchange-rate` (input)
- [ ] `currency-submit-button`

### BankSummaries
- [ ] `bank-summary-item` (con `data-paid`)
- [ ] `summary-amount`
- [ ] `pay-summary-button`
- [ ] `pay-summary-modal`
- [ ] `payment-method` (select)
- [ ] `confirm-payment-button`

---

## 🚀 Implementación Rápida

### Paso 1: Buscar componente

```bash
# Buscar archivo del componente
grep -r "TransactionModal" frontend/src/components/
```

### Paso 2: Agregar data-testid

```jsx
// ANTES
<button onClick={handleClick}>Nueva Transacción</button>

// DESPUÉS
<button 
  data-testid="new-transaction-button"
  onClick={handleClick}
>
  Nueva Transacción
</button>
```

### Paso 3: Verificar en browser

1. Abrir DevTools (F12)
2. Buscar el elemento
3. Verificar que tiene el attribute `data-testid`

### Paso 4: Ejecutar test

```bash
npx playwright test TC002-transaction-creation --headed
```

---

## 🐛 Debugging

### Ver qué elementos existen

```javascript
// En Playwright test
const allTestIds = await page.locator('[data-testid]').all();
console.log('Found test IDs:', allTestIds.length);
```

### Tomar screenshot de elemento específico

```javascript
await page.locator('[data-testid="transaction-modal"]')
  .screenshot({ path: 'modal-screenshot.png' });
```

---

## 📚 Recursos

- [Playwright Selectors](https://playwright.dev/docs/selectors)
- [Best Practices for Test IDs](https://kentcdodds.com/blog/making-your-ui-tests-resilient-to-change)
- [data-testid vs role vs text](https://playwright.dev/docs/best-practices#use-locators)

---

**Última actualización**: 2026-02-07
