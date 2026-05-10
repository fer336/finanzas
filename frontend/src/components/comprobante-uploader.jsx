import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';

export function ComprobanteUploader({ onFileUpload, existingFile, transaccionId, disabled = false }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  /**
   * 🖼️ Comprime imágenes que excedan 2MB
   */
  const compressImage = async (file) => {
    const MAX_SIZE_MB = 2;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

    if (file.size <= MAX_SIZE_BYTES || !file.type.startsWith('image/') || file.type === 'application/pdf') {
      return file;
    }

    console.log(`🔄 Comprimiendo imagen de ${(file.size / 1024 / 1024).toFixed(2)}MB...`);
    setCompressing(true);

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          let width = img.width;
          let height = img.height;
          const maxDimension = 1920;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          const tryCompress = (quality) => {
            canvas.toBlob(
              (blob) => {
                if (blob.size <= MAX_SIZE_BYTES || quality <= 0.3) {
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });
                  console.log(`✅ Comprimido: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
                  setCompressing(false);
                  resolve(compressedFile);
                } else {
                  tryCompress(quality - 0.1);
                }
              },
              'image/jpeg',
              quality
            );
          };

          tryCompress(0.9);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const processedFile = await compressImage(files[0]);
      handleFileUpload(processedFile);
    }
  };

  const handleFileSelect = async (e) => {
    if (disabled) return;
    
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const processedFile = await compressImage(files[0]);
      handleFileUpload(processedFile);
    }
  };

  const handleFileUpload = async (file) => {
    // Validaciones
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    
    if (file.size > maxSize) {
      setError('El archivo es demasiado grande. Máximo 10MB.');
      return;
    }
    
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de archivo no permitido. Use JPG, PNG o PDF.');
      return;
    }

    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      // Simular progreso de subida
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Subir archivo a MinIO via backend API
      const backendBaseUrl = import.meta.env.MODE === 'production' ? '' : 'http://localhost:8000';
      const endpoint = `${backendBaseUrl}/api/files/upload?prefix=comprobantes`;

      const body = new FormData();
      body.append('file', file);

      const response = await fetch(endpoint, {
        method: 'POST',
        body
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Error al subir el archivo');
      }

      const data = await response.json();
      const fileUrl = data.data?.file_url || data.data?.url || data.file_url || data.url;

      if (!fileUrl) {
        throw new Error('El servidor no devolvió la URL del comprobante');
      }

      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Llamar callback con la URL del archivo subido a MinIO
      if (onFileUpload) {
        await onFileUpload({
          url: fileUrl,
          file_url: fileUrl,
          name: file.name,
          size: file.size,
          type: file.type
        }, transaccionId);
      }
      
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
      
    } catch (err) {
      console.error('Error subiendo archivo:', err);
      setError(err.message || 'Error al subir el archivo. Inténtalo de nuevo.');
      setUploading(false);
      setUploadProgress(0);
    }
  };


  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (existingFile) {
    return (
      <Card className="border-green-200 bg-green-50/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-green-700">Comprobante subido</p>
                <p className="text-xs text-green-600">
                  {existingFile.name || 'Archivo adjunto'} 
                  {existingFile.size && ` • ${formatFileSize(existingFile.size)}`}
                </p>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => window.open(existingFile.url || existingFile.data, '_blank')}
            >
              Ver
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <Card 
        className={`
          border-2 border-dashed transition-colors cursor-pointer
          ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${disabled || compressing ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !compressing && fileInputRef.current?.click()}
      >
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-2 text-center">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {compressing ? 'Comprimiendo imagen...' : disabled ? 'Subida deshabilitada' : 'Subir comprobante'}
              </p>
              <p className="text-xs text-muted-foreground">
                {compressing 
                  ? 'Reduciendo tamaño a menos de 2MB'
                  : disabled 
                    ? 'Complete la transacción primero'
                    : 'Arrastra archivos aquí o haz clic para seleccionar'
                }
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, PDF (máx. 10MB) • Imágenes &gt;2MB se comprimen auto
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".jpg,.jpeg,.png,.pdf"
        onChange={handleFileSelect}
        disabled={disabled}
      />

      {uploading && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Subiendo archivo...</span>
                <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">{error}</span>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setError(null)}
                className="ml-auto"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}