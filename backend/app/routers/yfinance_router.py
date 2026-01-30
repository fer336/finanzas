
from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Optional
import yfinance as yf
import requests
import logging
from datetime import datetime, timedelta
import time
import asyncio

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/yfinance", tags=["Yahoo Finance"])

# Note: CEDEARS functionality removed (NocoDB dependency eliminated)
# TODO: Implement CEDEARS loading from PostgreSQL if needed

def get_cedears_list():
    """Obtiene la lista de CEDEARs desde configuración estática"""
    global CEDEARS_POPULARES
    if not CEDEARS_POPULARES or len(CEDEARS_POPULARES) < 50:
        logger.warning("🔄 CEDEARS_POPULARES está vacía. PostgreSQL implementation pending.")
    return CEDEARS_POPULARES

# Variable global que se carga lazy
CEDEARS_POPULARES = [
    {"ticker": "AAPL", "nombre": "Apple Inc.", "sector": "Tecnología", "ratio": 10},
    {"ticker": "MSFT", "nombre": "Microsoft Corporation", "sector": "Tecnología", "ratio": 10},
    {"ticker": "GOOGL", "nombre": "Alphabet Inc.", "sector": "Tecnología", "ratio": 58},
    {"ticker": "AMZN", "nombre": "Amazon.com, Inc.", "sector": "Consumo Cíclico", "ratio": 144},
    {"ticker": "TSLA", "nombre": "Tesla, Inc.", "sector": "Consumo Cíclico", "ratio": 15},
    {"ticker": "META", "nombre": "Meta Platforms, Inc.", "sector": "Tecnología", "ratio": 24},
    {"ticker": "NVDA", "nombre": "NVIDIA Corporation", "sector": "Tecnología", "ratio": 24},
    {"ticker": "AMD", "nombre": "Advanced Micro Devices, Inc.", "sector": "Tecnología", "ratio": 10},
    {"ticker": "QCOM", "nombre": "Qualcomm Incorporated", "sector": "Tecnología", "ratio": 11},
    {"ticker": "INTC", "nombre": "Intel Corporation", "sector": "Tecnología", "ratio": 5},
    {"ticker": "SPY", "nombre": "SPDR S&P 500 ETF Trust", "sector": "ETF", "ratio": 20},
    {"ticker": "QQQ", "nombre": "Invesco QQQ Trust", "sector": "ETF", "ratio": 20},
    {"ticker": "DIA", "nombre": "SPDR Dow Jones Industrial Average ETF Trust", "sector": "ETF", "ratio": 20},
    {"ticker": "IWM", "nombre": "iShares Russell 2000 ETF", "sector": "ETF", "ratio": 10},
    {"ticker": "EEM", "nombre": "iShares MSCI Emerging Markets ETF", "sector": "ETF", "ratio": 5},
    {"ticker": "XLE", "nombre": "Energy Select Sector SPDR Fund", "sector": "Energía", "ratio": 2},
    {"ticker": "XLF", "nombre": "Financial Select Sector SPDR Fund", "sector": "Finanzas", "ratio": 2},
    {"ticker": "KO", "nombre": "The Coca-Cola Company", "sector": "Consumo Defensivo", "ratio": 5},
    {"ticker": "PEP", "nombre": "PepsiCo, Inc.", "sector": "Consumo Defensivo", "ratio": 6},
    {"ticker": "PG", "nombre": "PepsiCo, Inc.", "sector": "Consumo Defensivo", "ratio": 5}, # Corrected PG ratio later if needed, kept simple
    {"ticker": "MCD", "nombre": "McDonald's Corporation", "sector": "Consumo Cíclico", "ratio": 8},
    {"ticker": "WMT", "nombre": "Walmart Inc.", "sector": "Consumo Defensivo", "ratio": 6},
    {"ticker": "DIS", "nombre": "The Walt Disney Company", "sector": "Comunicación", "ratio": 4},
    {"ticker": "NFLX", "nombre": "Netflix, Inc.", "sector": "Comunicación", "ratio": 16},
    {"ticker": "SPOT", "nombre": "Spotify Technology S.A.", "sector": "Comunicación", "ratio": 8},
    {"ticker": "JPM", "nombre": "JPMorgan Chase & Co.", "sector": "Finanzas", "ratio": 5},
    {"ticker": "V", "nombre": "Visa Inc.", "sector": "Finanzas", "ratio": 18},
    {"ticker": "MA", "nombre": "Mastercard Incorporated", "sector": "Finanzas", "ratio": 18},
    {"ticker": "BAC", "nombre": "Bank of America Corporation", "sector": "Finanzas", "ratio": 2},
    {"ticker": "C", "nombre": "Citigroup Inc.", "sector": "Finanzas", "ratio": 3},
    {"ticker": "PFE", "nombre": "Pfizer Inc.", "sector": "Salud", "ratio": 2},
    {"ticker": "JNJ", "nombre": "Johnson & Johnson", "sector": "Salud", "ratio": 5},
    {"ticker": "MRK", "nombre": "Merck & Co., Inc.", "sector": "Salud", "ratio": 5},
    {"ticker": "UNH", "nombre": "UnitedHealth Group Incorporated", "sector": "Salud", "ratio": 11},
    {"ticker": "XOM", "nombre": "Exxon Mobil Corporation", "sector": "Energía", "ratio": 5},
    {"ticker": "CVX", "nombre": "Chevron Corporation", "sector": "Energía", "ratio": 8},
    {"ticker": "BP", "nombre": "BP p.l.c.", "sector": "Energía", "ratio": 2},
    {"ticker": "SHEL", "nombre": "Shell plc", "sector": "Energía", "ratio": 2},
    {"ticker": "T", "nombre": "AT&T Inc.", "sector": "Comunicación", "ratio": 3},
    {"ticker": "VZ", "nombre": "Verizon Communications Inc.", "sector": "Comunicación", "ratio": 2},
    {"ticker": "BA", "nombre": "The Boeing Company", "sector": "Industria", "ratio": 3},
    {"ticker": "CAT", "nombre": "Caterpillar Inc.", "sector": "Industria", "ratio": 5},
    {"ticker": "MMM", "nombre": "3M Company", "sector": "Industria", "ratio": 5},
    {"ticker": "GE", "nombre": "General Electric Company", "sector": "Industria", "ratio": 1},
    {"ticker": "IBM", "nombre": "International Business Machines Corporation", "sector": "Tecnología", "ratio": 5},
    {"ticker": "ORCL", "nombre": "Oracle Corporation", "sector": "Tecnología", "ratio": 3},
    {"ticker": "CRM", "nombre": "Salesforce, Inc.", "sector": "Tecnología", "ratio": 10},
    {"ticker": "ADBE", "nombre": "Adobe Inc.", "sector": "Tecnología", "ratio": 11},
    {"ticker": "NKE", "nombre": "NIKE, Inc.", "sector": "Consumo Cíclico", "ratio": 3},
    {"ticker": "SBUX", "nombre": "Starbucks Corporation", "sector": "Consumo Cíclico", "ratio": 4},
    {"ticker": "GOLD", "nombre": "Barrick Gold Corporation", "sector": "Materiales Básicos", "ratio": 1},
    {"ticker": "VALE", "nombre": "Vale S.A.", "sector": "Materiales Básicos", "ratio": 2},
    {"ticker": "PBR", "nombre": "Petróleo Brasileiro S.A. - Petrobras", "sector": "Energía", "ratio": 1},
    {"ticker": "BBD", "nombre": "Banco Bradesco S.A.", "sector": "Finanzas", "ratio": 1},
    {"ticker": "ITUB", "nombre": "Itaú Unibanco Holding S.A.", "sector": "Finanzas", "ratio": 1},
    {"ticker": "MELI", "nombre": "MercadoLibre, Inc.", "sector": "Consumo Cíclico", "ratio": 60},
    {"ticker": "GLOB", "nombre": "Globant S.A.", "sector": "Tecnología", "ratio": 4},
    {"ticker": "DESP", "nombre": "Despegar.com, Corp.", "sector": "Consumo Cíclico", "ratio": 1},
    {"ticker": "TSE", "nombre": "Trinseo PLC", "sector": "Materiales Básicos", "ratio": 1},
    {"ticker": "BIOX", "nombre": "Bioceres Crop Solutions Corp.", "sector": "Consumo Defensivo", "ratio": 1},
    {"ticker": "VIST", "nombre": "Vista Energy, S.A.B. de C.V.", "sector": "Energía", "ratio": 1}
]

