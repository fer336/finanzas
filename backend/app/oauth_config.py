from authlib.integrations.starlette_client import OAuth
from fastapi.security import HTTPBearer
from app.core.config import settings

# Usar configuración centralizada
auth_settings = settings

# Configuración de seguridad
security = HTTPBearer()

# Configuración OAuth2
oauth = OAuth()
oauth.register(
    name='google',
    server_metadata_url=settings.GOOGLE_CONF_URL,
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    client_kwargs={'scope': settings.GOOGLE_SCOPES},
)