
from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.responses import JSONResponse, RedirectResponse
from datetime import timedelta
import urllib.parse
import httpx
import os

from app.core.dependencies import CurrentUser
from app.core.security import is_email_authorized, create_access_token
from app.core.config import settings
from app.oauth_config import oauth
from app.services.user_service import UserService
from app.models.user import User, UserUpdateName, UserUpdatePais
from app.database import get_db
from sqlalchemy.orm import Session

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.get("/me", response_model=User)
async def get_current_user_info(current_user: CurrentUser):
    """Obtener información del usuario actual"""
    print(f"API /auth/me called successfully for user: {current_user.email}")
    return current_user

@router.patch("/me/name", response_model=User)
async def update_user_name(
    name_data: UserUpdateName,
    current_user: CurrentUser,
    db: Session = Depends(get_db)
):
    """Actualizar nombre del usuario"""
    user_service = UserService(db)
    updated_user = await user_service.update_user_name(current_user.id, name_data)
    if not updated_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return updated_user

@router.patch("/me/pais", response_model=User)
async def update_user_country(
    country_data: UserUpdatePais,
    current_user: CurrentUser,
    db: Session = Depends(get_db)
):
    """Actualizar país del usuario"""
    user_service = UserService(db)
    updated_user = await user_service.update_user_country(current_user.id, country_data)
    if not updated_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return updated_user

@router.post("/test-auth")
async def test_auth_endpoint(current_user: CurrentUser):
    """Endpoint de prueba para verificar autenticación"""
    return {
        "message": "Autenticación exitosa",
        "user_email": current_user.email,
        "user_id": current_user.id
    }

# === GOOGLE OAUTH ENDPOINTS ===

@router.get("/google")
async def google_auth(request: Request):
    """Iniciar autenticación con Google OAuth2"""
    try:
        print(f"\n{'='*100}")
        print(f"🚀 INICIANDO FLUJO OAUTH - /auth/google")
        print(f"{'='*100}")

        # Detectar automáticamente el entorno basándose en el host de la request
        host = request.headers.get("host", "")
        is_production = "finanzas.qeva.xyz" in host or "qeva.xyz" in host or os.path.exists("/run/secrets/backend.env")
        backend_url = settings.PRODUCTION_BACKEND_URL if is_production else settings.DEV_BACKEND_URL
        redirect_uri = f"{backend_url}/auth/google/callback"

      
        for key, value in request.headers.items():
            print(f"   {key}: {value}")
        print(f"{'='*100}\n")

        return await oauth.google.authorize_redirect(request, redirect_uri, prompt="select_account")

    except Exception as e:
        import traceback
     
        raise HTTPException(status_code=500, detail=f"Error iniciando OAuth: {str(e)}")

@router.get("/google/dev")
async def google_auth_dev(request: Request):
    """Endpoint de desarrollo para OAuth2"""
    print(f"🔐 Starting OAuth dev flow")
    print(f"🔐 Session before OAuth: {request.session}")
    
    # Manual state generation and storage
    import secrets
    state = secrets.token_urlsafe(32)
    request.session['oauth_state'] = state
    print(f"🔐 Generated state: {state}")
    print(f"🔐 Session after state: {request.session}")
    
    redirect_uri = "http://localhost:3000/oauth-callback"
    
    # Build OAuth URL manually to ensure state is included
    from urllib.parse import urlencode
    oauth_params = {
        'client_id': settings.GOOGLE_CLIENT_ID,
        'redirect_uri': redirect_uri,
        'scope': settings.GOOGLE_SCOPES,
        'response_type': 'code',
        'state': state,
        'prompt': 'select_account'
    }
    oauth_url = f"https://accounts.google.com/o/oauth2/auth?{urlencode(oauth_params)}"
    print(f"🔐 OAuth URL: {oauth_url}")
    
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=oauth_url, status_code=302)

