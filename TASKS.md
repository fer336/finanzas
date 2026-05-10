# TASKS - Sistema de Gastos

## 🔴 Pendiente
- [ ] Hacer commit y push de los fixes de comprobantes (MinIO) + FileUploadField
- [ ] Crear CI/CD con GitHub Actions (build Docker → Docker Hub → SSH deploy a Portainer)
- [ ] Verificar que el campo `url_pdf` del `PendingPaymentFormView.jsx` también tenga uploader (actualmente es solo URL input)

## 🟡 En progreso

## 🟢 Hecho
- [x] Fix bug PendingPaymentPayModal.jsx: reemplazar endpoint Drive inexistente por upload a MinIO ✅ 2026-05-10
- [x] Fix bug comprobante-uploader.jsx: ahora sube realmente a MinIO (no simulaba) ✅ 2026-05-10
- [x] Agregado `filesApi.uploadFile()` y helper `_getBaseUrl()` a api.js ✅ 2026-05-10
- [x] Fix nuevo-gasto-hija-modal.jsx: ahora incluye comprobante en transaccionData ✅ 2026-05-10
- [x] Reemplazar DocField (input URL) por FileUploadField con upload a MinIO en StitchPendingPaymentModal.jsx ✅ 2026-05-10

## 🚧 Bloqueado
