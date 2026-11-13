# Rediseño financiero aprobado

Las cinco pantallas aprobadas están implementadas con los datos y callbacks existentes. No hay migraciones, dependencias nuevas ni publicación. La validación visual contra un backend queda pendiente.

## Qué revisar

| Área | Cambio | Guía |
| --- | --- | --- |
| Inicio | Resumen mensual común a desktop/mobile y seguimiento desplegable | [Inicio](ux-overview.md) |
| Movimientos y detalle | Filtros progresivos, ordenamiento y panel contextual | [Movimientos](ux-transactions.md) |
| Registro y edición | Campos esenciales primero, opciones avanzadas y errores inline | [Formulario](ux-transaction-form.md) |
| Vencimientos | Urgencia visible y revisión explícita antes de registrar un pago | [Vencimientos](ux-due-dates.md) |

Las maquetas de referencia están en `design/finance-ux-proposal/` y `design/finance-workflows-proposal/`. Son referencias con datos ficticios, no una aplicación conectada. La implementación no copia esos datos.

## Verificación automatizada observada

Desde `frontend/`:

```bash
npm test -- --reporter=dot
npm run lint
npm run build
```

Resultado al integrar: 19 archivos, 162 pruebas aprobadas; lint sin errores y con 75 advertencias en otros archivos; build aprobado con advertencia sobre chunks mayores a 500 kB. También se notificaron Vite CJS deprecado y datos de baseline-browser-mapping antiguos. No se cambiaron dependencias para silenciar advertencias.

No se ejecutaron pruebas de persistencia contra datos reales. Los componentes verifican payloads y rechazo de entradas mediante APIs simuladas. Los helpers de fechas/estados, contratos del backend y controles de URLs de comprobantes se mantienen.

## Previsualización local

```bash
cd frontend
npm run preview -- --host 127.0.0.1 --port 5174 --strictPort
```

En una máquina conectada por SSH, abrir el túnel desde la computadora local:

```bash
ssh -N -L 5174:127.0.0.1:5174 usuario@servidor
```

Abrir `http://127.0.0.1:5174/`. El HTTP 200 de este servidor comprueba únicamente que se sirve el frontend. El build conserva la configuración API existente: para entrar y revisar datos financieros debe estar disponible un backend compatible con esa configuración. No se habilitó un bypass de autenticación ni un backend ficticio.

## Comprobación visual pendiente

No hay navegador de prueba disponible en este entorno. Antes de publicar:

- Revisar 390px y desktop en ambos temas: sin desbordamientos y con acciones alcanzables.
- Navegar con teclado: apertura/cierre de detalle, restauración del foco, edición y confirmación de pago.
- Ocultar importes y recorrer resumen, categorías, detalle y vencimientos.
- Consultar movimientos en ARS/USD y comprobar etiqueta, signo y moneda.
- Usar una cuenta de prueba aislada para alta/edición, comprobante y registro de pago; no probar mutaciones sobre datos de producción.

## Unidades locales de revisión

Base de esta funcionalidad: `92ff7b5`. No incluir los commits previos de la rama original como parte del rediseño.

1. `a909295`: Inicio, pruebas y documentación; primera unidad desde la base.
2. `fcd09c4`: formulario progresivo, pruebas y documentación.
3. `5c8a15d`: vencimientos y revisión del registro de pago, pruebas y documentación.
4. `148632a`: filtros y detalle contextual con moneda correcta, pruebas y documentación.

Estrategia elegida: cadena sobre una rama de funcionalidad. Las unidades exceden en algunos casos la guía de 400 líneas para conservar un comportamiento coherente con pruebas legibles. No se crearon PRs ni se hizo push. La preparación/publicación de las ramas de la cadena requiere autorización aparte.