@router.get("/google/callback")
async def google_callback(request: Request):
    """Callback de Google OAuth2 - Auto detecta entorno"""
    try:
        print(f"\n{'='*100}")
        print(f"🔐 GOOGLE OAUTH CALLBACK INICIADO")
        print(f"{'='*100}")
        
        # Detectar entorno automáticamente basándose en el host de la request
        host = request.headers.get("host", "")
        is_production = "finanzas.qeva.xyz" in host or "qeva.xyz" in host or os.path.exists("/run/secrets/backend.env")
        frontend_url_base = settings.PRODUCTION_FRONTEND_URL if is_production else settings.DEV_FRONTEND_URL
        
        print(f"🌐 CONFIGURACIÓN DE ENTORNO:")
        print(f"   Host: {host}")
        print(f"   Is Production: {is_production}")
        print(f"   Environment var: {settings.environment}")
        print(f"   Frontend URL: {frontend_url_base}")
        print(f"   Query params: {request.query_params}")
        print(f"")
        
        token = await oauth.google.authorize_access_token(request)
        print(f"Token received: {list(token.keys()) if token else 'None'}")

        # Obtener user_info
        user_info = None
        if token and 'userinfo' in token:
            print("Using userinfo from token")
            user_info = token['userinfo']
        elif token and 'access_token' in token:
            print("Using userinfo endpoint")
            resp = await oauth.google.get('userinfo', token=token)
            user_info = resp.json()
        elif token and 'id_token' in token:
            print("Trying id_token as fallback")
            try:
                user_info = await oauth.google.parse_id_token(request, token)
            except Exception as e:
                print(f"Failed to parse id_token: {e}")
                resp = await oauth.google.get('userinfo', token=token)
                user_info = resp.json()
        else:
            print(f"No valid token found")
            raise HTTPException(status_code=400, detail="No se pudo obtener token válido")

        print(f"👤 INFORMACIÓN DEL USUARIO DE GOOGLE:")
        print(f"   User info completo: {user_info}")
        email = user_info.get('email')
        name = user_info.get('name')
        picture = user_info.get('picture')
        google_id = user_info.get('sub') or user_info.get('id')
        print(f"   Email: {email}")
        print(f"   Name: {name}")
        picture_display = picture[:50] + "..." if picture else 'N/A'
        print(f"   Picture: {picture_display}")
        print(f"   Google ID: {google_id}")
        print(f"")

        if not email:
            print(f"❌ ERROR: Email no disponible en la respuesta de Google")
            raise HTTPException(status_code=400, detail="Email no disponible")

        print(f"🔍 VALIDACIÓN DE USUARIO EN BASE DE DATOS POSTGRESQL")
        print(f"{'='*100}")
        print(f"   Buscando usuario con email: {email}")
        print(f"")
        
        # Buscar usuario en la base de datos PostgreSQL
        # SOLO se permite acceso si el usuario existe Y está activo
        from app.database import get_db
        from app.repositories.user_repository_pg import UserRepositoryPG
        
        db = next(get_db())
        user_repo_pg = UserRepositoryPG(db)
        existing_user_obj = await user_repo_pg.get_by_email(email)
        
        # Convert to dict for compatibility
        existing_user = None
        if existing_user_obj:
            existing_user = {
                "id": str(existing_user_obj.id),
                "email": existing_user_obj.email,
                "full_name": existing_user_obj.full_name,
                "is_active": existing_user_obj.is_active,
                "picture": existing_user_obj.picture,
                "google_id": existing_user_obj.google_id if hasattr(existing_user_obj, 'google_id') else None
            }
        
        print(f"")
        print(f"📊 RESULTADO DE BÚSQUEDA:")
        print(f"   existing_user es None: {existing_user is None}")
        print(f"   existing_user tipo: {type(existing_user)}")
        if existing_user:
            print(f"   existing_user keys: {list(existing_user.keys())}")
            print(f"   existing_user data: {existing_user}")
        print(f"")

        if not existing_user:
            # Usuario no existe en base de datos - rechazar acceso
            print(f"❌ ACCESO DENEGADO: USUARIO NO ENCONTRADO")
            print(f"{'='*100}")
            print(f"   Email buscado: {email}")
            print(f"   Razón: El usuario no existe en la base de datos PostgreSQL")
            print(f"   Acción: Redirigiendo al frontend con auth=notfound")
            frontend_url = f"{frontend_url_base}/?auth=notfound&email={urllib.parse.quote(email)}&user={urllib.parse.quote(name or email)}"
            print(f"   Frontend URL: {frontend_url}")
            print(f"{'='*100}\n")
            db.close()
            return RedirectResponse(url=frontend_url, status_code=302)
        
        # Usuario existe - verificar que esté activo
        # Los campos vienen en snake_case: active, id, email, full_name, picture, etc.
        # 🔒 REGLA: Solo usuarios con active=true pueden ingresar
        is_active = existing_user.get("is_active", existing_user.get("active", False))
        
        print(f"🔒 Verificación de acceso:")
        print(f"   Email: {email}")
        print(f"   Campo 'is_active': {is_active} (tipo: {type(is_active).__name__})")
        
        if not is_active:
            print(f"❌ ACCESO DENEGADO - Usuario {email} está inactivo (is_active={is_active})")
            print(f"   El campo 'is_active' debe ser true para permitir el ingreso")
            frontend_url = f"{frontend_url_base}/?auth=inactive&email={urllib.parse.quote(email)}&user={urllib.parse.quote(name or email)}"
            print(f"   Redirecting a: {frontend_url}")
            return RedirectResponse(url=frontend_url, status_code=302)
        
        user_id = existing_user.get("id") or existing_user.get("Id")
        print(f"✅ ACCESO PERMITIDO - Usuario: {email} (ID: {user_id}, is_active: true)")

        # Actualizar datos de Google (picture, full_name, google_id) siempre que haga login
        google_full_name = name or email
        google_id = user_info.get('sub') or user_info.get('id')
        
        current_picture = existing_user.get("picture") or existing_user.get("Picture") or ""
        current_fullname = existing_user.get("full_name") or existing_user.get("FullName") or ""
        current_google_id = existing_user.get("google_id") or existing_user.get("GoogleId") or ""
        
        needs_picture_update = current_picture != picture
        needs_fullname_update = not current_fullname.strip() or current_fullname != google_full_name
        needs_googleid_update = not current_google_id.strip() or current_google_id != google_id
        
        print(f"📊 Verificando actualizaciones necesarias:")
        current_pic_display = current_picture[:50] + "..." if current_picture else 'vacío'
        new_pic_display = picture[:50] + "..." if picture else 'vacío'
        print(f"   picture: '{current_pic_display}' → '{new_pic_display}' (actualizar: {needs_picture_update})")
        print(f"   full_name: '{current_fullname}' → '{google_full_name}' (actualizar: {needs_fullname_update})")
        print(f"   google_id: '{current_google_id}' → '{google_id}' (actualizar: {needs_googleid_update})")

        if needs_picture_update or needs_fullname_update or needs_googleid_update:
            print(f"📝 Actualizando datos de Google para usuario existente:")
            update_data = {}
            
            if needs_fullname_update:
                update_data["full_name"] = google_full_name
                print(f"   ✓ Actualizando full_name")
            
            if needs_picture_update:
                update_data["picture"] = picture
                print(f"   ✓ Actualizando picture")
            
            if needs_googleid_update:
                update_data["google_id"] = google_id
                print(f"   ✓ Actualizando google_id")

            result = await user_repo_pg.update(user_id, update_data)
            if result:
                print(f"✅ Usuario actualizado exitosamente para {email}")
            else:
                print(f"⚠️ Advertencia: No se pudo actualizar el usuario {email}")
        else:
            print(f"ℹ️ Usuario ya está actualizado: {email}")
        
        # Close DB session
        db.close()

        # Generar JWT token
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = create_access_token(
            data={"sub": email, "name": name, "picture": picture},
            expires_delta=access_token_expires
        )

        print(f"Generated JWT token for {email}, expires in {settings.access_token_expire_minutes} minutes")

        frontend_url = f"{frontend_url_base}/?auth=success&token={access_token}&user={urllib.parse.quote(name or email)}&email={urllib.parse.quote(email)}&picture={urllib.parse.quote(picture or '')}"

        print(f"Redirecting to frontend: {frontend_url[:100]}...")
        return RedirectResponse(url=frontend_url, status_code=302)

    except Exception as e:
        import traceback
        print(f"\n{'='*100}")
        print(f"❌ ERROR CRÍTICO EN OAUTH CALLBACK")
        print(f"{'='*100}")
        print(f"Error tipo: {type(e).__name__}")
        print(f"Error mensaje: {str(e)}")
        print(f"")
        print(f"📍 TRACEBACK COMPLETO:")
        print(traceback.format_exc())
        print(f"{'='*100}\n")

        # Redirigir al frontend con error detallado
        error_msg = f"{type(e).__name__}: {str(e)}"
        frontend_url = f"{settings.PRODUCTION_FRONTEND_URL if 'finanzas.qeva.xyz' in request.headers.get('host', '') else settings.DEV_FRONTEND_URL}/?auth=error&message={urllib.parse.quote(error_msg)}"
        print(f"Redirecting to frontend with error: {frontend_url[:150]}...")
        return RedirectResponse(url=frontend_url, status_code=302)

