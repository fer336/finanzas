/**
 * 🖼️ Utilidad para compresión automática de imágenes
 * 
 * Comprime imágenes que excedan 2MB manteniendo la calidad visual
 * Reduce progresivamente la calidad hasta obtener un archivo < 2MB
 * 
 * @module imageCompression
 * @created 2026-01-23
 */

/**
 * Comprime una imagen si excede 2MB
 * 
 * @param {File} file - Archivo de imagen a comprimir
 * @param {Function} onProgress - Callback opcional para reportar progreso
 * @returns {Promise<File>} - Archivo comprimido o el original si no necesita compresión
 */
export async function compressImage(file, onProgress = null) {
  const MAX_SIZE_MB = 2;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
  const MAX_DIMENSION = 1920; // Resolución máxima en cualquier lado

  // No comprimir si ya es menor a 2MB
  if (file.size <= MAX_SIZE_BYTES) {
    console.log(`📸 Imagen ya es menor a ${MAX_SIZE_MB}MB (${(file.size / 1024 / 1024).toFixed(2)}MB), no se comprime`);
    return file;
  }

  // Solo comprimir imágenes (no PDFs)
  if (!file.type.startsWith('image/')) {
    console.log('📄 No es una imagen, no se comprime');
    return file;
  }

  // No comprimir GIFs animados
  if (file.type === 'image/gif') {
    console.log('🎬 GIF detectado, no se comprime (puede ser animado)');
    return file;
  }

  console.log(`🔄 Comprimiendo imagen de ${(file.size / 1024 / 1024).toFixed(2)}MB...`);
  if (onProgress) onProgress({ status: 'compressing', step: 'loading' });

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onerror = () => {
      console.error('❌ Error leyendo archivo');
      reject(new Error('Error al leer la imagen'));
    };

    reader.onload = (e) => {
      const img = new Image();
      
      img.onerror = () => {
        console.error('❌ Error cargando imagen');
        reject(new Error('Error al cargar la imagen'));
      };

      img.onload = () => {
        if (onProgress) onProgress({ status: 'compressing', step: 'resizing' });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calcular nuevo tamaño manteniendo aspect ratio
        let width = img.width;
        let height = img.height;

        console.log(`📐 Tamaño original: ${width}x${height}px`);

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height / width) * MAX_DIMENSION);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width / height) * MAX_DIMENSION);
            height = MAX_DIMENSION;
          }
          console.log(`📐 Redimensionado a: ${width}x${height}px`);
        }

        canvas.width = width;
        canvas.height = height;

        // Dibujar imagen en canvas con antialiasing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Intentar comprimir con diferentes calidades
        const tryCompress = (quality) => {
          if (onProgress) {
            onProgress({ 
              status: 'compressing', 
              step: 'encoding', 
              quality: Math.round(quality * 100) 
            });
          }

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                console.error('❌ Error generando blob');
                reject(new Error('Error al comprimir la imagen'));
                return;
              }

              const currentSize = blob.size;
              const currentSizeMB = (currentSize / 1024 / 1024).toFixed(2);
              
              console.log(`🎨 Calidad ${Math.round(quality * 100)}%: ${currentSizeMB}MB`);

              // Éxito: tamaño objetivo alcanzado o calidad mínima
              if (currentSize <= MAX_SIZE_BYTES || quality <= 0.3) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });

                const originalSizeMB = (file.size / 1024 / 1024).toFixed(2);
                const finalSizeMB = (compressedFile.size / 1024 / 1024).toFixed(2);
                const reduction = Math.round((1 - compressedFile.size / file.size) * 100);

                console.log(`✅ Imagen comprimida exitosamente:`);
                console.log(`   📊 ${originalSizeMB}MB → ${finalSizeMB}MB (${reduction}% reducción)`);
                console.log(`   🎯 Calidad final: ${Math.round(quality * 100)}%`);

                if (onProgress) {
                  onProgress({ 
                    status: 'completed', 
                    originalSize: file.size,
                    finalSize: compressedFile.size,
                    reduction 
                  });
                }

                resolve(compressedFile);
              } else {
                // Intentar con menor calidad
                tryCompress(Math.max(0.3, quality - 0.1));
              }
            },
            'image/jpeg',
            quality
          );
        };

        // Iniciar compresión con calidad 0.9 (90%)
        tryCompress(0.9);
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Valida si un archivo es una imagen
 * 
 * @param {File} file - Archivo a validar
 * @returns {boolean} - True si es una imagen
 */
export function isImageFile(file) {
  return file && file.type.startsWith('image/');
}

/**
 * Formatea un tamaño de bytes a formato legible
 * 
 * @param {number} bytes - Tamaño en bytes
 * @param {number} decimals - Decimales a mostrar (default: 2)
 * @returns {string} - Tamaño formateado (ej: "1.5 MB")
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default compressImage;

