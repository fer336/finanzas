import httpx
from typing import List, Optional, Dict, Any
from app.core.config import settings
from app.schemas.categories import CategoriesListResponse, CategoryResponse
import logging

logger = logging.getLogger(__name__)

class ExternalAPIService:
    def __init__(self):
        self.base_url = settings.NOCODB_BASE_URL
        self.token = settings.NOCODB_TOKEN
        self.table_id = settings.CATEGORIES_TABLE_ID
        self.view_id = settings.CATEGORIES_VIEW_ID
        
    async def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict[Any, Any]:
        """Realizar petición HTTP a la API externa"""
        headers = {
            'accept': 'application/json',
            'xc-token': self.token
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.request(
                    method=method,
                    url=f"{self.base_url}{endpoint}",
                    headers=headers,
                    **kwargs
                )
                response.raise_for_status()
                return response.json()
                
            except httpx.HTTPStatusError as e:
                logger.error(f"HTTP error: {e.response.status_code} - {e.response.text}")
                raise
            except httpx.RequestError as e:
                logger.error(f"Request error: {str(e)}")
                raise
            except Exception as e:
                logger.error(f"Unexpected error: {str(e)}")
                raise

    async def get_categories(
        self, 
        user_id: Optional[str] = None,
        limit: int = 25, 
        offset: int = 0,
        active_only: bool = True
    ) -> Dict[str, Any]:
        """Obtener categorías desde la API externa"""
        
        # Construir parámetros de consulta
        params = {
            'viewId': self.view_id,
            'limit': limit,
            'offset': offset,
            'shuffle': 0
        }
        
        # Agregar filtros si es necesario
        if user_id:
            params['where'] = f'(UsuarioId,eq,{user_id})'
            
        if active_only:
            where_clause = '(Activa,eq,true)'
            if 'where' in params:
                params['where'] += f'~and({where_clause})'
            else:
                params['where'] = where_clause

        endpoint = f"/api/v2/tables/{self.table_id}/records"
        
        try:
            result = await self._make_request('GET', endpoint, params=params)
            logger.info(f"Retrieved {len(result.get('list', []))} categories")
            return result
            
        except Exception as e:
            logger.error(f"Error fetching categories: {str(e)}")
            raise

    async def get_category_by_id(self, category_id: str) -> Dict[str, Any]:
        """Obtener una categoría específica por ID"""
        endpoint = f"/api/v2/tables/{self.table_id}/records/{category_id}"
        
        try:
            result = await self._make_request('GET', endpoint)
            logger.info(f"Retrieved category: {category_id}")
            return result
            
        except Exception as e:
            logger.error(f"Error fetching category {category_id}: {str(e)}")
            raise

    async def create_category(self, category_data: Dict[str, Any]) -> Dict[str, Any]:
        """Crear una nueva categoría"""
        endpoint = f"/api/v2/tables/{self.table_id}/records"
        
        # Asegurar que las fechas estén en formato correcto
        from datetime import datetime
        now = datetime.utcnow().isoformat() + "Z"
        
        # Preparar los datos según el esquema de la API - solo campos no automáticos
        api_data = {
            "Nombre": category_data.get("Nombre", ""),
            "Tipo": category_data.get("Tipo", "gasto")
        }
        
        # Agregar campos opcionales solo si se proporcionan
        if category_data.get("Color"):
            api_data["Color"] = category_data.get("Color")
        if category_data.get("Icono"):
            api_data["Icono"] = category_data.get("Icono")
        if category_data.get("Activa") is not None:
            api_data["Activa"] = category_data.get("Activa")
        if category_data.get("Descripcion"):
            api_data["Descripcion"] = category_data.get("Descripcion")
        
        try:
            logger.info(f"Creating category with data: {api_data}")
            result = await self._make_request('POST', endpoint, json=api_data)
            logger.info(f"Created category: {result.get('Id')}")
            return result
            
        except Exception as e:
            logger.error(f"Error creating category: {str(e)}")
            raise

    async def update_category(self, category_id: str, category_data: Dict[str, Any]) -> Dict[str, Any]:
        """Actualizar una categoría existente usando PATCH"""
        endpoint = f"/api/v2/tables/{self.table_id}/records"
        
        # Agregar fecha de actualización
        from datetime import datetime
        now = datetime.utcnow().isoformat() + "Z"
        category_data["FechaActualizacion"] = now
        
        # Agregar el ID al payload para el PATCH
        update_payload = {
            "Id": category_id,
            **category_data
        }
        
        try:
            logger.info(f"Updating category {category_id} with data: {update_payload}")
            result = await self._make_request('PATCH', endpoint, json=update_payload)
            logger.info(f"Updated category: {category_id}")
            return result
            
        except Exception as e:
            logger.error(f"Error updating category {category_id}: {str(e)}")
            raise

    async def delete_category(self, category_id: str) -> bool:
        """Eliminar una categoría usando DELETE (hard delete)"""
        endpoint = f"/api/v2/tables/{self.table_id}/records"
        
        delete_payload = {
            "Id": category_id
        }
        
        try:
            logger.info(f"Deleting category: {category_id}")
            result = await self._make_request('DELETE', endpoint, json=delete_payload)
            logger.info(f"Deleted category: {category_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting category {category_id}: {str(e)}")
            raise

    async def soft_delete_category(self, category_id: str) -> Dict[str, Any]:
        """Eliminar una categoría (soft delete - marcar como inactiva)"""
        try:
            result = await self.update_category(category_id, {"Activa": False})
            logger.info(f"Soft deleted category: {category_id}")
            return result
            
        except Exception as e:
            logger.error(f"Error soft deleting category {category_id}: {str(e)}")
            raise

    async def get_categories_by_type(self, category_type: str, user_id: Optional[str] = None) -> Dict[str, Any]:
        """Obtener categorías filtradas por tipo (ingreso/gasto)"""
        
        params = {
            'viewId': self.view_id,
            'limit': 100,
            'offset': 0,
            'shuffle': 0,
            'where': f'(Tipo,eq,{category_type})~and(Activa,eq,true)'
        }
        
        if user_id:
            params['where'] += f'~and(UsuarioId,eq,{user_id})'

        endpoint = f"/api/v2/tables/{self.table_id}/records"
        
        try:
            result = await self._make_request('GET', endpoint, params=params)
            logger.info(f"Retrieved {len(result.get('list', []))} {category_type} categories")
            return result
            
        except Exception as e:
            logger.error(f"Error fetching {category_type} categories: {str(e)}")
            raise

    # ========== LINK RECORDS ENDPOINTS ==========
    
    async def get_linked_records(self, record_id: str, link_field_id: str, limit: int = 25, offset: int = 0) -> Dict[str, Any]:
        """Obtener registros vinculados a una categoría"""
        endpoint = f"/api/v2/tables/{self.table_id}/links/{link_field_id}/records/{record_id}"
        
        params = {
            'limit': limit,
            'offset': offset
        }
        
        try:
            logger.info(f"Getting linked records for {record_id} via {link_field_id}")
            result = await self._make_request('GET', endpoint, params=params)
            logger.info(f"Retrieved {len(result.get('list', []))} linked records")
            return result
            
        except Exception as e:
            logger.error(f"Error fetching linked records for {record_id}: {str(e)}")
            raise

    async def link_records(self, record_id: str, link_field_id: str, target_record_ids: List[str]) -> Dict[str, Any]:
        """Vincular registros a una categoría"""
        endpoint = f"/api/v2/tables/{self.table_id}/links/{link_field_id}/records/{record_id}"
        
        # El payload debe ser una lista de IDs a vincular
        payload = target_record_ids
        
        try:
            logger.info(f"Linking records {target_record_ids} to {record_id} via {link_field_id}")
            result = await self._make_request('POST', endpoint, json=payload)
            logger.info(f"Successfully linked records")
            return result
            
        except Exception as e:
            logger.error(f"Error linking records to {record_id}: {str(e)}")
            raise

    async def unlink_records(self, record_id: str, link_field_id: str, target_record_ids: List[str]) -> Dict[str, Any]:
        """Desvincular registros de una categoría"""
        endpoint = f"/api/v2/tables/{self.table_id}/links/{link_field_id}/records/{record_id}"
        
        # El payload debe ser una lista de IDs a desvincular
        payload = target_record_ids
        
        try:
            logger.info(f"Unlinking records {target_record_ids} from {record_id} via {link_field_id}")
            result = await self._make_request('DELETE', endpoint, json=payload)
            logger.info(f"Successfully unlinked records")
            return result
            
        except Exception as e:
            logger.error(f"Error unlinking records from {record_id}: {str(e)}")
            raise

    # ========== HELPER METHODS FOR COMMON LINKS ==========
    
    async def get_category_transactions(self, category_id: str, limit: int = 25, offset: int = 0) -> Dict[str, Any]:
        """Obtener transacciones vinculadas a una categoría"""
        # Asumiendo que el campo de link para transacciones se llama 'Transacciones'
        return await self.get_linked_records(category_id, 'Transacciones', limit, offset)

    async def get_category_budgets(self, category_id: str, limit: int = 25, offset: int = 0) -> Dict[str, Any]:
        """Obtener presupuestos vinculados a una categoría"""
        # Asumiendo que el campo de link para presupuestos se llama 'PresupuestoCategorias'
        return await self.get_linked_records(category_id, 'PresupuestoCategorias', limit, offset)

    async def link_category_to_transactions(self, category_id: str, transaction_ids: List[str]) -> Dict[str, Any]:
        """Vincular una categoría a transacciones"""
        return await self.link_records(category_id, 'Transacciones', transaction_ids)

    async def unlink_category_from_transactions(self, category_id: str, transaction_ids: List[str]) -> Dict[str, Any]:
        """Desvincular una categoría de transacciones"""
        return await self.unlink_records(category_id, 'Transacciones', transaction_ids)

    async def link_category_to_budgets(self, category_id: str, budget_ids: List[str]) -> Dict[str, Any]:
        """Vincular una categoría a presupuestos"""
        return await self.link_records(category_id, 'PresupuestoCategorias', budget_ids)

    async def unlink_category_from_budgets(self, category_id: str, budget_ids: List[str]) -> Dict[str, Any]:
        """Desvincular una categoría de presupuestos"""
        return await self.unlink_records(category_id, 'PresupuestoCategorias', budget_ids)

# Instancia global del servicio
external_api_service = ExternalAPIService()