# Cache global para evitar rate limiting
_cache = {}
CACHE_DURATION = timedelta(minutes=30)  # 30 minutos de caché (aumentado para reducir peticiones)

# Configuración de rate limiting
REQUEST_DELAY = 2.0  # 2 segundos entre peticiones (más conservador)
MAX_RETRIES = 3  # Máximo de reintentos cuando hay error 429


def get_cedear_data_cached(ticker: str, ratio: int = 1) -> tuple[Optional[Dict], bool]:
    """
    Obtiene datos de un CEDEAR con caché
    Retorna: (data, is_from_cache)
    """
    now = datetime.now()
    
    # Check cache
    if ticker in _cache:
        cached_data, cached_time = _cache[ticker]
        if now - cached_time < CACHE_DURATION:
            logger.debug(f"📦 Cache HIT para {ticker}")
            return cached_data, True
    
    # Fetch fresh data
    logger.debug(f"🌐 Fetching {ticker} desde Yahoo Finance...")
    data = get_cedear_data_from_yahoo(ticker, ratio)
    
    if data:
        _cache[ticker] = (data, now)
    
    return data, False


def get_multiple_cedears_data(cedears_list: List[Dict]) -> Dict[str, Dict]:
    """
    Obtiene datos de múltiples CEDEARs usando requests directo a Yahoo Finance API
    """
    try:
        if not cedears_list:
            return {}
        
        ticker_to_cedear = {c['ticker']: c for c in cedears_list}
        
        logger.info(f"📦 Descargando {len(cedears_list)} CEDEARs con requests directo...")
        
        results = {}
        base_url = "https://query1.finance.yahoo.com/v8/finance/chart/"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        for cedear in cedears_list:
            ticker = cedear['ticker']
            ticker_ba = f"{ticker}.BA"
            
            try:
                url = f"{base_url}{ticker_ba}"
                params = {
                    'interval': '1d',
                    'range': '5d'  # 5 días para tener datos cuando el mercado está cerrado
                }
                
                response = requests.get(url, params=params, headers=headers, timeout=10)
                response.raise_for_status()
                data = response.json()
                
                # Verificar errores
                if 'chart' not in data or 'error' in data.get('chart', {}) and data['chart'].get('error'):
                    logger.warning(f"⚠️ Error de Yahoo para {ticker}: {data['chart'].get('error')}")
                    continue
                
                if 'result' not in data['chart'] or not data['chart']['result']:
                    logger.warning(f"⚠️ Sin datos para {ticker}")
                    continue
                
                result = data['chart']['result'][0]
                
                # Verificar timestamps
                if 'timestamp' not in result or not result['timestamp']:
                    logger.warning(f"⚠️ Sin timestamps para {ticker}")
                    continue
                
                # Extraer precios
                quotes = result['indicators']['quote'][0]
                closes = quotes.get('close', [])
                volumes = quotes.get('volume', [])
                
                if not closes or all(c is None for c in closes):
                    logger.warning(f"⚠️ Sin precios de cierre para {ticker}")
                    continue
                
                # Filtrar None values y obtener último precio válido
                valid_closes = [(i, c) for i, c in enumerate(closes) if c is not None]
                if not valid_closes:
                    continue
                
                last_idx, precio_ars = valid_closes[-1]
                
                # Calcular cambio vs día anterior
                if len(valid_closes) > 1:
                    prev_idx, previous_close = valid_closes[-2]
                else:
                    previous_close = precio_ars
                
                volume = volumes[last_idx] if volumes and last_idx < len(volumes) and volumes[last_idx] is not None else 0
                
                change = precio_ars - previous_close
                change_percent = (change / previous_close * 100) if previous_close else 0
                
                results[ticker] = {
                    "ticker": ticker,
                    "precio_ars": round(precio_ars, 2),
                    "cambio": round(change, 2),
                    "cambio_porcentual": round(change_percent, 2),
                    "volumen": int(volume),
                    "ratio": cedear.get("ratio", 1),
                    "last_update": datetime.now().isoformat()
                }
                
            except requests.exceptions.RequestException as e:
                logger.warning(f"⚠️ Error de conexión {ticker}: {str(e)[:100]}")
                continue
            except Exception as e:
                logger.warning(f"⚠️ Error procesando {ticker}: {str(e)[:100]}")
                continue
        
        logger.info(f"✅ {len(results)}/{len(cedears_list)} CEDEARs obtenidos exitosamente")
        return results
        
    except Exception as e:
        logger.error(f"❌ Error en descarga de CEDEARs: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return {}


def get_cedear_data_from_yahoo(ticker: str, ratio: int = 1, retry_count: int = 0) -> Optional[Dict]:
    """
    DEPRECATED: Usar get_multiple_cedears_data() para batch requests
    Se mantiene para compatibilidad con caché individual
    """
    try:
        ticker_ba = f"{ticker}.BA"
        
        import requests
        session = requests.Session()
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        stock = yf.Ticker(ticker_ba, session=session)
        info = stock.info
        
        precio_ars = info.get('currentPrice') or info.get('regularMarketPrice') or 0
        previous_close = info.get('previousClose', precio_ars)
        change = precio_ars - previous_close if precio_ars else 0
        change_percent = (change / previous_close * 100) if previous_close else 0
        
        return {
            "ticker": ticker,
            "precio_ars": round(precio_ars, 2),
            "cambio": round(change, 2),  # En ARS
            "cambio_porcentual": round(change_percent, 2),  # %
            "volumen": info.get('volume', 0),  # Nombre en español
            "ratio": ratio,
            "last_update": datetime.now().isoformat()
        }
        
    except Exception as e:
        error_msg = str(e)
        
        if "429" in error_msg and retry_count < MAX_RETRIES:
            wait_time = (2 ** retry_count) * 3
            logger.warning(f"⚠️ Rate limit para {ticker}, esperando {wait_time}s (intento {retry_count + 1}/{MAX_RETRIES})...")
            time.sleep(wait_time)
            return get_cedear_data_from_yahoo(ticker, ratio, retry_count + 1)
        
        logger.error(f"❌ Error obteniendo {ticker}: {e}")
        return None


def get_cedear_data_fallback(ticker: str, ratio: int = 1) -> Optional[Dict]:
    """
    NO retorna datos falsos - Los CEDEARs son instrumentos financieros REALES
    Las personas toman decisiones de inversión basadas en estos datos
    """
    logger.warning(f"⚠️ No hay datos reales disponibles para {ticker} - NO se usarán datos ficticios")
    return None


@router.get("/cedears")
async def get_cedears(
    limite: int = Query(default=10, le=500, description="Cantidad máxima de CEDEARs"),
    sector: Optional[str] = Query(default=None, description="Filtrar por sector"),
    search: Optional[str] = Query(default=None, description="Buscar por ticker o nombre")
):
    """
    Obtiene lista de CEDEARs con precios en ARS usando BATCH requests (lotes de 10)
    
    - **limite**: Cantidad máxima de CEDEARs a retornar (max 500)
    - **sector**: Filtrar por sector específico
    - **search**: Buscar por ticker o nombre
    """
    try:
        logger.info(f"📊 Solicitando {limite} CEDEARs" + (f" del sector {sector}" if sector else "") + (f" búsqueda: {search}" if search else ""))
        
        # Obtener lista de CEDEARs (se carga lazy si es necesario)
        cedears_disponibles = get_cedears_list()
        logger.info(f"📋 {len(cedears_disponibles)} CEDEARs disponibles")
        
        # Filtrar por sector si se especifica
        cedears_filtrados = cedears_disponibles
        if sector:
            cedears_filtrados = [c for c in cedears_disponibles if c.get("sector") == sector]
            
        # Filtrar por búsqueda si se especifica
        if search:
            term = search.lower()
            cedears_filtrados = [
                c for c in cedears_filtrados 
                if term in c["ticker"].lower() or term in c["nombre"].lower()
            ]
        
        # Limitar cantidad
        cedears_to_fetch = cedears_filtrados[:limite]
        
        # Separar entre los que están en caché y los que necesitan fetch
        cedears_from_cache = []
        cedears_to_download = []
        now = datetime.now()
        
        for cedear in cedears_to_fetch:
            ticker = cedear["ticker"]
            
            # Verificar si está en caché y es válido
            if ticker in _cache:
                cached_data, cached_time = _cache[ticker]
                if now - cached_time < CACHE_DURATION:
                    logger.debug(f"📦 Cache HIT para {ticker}")
                    cedears_from_cache.append({
                        **cached_data,
                        "nombre": cedear.get("nombre", ""),
                        "sector": cedear.get("sector", "Otros")
                    })
                    continue
            
            # No está en caché válido, agregar a lista para descargar
            cedears_to_download.append(cedear)
        
        logger.info(f"📦 {len(cedears_from_cache)} CEDEARs desde caché, {len(cedears_to_download)} para descargar")
        
        # Descargar los que faltan en BATCH
        cedears_con_precios = cedears_from_cache.copy()
        
        if cedears_to_download:
            # Procesar en lotes de 10 para evitar saturar la API y timeouts
            BATCH_SIZE = 10
            for i in range(0, len(cedears_to_download), BATCH_SIZE):
                batch = cedears_to_download[i:i + BATCH_SIZE]
                logger.info(f"📦 Procesando lote {i//BATCH_SIZE + 1} ({len(batch)} CEDEARs)")
                
                # Usar batch download para este lote
                batch_data = get_multiple_cedears_data(batch)
                
                for cedear in batch:
                    ticker = cedear["ticker"]
                    
                    # SOLO usar datos del batch si existen - NO datos ficticios
                    if ticker in batch_data:
                        data = batch_data[ticker]
                        # Guardar en caché
                        _cache[ticker] = (data, now)
                        
                        # Agregar información adicional
                        cedear_completo = {
                            **data,
                            "nombre": cedear.get("nombre", ""),
                            "sector": cedear.get("sector", "Otros")
                        }
                        cedears_con_precios.append(cedear_completo)
            
                # Delay para evitar rate limiting de Yahoo Finance
                if i + BATCH_SIZE < len(cedears_to_download):
                    time.sleep(1.5)
        
        logger.info(f"✅ {len(cedears_con_precios)} CEDEARs con datos REALES procesados")
        
        return {
            "cedears": cedears_con_precios,
            "total": len(cedears_con_precios),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Error en get_cedears: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sectores")
async def get_sectores():
    """
    Obtiene lista de sectores disponibles
    """
    try:
        cedears_disponibles = get_cedears_list()
        sectores = list(set(c.get("sector", "Otros") for c in cedears_disponibles))
        sectores.sort()
        
        return {
            "sectores": sectores,
            "total": len(sectores)
        }
        
    except Exception as e:
        logger.error(f"❌ Error en get_sectores: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cache/clear")
async def clear_cache():
    """
    Limpia el caché de CEDEARs
    """
    global _cache
    _cache = {}
    logger.info("🗑️ Caché limpiado")
    return {"message": "Caché limpiado exitosamente"}


@router.post("/reload")
async def reload_cedears():
    """
    Fuerza la recarga de CEDEARs desde NocoDB
    """
    global CEDEARS_POPULARES
    global _cache
    
    logger.info("🔄 Forzando recarga de CEDEARs...")
    _cache = {}  # Limpiar caché
    CEDEARS_POPULARES = []  # Resetear lista
    
    # TODO: Reload from PostgreSQL
    logger.warning("⚠️ CEDEARS reload not implemented for PostgreSQL yet")
    
    return {
        "message": "CEDEARs recargados",
        "count": len(CEDEARS_POPULARES),
        "timestamp": datetime.now().isoformat()
    }


def _fetch_history_sync(ticker_ba: str, period: str, interval: str):
    """Función síncrona para obtener datos históricos"""
    stock = yf.Ticker(ticker_ba)
    return stock.history(period=period, interval=interval)


def calculate_technical_indicators(hist):
    """Calcula indicadores técnicos básicos usando pandas"""
    try:
        import pandas as pd
        import numpy as np
        
        df = hist.copy()
        
        # SMA 50 and 200
        df['SMA_50'] = df['Close'].rolling(window=50).mean()
        df['SMA_200'] = df['Close'].rolling(window=200).mean()
        
        # RSI 14
        delta = df['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['RSI'] = 100 - (100 / (1 + rs))
        
        # MACD (12, 26, 9)
        exp1 = df['Close'].ewm(span=12, adjust=False).mean()
        exp2 = df['Close'].ewm(span=26, adjust=False).mean()
        df['MACD'] = exp1 - exp2
        df['Signal_Line'] = df['MACD'].ewm(span=9, adjust=False).mean()
        
        # Get latest values
        latest = df.iloc[-1]
        
        return {
            "price": round(latest['Close'], 2),
            "sma_50": round(latest['SMA_50'], 2) if not pd.isna(latest['SMA_50']) else None,
            "sma_200": round(latest['SMA_200'], 2) if not pd.isna(latest['SMA_200']) else None,
            "rsi": round(latest['RSI'], 2) if not pd.isna(latest['RSI']) else None,
            "macd": round(latest['MACD'], 2) if not pd.isna(latest['MACD']) else None,
            "macd_signal": round(latest['Signal_Line'], 2) if not pd.isna(latest['Signal_Line']) else None,
            "trend": "Bullish" if latest['Close'] > latest['SMA_50'] else "Bearish"
        }
    except Exception as e:
        logger.error(f"Error calculating indicators: {e}")
        return None

@router.get("/cedears/{ticker}/technical")
async def get_cedear_technical(ticker: str):
    """
    Obtiene análisis técnico básico calculado (RSI, MACD, SMAs)
    """
    try:
        ticker_ba = f"{ticker}.BA"
        # Fetch enough history for SMA 200
        hist = await asyncio.to_thread(_fetch_history_sync, ticker_ba, "1y", "1d")
        
        if hist.empty:
            raise HTTPException(status_code=404, detail="No historical data found")
            
        indicators = calculate_technical_indicators(hist)
        
        if not indicators:
            raise HTTPException(status_code=500, detail="Could not calculate indicators")
            
        return {
            "ticker": ticker,
            "indicators": indicators,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"❌ Error getting technicals for {ticker}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cedears/{ticker}/history")
async def get_cedear_history(
    ticker: str,
    period: str = Query(default="1d", description="Período: 1d, 5d, 1mo, 1y, etc.")
):
    """
    Obtiene datos históricos de un CEDEAR específico
    
    - **ticker**: Símbolo del CEDEAR (sin .BA)
    - **period**: Período de datos (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
    """
    try:
        ticker_ba = f"{ticker}.BA"
        logger.info(f"📊 Obteniendo histórico de {ticker_ba} para período {period}")
        
        # Determinar intervalo según período
        interval_map = {
            "1d": "5m",   # 1 día = intervalos de 5 minutos
            "5d": "15m",  # 5 días = intervalos de 15 minutos
            "1mo": "1h",  # 1 mes = intervalos de 1 hora
            "3mo": "1d",  # 3 meses = intervalos de 1 día
            "6mo": "1d",  # 6 meses = intervalos de 1 día
            "1y": "1d",   # 1 año = intervalos de 1 día
            "2y": "1wk",  # 2 años = intervalos de 1 semana
            "5y": "1wk",  # 5 años = intervalos de 1 semana
            "10y": "1mo", # 10 años = intervalos de 1 mes
            "ytd": "1d",  # Año hasta hoy = intervalos de 1 día
            "max": "1mo"  # Máximo = intervalos de 1 mes
        }
        
        interval = interval_map.get(period, "1d")
        
        # Ejecutar en thread separado para no bloquear el event loop
        hist = await asyncio.to_thread(_fetch_history_sync, ticker_ba, period, interval)
        
        if hist.empty:
            logger.warning(f"⚠️ No hay datos históricos para {ticker}")
            return {
                "ticker": ticker,
                "period": period,
                "data": [],
                "error": "No hay datos disponibles para este período"
            }
        
        # Convertir a formato JSON serializable
        data_points = []
        for index, row in hist.iterrows():
            data_points.append({
                "timestamp": index.isoformat(),
                "date": index.strftime("%Y-%m-%d %H:%M:%S"),
                "open": round(float(row['Open']), 2),
                "high": round(float(row['High']), 2),
                "low": round(float(row['Low']), 2),
                "close": round(float(row['Close']), 2),
                "volume": int(row['Volume']) if 'Volume' in row else 0
            })
        
        logger.info(f"✅ {len(data_points)} puntos de datos obtenidos para {ticker}")
        
        return {
            "ticker": ticker,
            "period": period,
            "interval": interval,
            "data_points": len(data_points),
            "data": data_points,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Error obteniendo histórico de {ticker}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """
    Verificación de salud del servicio de CEDEARs
    """
    cedears_disponibles = get_cedears_list()
    return {
        "status": "healthy",
        "service": "yfinance-cedears",
        "cedears_count": len(cedears_disponibles),
        "cache_size": len(_cache),
        "timestamp": datetime.now().isoformat()
    }