@router.get("/oauth-callback/dev", include_in_schema=False)
async def frontend_oauth_callback_dev(request: Request):
    """Callback desde frontend para desarrollo"""
    try:
        print(f"Frontend dev callback received with query params: {request.query_params}")
        
        # Obtener parámetros
        code = request.query_params.get('code')
        state = request.query_params.get('state')
        
        if not code:
            raise HTTPException(status_code=400, detail="Código de autorización faltante")
        
        # Intercambiar código por tokens
        import httpx
        token_data = {
            'client_id': settings.GOOGLE_CLIENT_ID,
            'client_secret': settings.GOOGLE_CLIENT_SECRET,
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': "http://localhost:3000/oauth-callback"
        }
        
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                'https://oauth2.googleapis.com/token',
                data=token_data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )
            
            if token_response.status_code != 200:
                print(f"Token error: {token_response.text}")
                raise HTTPException(status_code=400, detail=f"Error obteniendo token: {token_response.text}")
            
            tokens = token_response.json()
            access_token = tokens.get('access_token')
            
            # Obtener información del usuario
            user_response = await client.get(
                'https://www.googleapis.com/oauth2/v2/userinfo',
                headers={'Authorization': f'Bearer {access_token}'}
            )
            
            if user_response.status_code != 200:
                raise HTTPException(status_code=400, detail="Error obteniendo información del usuario")
            
            user_info = user_response.json()
            
            # Verificar email autorizado
            email = user_info.get('email', '')
            if not await is_email_authorized(email):
                return RedirectResponse(
                    url=f"http://localhost:3000/?auth=unauthorized&email={email}&user={user_info.get('name', '')}"
                )
            
            # Generar JWT token
            from app.core.security import create_access_token
            jwt_token = create_access_token(data={"sub": email, "email": email})
            
            # Redireccionar al frontend con éxito
            return RedirectResponse(
                url=f"http://localhost:3000/?auth=success&token={jwt_token}&user={user_info.get('name', '')}&email={email}&picture={user_info.get('picture', '')}"
            )
            
    except Exception as e:
        print(f"Error in frontend dev callback: {str(e)}")
        return RedirectResponse(url=f"http://localhost:3000/?auth=error&message={str(e)}")

