import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { ExternalLink, FileText, Image as ImageIcon, X } from 'lucide-react';
import { normalizeDocumentPreviewUrl } from '../../../utils/documentPreviewUrl';

const PDF_LOAD_TIMEOUT_MS = 5000;
const PREVIEW_STATE = {
  VALIDATING: 'validating',
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error',
};

const DocumentPreviewModal = ({ isOpen, onClose, documentUrl, title = 'Vista previa del documento' }) => {
  const closeButtonRef = useRef(null);
  const previousActiveElementRef = useRef(null);
  const timeoutRef = useRef(null);
  const [previewState, setPreviewState] = useState(PREVIEW_STATE.VALIDATING);

  const normalized = normalizeDocumentPreviewUrl(documentUrl);

  useEffect(() => () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      return undefined;
    }

    if (!normalized.isValid) {
      setPreviewState(PREVIEW_STATE.ERROR);
      return undefined;
    }

    if (!normalized.canEmbed) {
      setPreviewState(PREVIEW_STATE.READY);
      return undefined;
    }

    setPreviewState(PREVIEW_STATE.LOADING);

    if (normalized.fileType === 'pdf') {
      timeoutRef.current = window.setTimeout(() => {
        setPreviewState(PREVIEW_STATE.ERROR);
      }, PDF_LOAD_TIMEOUT_MS);
    }

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isOpen, normalized.absoluteUrl, normalized.canEmbed, normalized.fileType, normalized.isValid]);

  useEffect(() => {
    if (!isOpen) return undefined;

    previousActiveElementRef.current = document.activeElement;
    window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = Array.from(
        document.querySelectorAll('[data-document-preview-modal] button, [data-document-preview-modal] a')
      ).filter((element) => !element.disabled && element.offsetParent !== null);

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previousActiveElementRef.current?.focus?.();
    };
  }, [isOpen, onClose, documentUrl]);

  if (!isOpen || !documentUrl) return null;

  const documentName = normalized.documentName || 'documento';
  const isLoading = previewState === PREVIEW_STATE.LOADING;
  const isReady = previewState === PREVIEW_STATE.READY;
  const isError = previewState === PREVIEW_STATE.ERROR;
  const isPdf = normalized.fileType === 'pdf';
  const isImage = normalized.fileType === 'image';
  const safeHref = normalized.href || '#';

  const handleReady = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setPreviewState(PREVIEW_STATE.READY);
  };

  const handleError = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setPreviewState(PREVIEW_STATE.ERROR);
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-end justify-center p-0 md:items-center md:p-6"
      style={{ background: 'rgba(32,36,44,.56)' }}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        data-document-preview-modal
        role="dialog"
        aria-modal="true"
        aria-labelledby="document-preview-title"
        className="flex h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[12px] border border-border bg-popover text-popover-foreground md:h-[86vh] md:rounded-[12px]"
      >
        <header className="flex items-center justify-between gap-3 border-b border-border bg-popover px-5 py-4 md:px-6">
          <div className="min-w-0">
            <h2 id="document-preview-title" className="truncate font-serif text-[19px] font-bold text-foreground">
              {title}
            </h2>
            <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">{documentName}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {normalized.isValid && normalized.canOpenExternal && (
              <a
                href={safeHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-sm border border-border bg-secondary px-3 py-2 text-[12.5px] font-medium text-foreground transition-colors hover:bg-card-hover"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Abrir en nueva pestaña
              </a>
            )}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Cerrar vista previa"
              className="rounded-sm p-2 text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="relative flex min-h-0 flex-1 items-center justify-center bg-background p-4">
          {isLoading && (
            <div className="absolute flex items-center gap-2 rounded-sm border border-border bg-card px-4 py-2 text-[13px] text-muted-foreground">
              Cargando vista previa…
            </div>
          )}

          {isPdf && !isError && normalized.canEmbed && (
            <iframe
              src={safeHref}
              title={documentName}
              sandbox="allow-same-origin allow-downloads allow-popups"
              className={`h-full w-full rounded-sm border border-border bg-secondary ${isReady ? 'opacity-100' : 'opacity-0'}`}
              onLoad={handleReady}
              onError={handleError}
            />
          )}

          {isImage && !isError && normalized.canEmbed && (
            <img
              src={safeHref}
              alt={`Vista previa de ${documentName}`}
              className={`max-h-full max-w-full rounded-sm object-contain ${isReady ? 'opacity-100' : 'opacity-0'}`}
              onLoad={handleReady}
              onError={handleError}
            />
          )}

          {(isError || !normalized.canEmbed) && (
            <div className="flex max-w-lg flex-col items-center gap-4 rounded-md border border-border bg-card p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted text-primary">
                {isImage ? <ImageIcon className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
              </div>
              <div>
                <p className="font-serif text-[18px] font-semibold text-foreground">No se pudo mostrar la vista previa</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {!normalized.isValid
                    ? 'El enlace del documento no es seguro o no pertenece a un origen permitido.'
                    : normalized.canEmbed
                      ? `El navegador no pudo cargar “${documentName}” dentro del modal.`
                      : `El tipo de archivo de “${documentName}” no tiene previsualización integrada.`}
                </p>
              </div>
              {normalized.isValid && normalized.canOpenExternal && (
                <a
                  href={safeHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover active:bg-primary-active"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir en nueva pestaña
                </a>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

DocumentPreviewModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  documentUrl: PropTypes.string,
  title: PropTypes.string,
};

export default DocumentPreviewModal;
