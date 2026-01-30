"""
Validadores personalizados mejorados para modelos Pydantic
"""
import re
from typing import Any
from pydantic import validator
from decimal import Decimal, InvalidOperation
import logging

logger = logging.getLogger(__name__)

class ValidationMixin:
    """Mixin con validadores comunes para modelos"""
    
    @staticmethod
    def validate_email(email: str) -> str:
        """Validar formato de email"""
        if not email:
            raise ValueError("Email es requerido")
        
        # Patrón mejorado de email
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            raise ValueError("Formato de email inválido")
        
        # Verificar longitud
        if len(email) > 254:
            raise ValueError("Email demasiado largo")
        
        return email.lower().strip()
    
    @staticmethod
    def validate_name(name: str, field_name: str = "Nombre") -> str:
        """Validar nombres de personas"""
        if not name:
            raise ValueError(f"{field_name} es requerido")
        
        name = name.strip()
        
        # Verificar longitud
        if len(name) < 2:
            raise ValueError(f"{field_name} debe tener al menos 2 caracteres")
        if len(name) > 100:
            raise ValueError(f"{field_name} demasiado largo (máximo 100 caracteres)")
        
        # Verificar caracteres válidos (letras, espacios, acentos, guiones)
        name_pattern = r'^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-\'\.]+$'
        if not re.match(name_pattern, name):
            raise ValueError(f"{field_name} contiene caracteres no válidos")
        
        # Capitalizar primera letra de cada palabra
        return ' '.join(word.capitalize() for word in name.split())
    
    @staticmethod
    def validate_description(description: str, max_length: int = 500) -> str:
        """Validar descripciones"""
        if not description:
            return ""
        
        description = description.strip()
        
        if len(description) > max_length:
            raise ValueError(f"Descripción demasiado larga (máximo {max_length} caracteres)")
        
        # Remover caracteres peligrosos pero mantener funcionalidad
        dangerous_patterns = [
            r'<script[^>]*>.*?</script>',
            r'javascript:',
            r'vbscript:',
            r'onload\s*=',
            r'onerror\s*=',
            r'onclick\s*='
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, description, re.IGNORECASE):
                raise ValueError("Descripción contiene contenido no permitido")
        
        return description
    
    @staticmethod
    def validate_amount(amount: Any) -> Decimal:
        """Validar montos monetarios"""
        try:
            if isinstance(amount, str):
                # Remover espacios y comas
                amount = amount.replace(' ', '').replace(',', '')
            
            decimal_amount = Decimal(str(amount))
            
            # Verificar que no sea negativo
            if decimal_amount < 0:
                raise ValueError("El monto no puede ser negativo")
            
            # Verificar límite máximo razonable (10 millones)
            if decimal_amount > Decimal('10000000'):
                raise ValueError("Monto demasiado grande")
            
            # Verificar máximo 2 decimales
            if decimal_amount.as_tuple().exponent < -2:
                raise ValueError("Máximo 2 decimales permitidos")
            
            return decimal_amount
            
        except (InvalidOperation, ValueError) as e:
            raise ValueError(f"Formato de monto inválido: {str(e)}")
    
    @staticmethod
    def validate_currency(currency: str) -> str:
        """Validar código de moneda"""
        if not currency:
            raise ValueError("Moneda es requerida")
        
        currency = currency.upper().strip()
        
        # Lista de monedas válidas
        valid_currencies = [
            'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY',
            'SEK', 'NZD', 'MXN', 'SGD', 'HKD', 'NOK', 'TRY', 'ZAR',
            'BRL', 'INR', 'KRW', 'RUB', 'ARS', 'CLP', 'COP', 'PEN',
            'UYU', 'BOB', 'PYG', 'VES'
        ]
        
        if currency not in valid_currencies:
            raise ValueError(f"Moneda '{currency}' no válida")
        
        return currency
    
    @staticmethod
    def validate_date_string(date_str: str) -> str:
        """Validar formato de fecha"""
        if not date_str:
            raise ValueError("Fecha es requerida")
        
        # Verificar formato ISO (YYYY-MM-DD o YYYY-MM-DD HH:MM:SS)
        date_patterns = [
            r'^\d{4}-\d{2}-\d{2}$',
            r'^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$',
            r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?$'
        ]
        
        for pattern in date_patterns:
            if re.match(pattern, date_str):
                return date_str
        
        raise ValueError("Formato de fecha inválido. Use YYYY-MM-DD o ISO format")
    
    @staticmethod
    def validate_phone(phone: str) -> str:
        """Validar número de teléfono"""
        if not phone:
            return ""
        
        phone = phone.strip()
        
        # Remover caracteres no numéricos excepto +, -, (, ), espacios
        phone = re.sub(r'[^\d\+\-\(\)\s]', '', phone)
        
        # Verificar longitud mínima y máxima
        digits_only = re.sub(r'[^\d]', '', phone)
        if len(digits_only) < 7:
            raise ValueError("Número de teléfono demasiado corto")
        if len(digits_only) > 15:
            raise ValueError("Número de teléfono demasiado largo")
        
        return phone
    
    @staticmethod
    def validate_url(url: str) -> str:
        """Validar URL"""
        if not url:
            return ""
        
        url = url.strip()
        
        # Patrón básico de URL
        url_pattern = r'^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$'
        
        if not re.match(url_pattern, url):
            raise ValueError("Formato de URL inválido")
        
        # Verificar que no sea una URL peligrosa
        dangerous_domains = ['javascript', 'data', 'vbscript', 'file']
        for domain in dangerous_domains:
            if url.lower().startswith(f'{domain}:'):
                raise ValueError("URL no permitida")
        
        return url

class SecurityValidationMixin:
    """Mixin con validaciones de seguridad adicionales"""
    
    @staticmethod
    def sanitize_html_input(text: str) -> str:
        """Sanitizar entrada HTML básica"""
        if not text:
            return ""
        
        # Escapar caracteres HTML básicos
        html_escape_table = {
            "&": "&amp;",
            '"': "&quot;",
            "'": "&#x27;",
            ">": "&gt;",
            "<": "&lt;",
        }
        
        sanitized = text
        for char, escape in html_escape_table.items():
            sanitized = sanitized.replace(char, escape)
        
        return sanitized
    
    @staticmethod
    def validate_no_sql_injection(text: str) -> str:
        """Validar que no contenga patrones de SQL injection"""
        if not text:
            return text
        
        # Patrones comunes de SQL injection
        sql_patterns = [
            r"(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)",
            r"(--|#|/\*|\*/)",
            r"(\b(or|and)\s+\d+\s*=\s*\d+)",
            r"(\b(or|and)\s+['\"]?\w+['\"]?\s*=\s*['\"]?\w+['\"]?)"
        ]
        
        for pattern in sql_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                logger.warning(f"Posible intento de SQL injection detectado: {pattern}")
                raise ValueError("Entrada contiene patrones no permitidos")
        
        return text