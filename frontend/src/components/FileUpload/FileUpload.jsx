import React, { useState } from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';

const FileUpload = ({ 
  onFileUploaded, 
  onFileRemoved, 
  currentFileUrl = '', 
  prefix = 'comprobantes',
  maxSizeMB = 10,
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
  showPreview = true
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [uploadedFileUrl, setUploadedFileUrl] = useState(currentFileUrl);
  const [dragActive, setDragActive] = useState(false);
  const [compressing, setCompressing] = useState(false);

  /**
   * 🖼️ Comprime imágenes que excedan 2MB
   * Reduce progresivamente la calidad hasta obtener un archivo < 2MB
   */
  const compressImage = async (file) => {
    const MAX_SIZE_MB = 2;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

    // Si ya es menor a 2MB, no comprimir
    if (file.size <= MAX_SIZE_BYTES) {
      console.log('📸 Imagen ya es menor a 2MB, no se comprime');
      return file;
    }

    // Solo comprimir imágenes
    if (!file.type.startsWith('image/')) {
      console.log('📄 No es una imagen, no se comprime');
      return file;
    }

    // No comprimir PDFs o GIFs animados
    if (file.type === 'application/pdf' || file.type === 'image/gif') {
      console.log('🚫 PDF o GIF, no se comprime');
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

          // Calcular nuevo tamaño manteniendo aspect ratio
          let width = img.width;
          let height = img.height;
          const maxDimension = 1920; // Máximo 1920px en cualquier lado

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

          // Dibujar imagen en canvas
          ctx.drawImage(img, 0, 0, width, height);

          // Intentar comprimir con diferentes calidades hasta lograr < 2MB
          const tryCompress = (quality) => {
            canvas.toBlob(
              (blob) => {
                console.log(`🎨 Calidad ${quality}: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
                
                if (blob.size <= MAX_SIZE_BYTES || quality <= 0.3) {
                  // Éxito o calidad mínima alcanzada
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });
                  console.log(`✅ Imagen comprimida: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
                  setCompressing(false);
                  resolve(compressedFile);
                } else {
                  // Intentar con menor calidad
                  tryCompress(quality - 0.1);
                }
              },
              'image/jpeg',
              quality
            );
          };

          // Iniciar compresión con calidad 0.9
          tryCompress(0.9);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const validateFile = (file) => {
    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      return `Inválido file type. Allowed: ${allowedTypes.join(', ')}`;
    }

    // Validate file size (solo validar límite superior de 10MB, la compresión se hará después)
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File too large. Maximum size: ${maxSizeMB}MB`;
    }

    return null;
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      // 🖼️ Comprimir imagen si es necesario
      const processedFile = await compressImage(file);
      setSelectedFile(processedFile);
      setError('');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      // 🖼️ Comprimir imagen si es necesario
      const processedFile = await compressImage(file);
      setSelectedFile(processedFile);
      setError('');
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Use full URL in development, relative in production
      const baseUrl = import.meta.env.MODE === 'production' 
        ? '' 
        : 'http://localhost:8000';
      const endpoint = `${baseUrl}/api/files/upload?prefix=${prefix}`;
      
      console.log('📤 Uploading to:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const data = await response.json();
      console.log('✅ Upload response:', data);
      
      setUploadProgress(100);
      
      // Extract file URL from response
      const fileUrl = data.data?.file_url || data.data?.url || data.file_url || data.url;
      setUploadedFileUrl(fileUrl);
      
      // Notify parent component
      if (onFileUploaded) {
        onFileUploaded({
          ...data.data,
          url: fileUrl,
          file_url: fileUrl
        });
      }

      // Reset selection
      setTimeout(() => {
        setSelectedFile(null);
        setUploadProgress(0);
      }, 1000);

    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err.message || 'Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFileUrl('');
    setSelectedFile(null);
    setError('');
    if (onFileRemoved) {
      onFileRemoved();
    }
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return <FileText className="w-5 h-5" />;
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      return <FileText className="w-5 h-5 text-blue-400" />;
    }
    return <FileText className="w-5 h-5 text-gray-400" />;
  };

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      {!uploadedFileUrl && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
            dragActive 
              ? 'border-[#059467] bg-[#059467]/10' 
              : 'border-white/20 hover:border-white/40'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            onChange={handleFileChange}
            accept={allowedTypes.join(',')}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading || compressing}
          />

          <div className="flex flex-col items-center gap-3 text-center">
            {compressing ? (
              <>
                <Loader className="w-8 h-8 text-[#059467] animate-spin" />
                <div>
                  <p className="text-white font-medium">Comprimiendo imagen...</p>
                  <p className="text-white/50 text-sm mt-1">Reduciendo tamaño a menos de 2MB</p>
                </div>
              </>
            ) : (
              <>
                <Upload className={`w-8 h-8 ${dragActive ? 'text-[#059467]' : 'text-white/60'}`} />
                <div>
                  <p className="text-white font-medium">
                    {dragActive ? 'Suelta el archivo aquí' : 'Click para subir o arrastra y suelta'}
                  </p>
                  <p className="text-white/50 text-sm mt-1">
                    Máximo {maxSizeMB}MB • JPG, PNG, PDF, WEBP
                  </p>
                  <p className="text-white/40 text-xs mt-1">
                    ℹ️ Imágenes mayores a 2MB se comprimirán automáticamente
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Selected File Preview */}
      {selectedFile && !uploadedFileUrl && (
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {getFileIcon(selectedFile.name)}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{selectedFile.name}</p>
                <p className="text-white/50 text-sm">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              disabled={uploading}
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>

          {/* Upload Button */}
          {!uploading && (
            <button
              onClick={uploadFile}
              className="w-full mt-3 px-4 py-2 bg-[#059467] hover:bg-[#048054] rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload File
            </button>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="mt-3">
              <div className="flex items-center gap-2 mb-2">
                <Loader className="w-4 h-4 text-[#059467] animate-spin" />
                <span className="text-white/80 text-sm">Uploading... {uploadProgress}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-[#059467] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Uploaded File Display */}
      {uploadedFileUrl && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-green-400 font-medium mb-1">File uploaded successfully</p>
                {showPreview && uploadedFileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <div className="mt-2">
                    <img
                      src={uploadedFileUrl}
                      alt="Preview"
                      className="max-w-full h-auto rounded-lg border border-white/10 max-h-48 object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <a
                    href={uploadedFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/60 text-sm hover:text-white transition-colors break-all"
                  >
                    {uploadedFileUrl}
                  </a>
                )}
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;

