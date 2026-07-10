# Product

## Register

product

## Users

Usuario único (dueño del producto) gestionando sus finanzas personales: movimientos, vencimientos, objetivos de ahorro e inversiones (CEDEARs, cotización dólar, monedas). Contexto de uso: chequeos rápidos diarios/semanales de saldo y gastos, sesiones puntuales de carga de datos (nueva transacción), y revisión mensual de objetivos e inversiones.

## Product Purpose

Sistema de finanzas personales que centraliza movimientos, vencimientos, objetivos e inversiones, con ARS como moneda principal y equivalencia en USD. Éxito = ver de un vistazo el estado del mes (saldo, ingresos/gastos, próximos vencimientos) y cargar/editar transacciones sin fricción.

## Brand Personality

Editorial, calmo, "libreta contable" — un balance escrito a mano en papel, no un dashboard SaaS. Serif editorial para títulos, monoespaciada para todos los valores numéricos.

## Anti-references

El tema oscuro actual (sidebar + dashboard oscuro, acentos neón/glow) queda explícitamente descartado. Nada de sombras decorativas, gradientes, glassmorphism, ni el logo pulpo a color como protagonista — se reemplaza por wordmark tipográfico "Cuentas." (el pulpo, si se conserva, va monocromo y secundario).

## Design Principles

- Claridad contable: los números mandan, siempre monoespaciados (IBM Plex Mono) y alineados a la derecha, con signo `+`/`−` explícito.
- Un acento por dato: verde = ingresos/primario, arcilla-rojo = gastos, azul = info de período, dorado = pendiente. Nunca mezclar.
- Profundidad sin sombra: jerarquía vía bordes y contraste de fondo, cero `box-shadow` decorativo.
- Reutilizar antes que crear: recrear cada vista dentro del sistema existente (shadcn/ui + hooks de `useFinancialData.js`), sin librerías de charts ni componentes pesados nuevos.
- Navegación simple: 6 secciones máximo en la barra superior (Inicio, Movimientos, Vencimientos, Objetivos, Inversiones, Ajustes), agrupando lo poco usado.

## Accessibility & Inclusion

Contraste alto por defecto (fondo papel claro + texto casi negro `#20242c`). Foco visible en inputs/botones. Sin motion agresivo: transiciones cortas (~150ms) solo en hover/estado activo.
