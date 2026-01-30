"""
Middleware de Rate Limiting para prevenir abuso de API
"""
import time
import asyncio
from typing import Dict, Tuple
from fastapi import Request, Response, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
import logging

logger = logging.getLogger(__name__)

class RateLimitingMiddleware(BaseHTTPMiddleware):
    """Middleware para limitar requests por IP"""
    
    def __init__(
        self, 
        app, 
        requests_per_minute: int = 60,
        requests_per_hour: int = 1000,
        burst_requests: int = 10
    ):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self.burst_requests = burst_requests
        
        # Almacenar requests por IP: {ip: [(timestamp, count_minute, count_hour)]}
        self.request_counts: Dict[str, Tuple[float, int, int]] = {}
        self.burst_counts: Dict[str, Tuple[float, int]] = {}
        
        # Limpiar contadores cada 5 minutos
        asyncio.create_task(self._cleanup_old_entries())
    
    async def dispatch(self, request: Request, call_next):
        """Procesar request con rate limiting"""
        
        # Excluir endpoints que no necesitan rate limiting
        excluded_paths = [
            "/health",
            "/docs",
            "/openapi.json",
            "/redoc",
            "/favicon.ico"
        ]
        
        # Si es un endpoint excluido, procesar directamente sin rate limiting
        if any(request.url.path.startswith(path) for path in excluded_paths):
            return await call_next(request)
        
        client_ip = self._get_client_ip(request)
        current_time = time.time()
        
        # Verificar burst limiting (10 requests en 10 segundos)
        if await self._is_burst_limited(client_ip, current_time):
            logger.warning(f"Burst rate limit exceeded for IP: {client_ip}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Demasiadas requests en poco tiempo. Intenta de nuevo en unos segundos.",
                headers={"Retry-After": "10"}
            )
        
        # Verificar rate limiting normal
        if await self._is_rate_limited(client_ip, current_time):
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Límite de requests alcanzado. Intenta de nuevo más tarde.",
                headers={"Retry-After": "60"}
            )
        
        # Procesar request
        response = await call_next(request)
        
        # Agregar headers informativos
        response.headers["X-RateLimit-Limit"] = str(self.requests_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(
            max(0, self.requests_per_minute - self._get_minute_count(client_ip, current_time))
        )
        
        return response
    
    def _get_client_ip(self, request: Request) -> str:
        """Obtener IP del cliente considerando proxies"""
        # Verificar headers de proxy
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"
    
    async def _is_burst_limited(self, client_ip: str, current_time: float) -> bool:
        """Verificar si IP está en burst limit"""
        if client_ip not in self.burst_counts:
            self.burst_counts[client_ip] = (current_time, 1)
            return False
        
        last_time, count = self.burst_counts[client_ip]
        
        # Si han pasado más de 10 segundos, resetear
        if current_time - last_time > 10:
            self.burst_counts[client_ip] = (current_time, 1)
            return False
        
        # Incrementar contador
        count += 1
        self.burst_counts[client_ip] = (last_time, count)
        
        return count > self.burst_requests
    
    async def _is_rate_limited(self, client_ip: str, current_time: float) -> bool:
        """Verificar si IP está rate limited"""
        if client_ip not in self.request_counts:
            self.request_counts[client_ip] = (current_time, 1, 1)
            return False
        
        last_time, minute_count, hour_count = self.request_counts[client_ip]
        
        # Calcular nuevos contadores
        new_minute_count = self._get_minute_count(client_ip, current_time) + 1
        new_hour_count = self._get_hour_count(client_ip, current_time) + 1
        
        # Actualizar contadores
        self.request_counts[client_ip] = (current_time, new_minute_count, new_hour_count)
        
        # Verificar límites
        return (new_minute_count > self.requests_per_minute or 
                new_hour_count > self.requests_per_hour)
    
    def _get_minute_count(self, client_ip: str, current_time: float) -> int:
        """Obtener contador de requests en el último minuto"""
        if client_ip not in self.request_counts:
            return 0
        
        last_time, minute_count, _ = self.request_counts[client_ip]
        
        # Si ha pasado más de un minuto, resetear
        if current_time - last_time > 60:
            return 0
        
        return minute_count
    
    def _get_hour_count(self, client_ip: str, current_time: float) -> int:
        """Obtener contador de requests en la última hora"""
        if client_ip not in self.request_counts:
            return 0
        
        last_time, _, hour_count = self.request_counts[client_ip]
        
        # Si ha pasado más de una hora, resetear
        if current_time - last_time > 3600:
            return 0
        
        return hour_count
    
    async def _cleanup_old_entries(self):
        """Limpiar entradas antiguas periódicamente"""
        while True:
            await asyncio.sleep(300)  # Cada 5 minutos
            current_time = time.time()
            
            # Limpiar request_counts
            expired_ips = []
            for ip, (last_time, _, _) in self.request_counts.items():
                if current_time - last_time > 3600:  # 1 hora
                    expired_ips.append(ip)
            
            for ip in expired_ips:
                del self.request_counts[ip]
            
            # Limpiar burst_counts
            expired_burst_ips = []
            for ip, (last_time, _) in self.burst_counts.items():
                if current_time - last_time > 60:  # 1 minuto
                    expired_burst_ips.append(ip)
            
            for ip in expired_burst_ips:
                del self.burst_counts[ip]
            
            if expired_ips or expired_burst_ips:
                logger.info(f"Limpieza de rate limiting: {len(expired_ips)} IPs regulares, {len(expired_burst_ips)} IPs burst")