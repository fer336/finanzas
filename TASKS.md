# TASKS - Sistema de Gastos

## 🔴 Pendiente
- [ ] Hacer push de los commits a origin/main
- [x] Hacer push de los commits a origin/main ✅ 2026-05-10
- [ ] Configurar secrets en GitHub (DOCKER_USERNAME, DOCKER_PASSWORD, SSH_HOST, SSH_USER, SSH_KEY, GOOGLE_CLIENT_ID, OAUTH_URL, N8N_WEBHOOK)
- [ ] Verificar que el campo `url_pdf` del `PendingPaymentFormView.jsx` también tenga uploader (actualmente es solo URL input)
- [ ] Probar el workflow con un push a main

## 🟡 En progreso

## 🟢 Hecho
- [x] Commit de fixes de comprobantes (MinIO) + FileUploadField + cambios de UI ✅ 2026-05-10
- [x] Creado `.github/workflows/deploy.yml` con build + push + SSH deploy ✅ 2026-05-10
- [x] Fix bug PendingPaymentPayModal.jsx: reemplazar endpoint Drive inexistente por upload a MinIO ✅ 2026-05-10
- [x] Fix bug comprobante-uploader.jsx: ahora sube realmente a MinIO (no simulaba) ✅ 2026-05-10
- [x] Agregado `filesApi.uploadFile()` y helper `_getBaseUrl()` a api.js ✅ 2026-05-10
- [x] Fix nuevo-gasto-hija-modal.jsx: ahora incluye comprobante en transaccionData ✅ 2026-05-10
- [x] Reemplazar DocField (input URL) por FileUploadField con upload a MinIO en StitchPendingPaymentModal.jsx ✅ 2026-05-10

## 🚧 Bloqueado