@router.get("/google/callback/dev", include_in_schema=False)
async def google_callback_dev(request: Request):
    """Callback de desarrollo"""
    try:
        print(f"Dev callback received with query params: {request.query_params}")
        print(f"Request URL: {request.url}")
        print(f"🔐 Session in callback: {request.session}")
        print(f"🔐 Session keys: {list(request.session.keys()) if hasattr(request.session, 'keys') else 'No keys method'}")
        
        # Manual state verification
        received_state = request.query_params.get('state')
        stored_state = request.session.get('oauth_state')
        print(f"🔐 Received state: {received_state}")
        print(f"🔐 Stored state: {stored_state}")
        
        if not received_state or received_state != stored_state:
            raise HTTPException(status_code=400, detail=f"Estado OAuth inválido. Recibido: {received_state}, Esperado: {stored_state}")
        
        # Clear the used state
        request.session.pop('oauth_state', None)
        
        # Manual token exchange
        code = request.query_params.get('code')
        if not code:
            raise HTTPException(status_code=400, detail="Código de autorización no recibido")
        
        print(f"🔐 Authorization code: {code}")
        
        # Exchange code for token manually
        import httpx
        token_data = {
            'client_id': settings.GOOGLE_CLIENT_ID,
            'client_secret': settings.GOOGLE_CLIENT_SECRET,
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': "http://localhost:3000/oauth-callback"
        }
        
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                'https://oauth2.googleapis.com/token',
                data=token_data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )
            token = token_response.json()
            print(f"🔐 Token response: {token}")
            
            if 'error' in token:
                raise HTTPException(status_code=400, detail=f"Error en intercambio de token: {token.get('error_description', token.get('error'))}")
            
            # Get user info
            userinfo_response = await client.get(
                'https://www.googleapis.com/oauth2/v2/userinfo',
                headers={'Authorization': f"Bearer {token['access_token']}"}
            )
            user_info = userinfo_response.json()
            print(f"🔐 User info: {user_info}")
        
        if 'error' in user_info:
            raise HTTPException(status_code=400, detail=f"Error obteniendo información del usuario: {user_info.get('error_description', user_info.get('error'))}")

        print(f"Dev user info obtained: {user_info}")
        email = user_info.get('email')
        name = user_info.get('name')
        picture = user_info.get('picture')
        print(f"🖼️ Picture obtenida de Google (dev): {picture}")

        if not email:
            raise HTTPException(status_code=400, detail="Email no disponible")

        # Verificar si el email está autorizado
        if not await is_email_authorized(email):
            frontend_url = f"{settings.DEV_FRONTEND_URL}/?auth=unauthorized&email={urllib.parse.quote(email)}&user={urllib.parse.quote(name or email)}"
            print(f"Redirecting unauthorized user to frontend (dev): {frontend_url}")
            return RedirectResponse(url=frontend_url, status_code=302)

        # Crear o actualizar usuario en la base de datos
        existing_user = await user_repo.get_by_email(email)

        if not existing_user:
            # Crear nuevo usuario OAuth
            user_data = {
                "username": email.split('@')[0],
                "full_name": name or email,
                "email": email,
                "picture": picture,
                "provider": "google",
                "is_active": True,
                "google_id": user_info.get('sub') or user_info.get('id')
            }

            print(f"🔍 DEBUG: Enviando a NocoDB - picture: {picture}")
            created_user = await user_repo.create(user_data)
            if not created_user:
                raise HTTPException(status_code=400, detail="Error creating user")
            user_id = created_user.get("Id")
        else:
            user_id = existing_user["Id"]

            # Actualizar picture siempre, pero full_name solo si está vacío
            google_full_name = name or email
            needs_picture_update = existing_user.get("picture") != picture
            needs_fullname_update = not existing_user.get("full_name") or existing_user.get("full_name", "").strip() == ""

            if needs_picture_update or needs_fullname_update:
                print(f"📝 Actualizando usuario existente:")
                if needs_fullname_update:
                    print(f"   full_name: '{existing_user.get('full_name')}' → '{google_full_name}' (primera vez)")
                else:
                    print(f"   full_name: '{existing_user.get('full_name')}' (sin cambios - ya existe)")
                if needs_picture_update:
                    print(f"   picture: '{existing_user.get('picture')}' → '{picture}'")

                update_data = {}
                if needs_fullname_update:
                    update_data["full_name"] = google_full_name
                if needs_picture_update:
                    update_data["picture"] = picture
                if user_info.get('sub') or user_info.get('id'):
                    update_data["google_id"] = user_info.get('sub') or user_info.get('id')

                await user_repo.update(user_id, update_data)
                print(f"✅ Usuario actualizado exitosamente para {email}")
            else:
                print(f"ℹ️ Usuario ya está actualizado: full_name='{existing_user.get('full_name')}', picture='{existing_user.get('picture')}'")

        # Generar JWT token
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = create_access_token(
            data={"sub": email, "name": name, "picture": picture},
            expires_delta=access_token_expires
        )

        print(f"Generated JWT token for {email}, expires in {settings.access_token_expire_minutes} minutes")

        frontend_url = f"{settings.DEV_FRONTEND_URL}/?auth=success&token={access_token}&user={urllib.parse.quote(name or email)}&email={urllib.parse.quote(email)}&picture={urllib.parse.quote(picture or '')}"

        print(f"Redirecting to frontend (dev): {frontend_url[:100]}...")
        return RedirectResponse(url=frontend_url, status_code=302)

    except Exception as e:
        print(f"OAuth error: {str(e)}")
        print(f"OAuth error type: {type(e)}")
        import traceback
        print(f"OAuth error traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=400, detail=f"Error en autenticación: {str(e)}")

@router.post("/logout")
async def logout(current_user: CurrentUser):
    """Cerrar sesión del usuario"""
    return JSONResponse(
        status_code=200,
        content={
            "message": "Sesión cerrada exitosamente",
            "user_email": current_user.email
        }
    )