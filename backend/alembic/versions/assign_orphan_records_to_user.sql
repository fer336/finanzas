-- ========================================
-- Asignar registros huérfanos a un usuario
-- ========================================
-- Usuario: casserafernando@gmail.com
-- ID: 934d46c0-4a56-4096-94e6-9d294f3d5a89
-- Fecha: 2026-01-28
-- ========================================

-- Verificar el usuario existe
SELECT id, email, full_name 
FROM usuarios 
WHERE id = '934d46c0-4a56-4096-94e6-9d294f3d5a89';

-- ========================================
-- 1. CATEGORÍAS
-- ========================================

-- Ver categorías sin usuario asignado
SELECT COUNT(*) as total_sin_usuario
FROM categorias
WHERE usuario_id IS NULL;

-- Ver detalles de las categorías huérfanas
SELECT id, nombre, tipo, activa, es_global
FROM categorias
WHERE usuario_id IS NULL;

-- Asignar todas las categorías sin usuario al usuario especificado
UPDATE categorias
SET usuario_id = '934d46c0-4a56-4096-94e6-9d294f3d5a89'
WHERE usuario_id IS NULL;

-- Verificar que no queden categorías sin usuario
SELECT COUNT(*) as total_sin_usuario_despues
FROM categorias
WHERE usuario_id IS NULL;

-- ========================================
-- 2. MÉTODOS DE PAGO
-- ========================================

-- Ver métodos de pago sin usuario asignado
SELECT COUNT(*) as total_sin_usuario
FROM metodos_pago
WHERE usuario_id IS NULL;

-- Ver detalles de los métodos huérfanos
SELECT id, nombre, tipo, activo, es_global
FROM metodos_pago
WHERE usuario_id IS NULL;

-- Asignar todos los métodos de pago sin usuario al usuario especificado
UPDATE metodos_pago
SET usuario_id = '934d46c0-4a56-4096-94e6-9d294f3d5a89'
WHERE usuario_id IS NULL;

-- Verificar que no queden métodos sin usuario
SELECT COUNT(*) as total_sin_usuario_despues
FROM metodos_pago
WHERE usuario_id IS NULL;

-- ========================================
-- 3. RESUMEN FINAL
-- ========================================

-- Ver totales asignados al usuario
SELECT 
    (SELECT COUNT(*) FROM categorias WHERE usuario_id = '934d46c0-4a56-4096-94e6-9d294f3d5a89') as total_categorias,
    (SELECT COUNT(*) FROM metodos_pago WHERE usuario_id = '934d46c0-4a56-4096-94e6-9d294f3d5a89') as total_metodos_pago;

-- Verificación final: No deben existir registros sin usuario
SELECT 
    'categorias' as tabla,
    COUNT(*) as sin_usuario
FROM categorias
WHERE usuario_id IS NULL
UNION ALL
SELECT 
    'metodos_pago' as tabla,
    COUNT(*) as sin_usuario
FROM metodos_pago
WHERE usuario_id IS NULL;

-- Si ambos son 0, puedes proceder con la migración

