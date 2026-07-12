# Guía de API para agentes externos

Este documento es para un agente/script externo que quiere leer o cargar datos en Sistema de Gastos vía API — no para agentes que desarrollan sobre este repo.

## Lo más confiable: pasale el schema, no el navegador

Un agente no puede "ver" Swagger UI (`/docs`) — es una página que renderiza con JavaScript. Dale directamente el schema OpenAPI crudo:

```
https://finanzas.qeva.xyz/openapi.json
```

Eso solo alcanza para saber qué endpoints existen y qué forma tienen. Lo que sigue acá abajo son las reglas de negocio que el schema *no* explica.

## Autenticación

```bash
curl https://finanzas.qeva.xyz/api/v1/categories/ -H "Authorization: Bearer fk_live_..."
```

La API key (`fk_live_...`) se genera desde la web: Ajustes → General → "Acceso API externo". No expira salvo que se revoque. No hay forma de generarla por API — requiere un JWT humano ya logueado.

## Base URL y convenciones

- Base: `https://finanzas.qeva.xyz/api/v1`
- Todas las rutas CRUD siguen `GET /`, `GET /{id}`, `POST /`, `PATCH /{id}`, `DELETE /{id}`.
- IDs son UUID.
- Rutas sin trailing slash devuelven un 307 redirect al mismo path con `/` — mandá el trailing slash directamente para evitar el round-trip extra (ej. `/api/v1/categories/`, no `/api/v1/categories`).

## Gotchas de negocio (esto no está en el OpenAPI)

- **El signo de `monto` en transacciones es interno, no lo mandes vos.** `POST /transacciones` espera `monto > 0` siempre (`gt=0` en el schema) — el signo negativo para gastos lo aplica el backend según el campo `tipo`. Mandar un monto negativo hace fallar la validación.
- **`tipo` acepta**: `ingreso`, `gasto`, `transferencia`.
- **Carga masiva**: para cargar muchas transacciones de una, usá `POST /transacciones/bulk-create` con `{ "transactions": [...] }` (hasta 1000 filas) en vez de loopear `POST /transacciones/`. Cada item del array tiene la misma forma que el body de creación individual. La respuesta trae `created_count`, `failed_count`, `created_ids` y `errors` (primeros 10) — no asume que todo el batch se cargó si no revisás `failed_count`.
- **Marcar un vencimiento o préstamo como pagado** no es un PATCH al recurso — es `POST /pagos/registrar` con `{ "item_type": "pending_payment" | "prestamo", "item_id": "<uuid>", "monto": ..., ... }`. Esto crea el gasto real en `transacciones` y actualiza el estado del origen. Deshacer: `POST /pagos/deshacer/{id}`.
- **Comprobantes/facturas** se suben aparte a `POST /files/upload` (MinIO), que devuelve una URL — esa URL es la que va en el campo `archivo_adjunto`/`comprobante` de la transacción, no el archivo binario directo.

## Endpoints principales

| Recurso | Prefijo |
|---|---|
| Transacciones | `/transacciones` *(+ `/ingresos`, `/gastos`, `/estadisticas`, `/bulk-create`, `/bulk-delete`)* |
| Categorías | `/categories` |
| Métodos de pago | `/payment-methods` |
| Pagos pendientes (vencimientos) | `/pagos-pendientes` |
| Préstamos | `/prestamos` |
| Objetivos de ahorro | `/objetivos` |
| Presupuestos | `/presupuestos` |
| Monedas del usuario | `/monedas-usuario` |
| Balance neto | `/balance-inicial` *(`GET /neto` para el cálculo)* |
| Registrar/deshacer pago | `/pagos/registrar`, `/pagos/deshacer/{id}` |
| Subir archivo (MinIO) | `/files/upload` |

Para el detalle exacto de cada request/response (campos, tipos, requeridos), leé `openapi.json` — ahí está completo y actualizado siempre, esta guía solo cubre lo que el schema no dice.
