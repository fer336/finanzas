"""
Middleware de seguridad para headers y validaciones
"""
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import logging
import re

logger = logging.getLogger(__name__)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware para agregar headers de seguridad"""
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Headers de seguridad
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # Content Security Policy para APIs
        docs_paths = {"/docs", "/redoc", "/docs/oauth2-redirect"}
        if request.url.path in docs_paths:
            # /docs y /redoc renderizan Swagger UI / ReDoc, que por defecto
            # cargan su JS/CSS desde CDNs (jsdelivr, Google Fonts) — la CSP
            # estricta de las rutas de API dejaba la página en blanco acá.
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self' https://cdn.jsdelivr.net; "
                "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; "
                "img-src 'self' data: https:; "
                "connect-src 'self'; "
                "font-src 'self' https://fonts.gstatic.com; "
                "object-src 'none'; "
                "media-src 'self'; "
                "frame-src 'none';"
            )
        else:
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "connect-src 'self'; "
                "font-src 'self'; "
                "object-src 'none'; "
                "media-src 'self'; "
                "frame-src 'none';"
            )
        
        # HSTS en producción
        if not request.url.hostname in ["localhost", "127.0.0.1"]:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        return response

class RequestValidationMiddleware(BaseHTTPMiddleware):
    """Middleware para validar requests maliciosos"""
    
    # Patrones de ataques comunes
    SUSPICIOUS_PATTERNS = [
        r"<script[^>]*>.*?</script>",  # XSS
        r"javascript:",                # JavaScript URLs
        r"vbscript:",                 # VBScript URLs
        r"onload\s*=",               # Event handlers
        r"onerror\s*=",
        r"onclick\s*=",
        r"union\s+select",           # SQL Injection
        r"drop\s+table",
        r"insert\s+into",
        r"delete\s+from",
        r"update\s+.*\s+set",
        r"exec\s*\(",               # Command injection
        r"system\s*\(",
        r"eval\s*\(",
        r"\.\.\/",                  # Directory traversal
        r"\.\.\\",
    ]
    
    def __init__(self, app):
        super().__init__(app)
        self.compiled_patterns = [re.compile(pattern, re.IGNORECASE) for pattern in self.SUSPICIOUS_PATTERNS]
    
    async def dispatch(self, request: Request, call_next):
        # Validar URL
        if await self._is_suspicious_content(str(request.url)):
            logger.warning(f"Suspicious URL detected: {request.url} from IP: {self._get_client_ip(request)}")
            return Response(
                content="Request blocked due to security policy",
                status_code=400
            )
        
        # Validar headers
        for header_name, header_value in request.headers.items():
            if await self._is_suspicious_content(header_value):
                logger.warning(f"Suspicious header {header_name} detected from IP: {self._get_client_ip(request)}")
                return Response(
                    content="Request blocked due to security policy",
                    status_code=400
                )
        
        # Validar query parameters
        for param_name, param_value in request.query_params.items():
            if await self._is_suspicious_content(param_value):
                logger.warning(f"Suspicious query parameter {param_name} detected from IP: {self._get_client_ip(request)}")
                return Response(
                    content="Request blocked due to security policy",
                    status_code=400
                )
        
        return await call_next(request)
    
    async def _is_suspicious_content(self, content: str) -> bool:
        """Verificar si el contenido contiene patrones sospechosos"""
        if not content:
            return False
        
        for pattern in self.compiled_patterns:
            if pattern.search(content):
                return True
        
        return False
    
    def _get_client_ip(self, request: Request) -> str:
        """Obtener IP del cliente"""
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware para logging detallado de requests"""
    
    async def dispatch(self, request: Request, call_next):
        import time
        
        start_time = time.time()
        client_ip = self._get_client_ip(request)
        
        # Log del request
        logger.info(
            f"Request: {request.method} {request.url.path} "
            f"from IP: {client_ip} "
            f"User-Agent: {request.headers.get('user-agent', 'unknown')}"
        )
        
        # Procesar request
        response = await call_next(request)
        
        # Log de la respuesta
        process_time = time.time() - start_time
        logger.info(
            f"Response: {response.status_code} "
            f"for {request.method} {request.url.path} "
            f"in {process_time:.3f}s "
            f"from IP: {client_ip}"
        )
        
        # Agregar header de tiempo de procesamiento
        response.headers["X-Process-Time"] = str(process_time)
        
        return response
    
    def _get_client_ip(self, request: Request) -> str:
        """Obtener IP del cliente"""
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"