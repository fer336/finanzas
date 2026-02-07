-- Agregar columna google_id a la tabla usuarios si no existe
-- Fecha: 2026-02-06

DO $$
BEGIN
    -- Verificar si la columna google_id ya existe
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'usuarios'
        AND column_name = 'google_id'
    ) THEN
        -- Agregar la columna google_id
        ALTER TABLE usuarios
        ADD COLUMN google_id VARCHAR(255);
        
        -- Agregar índice para mejorar búsquedas
        CREATE INDEX idx_usuarios_google_id ON usuarios(google_id);
        
        RAISE NOTICE 'Columna google_id agregada exitosamente a la tabla usuarios';
    ELSE
        RAISE NOTICE 'La columna google_id ya existe en la tabla usuarios';
    END IF;
END
$$;
