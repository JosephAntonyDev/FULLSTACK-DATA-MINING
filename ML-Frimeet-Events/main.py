import os
import json
import numpy as np
import pandas as pd
import duckdb
import joblib
from contextlib import asynccontextmanager
from typing import Optional
from dotenv import load_dotenv

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field
from jose import jwt, JWTError

load_dotenv()

DUCKDB_PATH = os.getenv("DUCKDB_PATH", "./warehouse.db")
JWT_SECRET = os.getenv("JWT_SECRET")
PORT = os.getenv("PORT", "8000")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

def verify_token(token: str = Depends(oauth2_scheme)):
    if not JWT_SECRET:
        return True # pass-through in dev mode
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        # Assuming HS256 for symmetric JWT signature 
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"], options={"verify_aud": False})
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

class AforoRequest(BaseModel):
    dia_semana: int = Field(..., ge=1, le=7)
    condicion_clima: str
    temperatura: float
    num_asistentes_confirmados: int
    distancia_promedio_km: float
    duracion_minutos: int
    es_fin_de_semana: bool
    num_miembros_club: int
    costo_promedio_lugar: float

class GastoRequest(BaseModel):
    num_asistentes: int = Field(..., gt=0)
    distancia_promedio_km: float
    dia_semana: int = Field(..., ge=1, le=7)
    duracion_minutos: int
    temperatura: float
    es_fin_de_semana: bool
    num_miembros_club: int
    costo_promedio_lugar: float
    nivel_precio: int = Field(..., ge=1, le=4)
    categoria_lugar: str

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load ML models and report
    try:
        app.state.clf_pipeline = joblib.load('models/clf_model.joblib')
        app.state.reg_pipeline = joblib.load('models/reg_model.joblib')
        with open('models/training_report.json', 'r', encoding='utf-8') as f:
            app.state.training_report = json.load(f)
    except Exception as e:
        print(f"Error loading models/report: {e}")
        app.state.clf_pipeline = None
        app.state.reg_pipeline = None
        app.state.training_report = None

    try:
        # Just test the connection during startup
        test_conn = duckdb.connect(DUCKDB_PATH, read_only=True)
        test_conn.close()
        app.state.warehouse_status = "ok"
    except Exception as e:
        print(f"Error connecting to DuckDB: {e}")
        app.state.warehouse_status = "error"

    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_connection():
    try:
        conn = duckdb.connect(DUCKDB_PATH, read_only=True)
        yield conn
    finally:
        conn.close()

# === ENDPOINTS OLAP ===

@app.get("/olap/eventos/resumen")
def get_eventos_resumen(conn = Depends(get_db_connection)):
    try:
        total = conn.execute("SELECT COUNT(*) FROM hechos_asistencia_eventos").fetchone()[0]
        por_aforo_df = conn.execute("SELECT aforo_status, COUNT(*) as count FROM hechos_asistencia_eventos GROUP BY aforo_status").fetchdf()
        
        por_aforo = []
        if total > 0:
            for _, row in por_aforo_df.iterrows():
                por_aforo.append({
                    "status": row['aforo_status'],
                    "count": row['count'],
                    "pct": round(row['count'] / total * 100, 2)
                })
                
        avg_asist = conn.execute("SELECT AVG(num_asistentes_reales) FROM hechos_asistencia_eventos").fetchone()[0]
        avg_gasto = conn.execute("SELECT AVG(total_gastado_mxn) FROM hechos_asistencia_eventos").fetchone()[0]
        
        return {
            "total_eventos": total,
            "por_aforo": por_aforo,
            "avg_asistentes": round(avg_asist, 2) if avg_asist else 0.0,
            "avg_gasto_mxn": round(avg_gasto, 2) if avg_gasto else 0.0
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database error: {str(e)}")

@app.get("/olap/clubs/ranking")
def get_clubs_ranking(top: int = 10, conn = Depends(get_db_connection)):
    try:
        query = f"""
            SELECT c.nombre as club_nombre, c.categoria,
                   COUNT(h.fact_id)::INT as total_eventos,
                   SUM(h.num_asistentes_reales)::INT as total_asistentes,
                   SUM(h.total_gastado_mxn)::FLOAT as gasto_total_mxn
            FROM hechos_asistencia_eventos h
            JOIN dim_club c ON h.club_id = c.club_id
            GROUP BY c.nombre, c.categoria
            ORDER BY total_asistentes DESC NULLS LAST
            LIMIT {top}
        """
        df = conn.execute(query).fetchdf()
        return df.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database error: {str(e)}")

@app.get("/olap/tiempo/tendencias")
def get_tiempo_tendencias(agrupacion: str = "mes", conn = Depends(get_db_connection)):
    try:
        if agrupacion == "mes":
            group_col = "t.anio::VARCHAR || '-' || LPAD(t.mes::VARCHAR, 2, '0')"
        elif agrupacion == "semana":
            group_col = "t.anio::VARCHAR || '-W' || date_part('week', t.fecha)::VARCHAR"
        elif agrupacion == "dia_semana":
            group_col = "t.nombre_dia"
        else:
            raise HTTPException(status_code=400, detail="agrupacion must be 'mes', 'semana', or 'dia_semana'")
            
        query = f"""
            SELECT {group_col} as periodo,
                   COUNT(h.fact_id)::INT as num_eventos,
                   AVG(h.num_asistentes_reales)::FLOAT as avg_asistentes,
                   AVG(h.aforo_lleno)::FLOAT * 100 as pct_lleno
            FROM hechos_asistencia_eventos h
            JOIN dim_tiempo t ON h.date_id = t.date_id
            GROUP BY {group_col}
            ORDER BY periodo
        """
        df = conn.execute(query).fetchdf()
        return df.to_dict(orient="records")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database error: {str(e)}")

@app.get("/olap/lugares/heatmap")
def get_lugares_heatmap(conn = Depends(get_db_connection)):
    try:
        query = """
            SELECT l.place_id, l.nombre, l.categoria,
                   COUNT(h.fact_id)::INT as total_eventos,
                   AVG(h.aforo_lleno)::FLOAT * 100 as pct_lleno,
                   AVG(h.total_gastado_mxn)::FLOAT as avg_gasto_mxn
            FROM hechos_asistencia_eventos h
            JOIN dim_lugar l ON h.place_id = l.place_id
            GROUP BY l.place_id, l.nombre, l.categoria
        """
        df = conn.execute(query).fetchdf()
        return df.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database error: {str(e)}")

# === ENDPOINTS ML ===

@app.post("/predict/aforo")
def predict_aforo(request: AforoRequest):
    if not app.state.clf_pipeline:
        raise HTTPException(status_code=500, detail="Classification model not loaded")
        
    try:
        data = {
            'dia_semana': [request.dia_semana],
            'condicion_clima': [request.condicion_clima],
            'temperatura': [request.temperatura],
            'num_asistentes_confirmados': [request.num_asistentes_confirmados],
            'distancia_promedio_km': [request.distancia_promedio_km],
            'duracion_minutos': [request.duracion_minutos],
            'es_fin_de_semana': [str(request.es_fin_de_semana).lower()],
            'num_miembros_club': [request.num_miembros_club],
            'costo_promedio_lugar': [request.costo_promedio_lugar]
        }
        df = pd.DataFrame(data)
        
        pred_class = app.state.clf_pipeline.predict(df)[0]
        pred_proba = app.state.clf_pipeline.predict_proba(df)[0][1]
        
        confianza = "media"
        if pred_proba > 0.75:
            confianza = "alta"
        elif pred_proba < 0.55:
            confianza = "baja"
            
        advertencia = None
        if request.num_miembros_club == 0 or request.distancia_promedio_km == 0:
            advertencia = "Datos incompletos: num_miembros_club o distancia_promedio_km es 0, lo cual puede afectar la precisión de la predicción."
            
        return {
            "prediccion": "lleno" if pred_class == 1 else "no_lleno",
            "probabilidad_lleno": float(pred_proba),
            "confianza": confianza,
            "modelo_usado": app.state.training_report['clasificacion']['modelo_ganador'] if app.state.training_report else "LogisticRegression",
            "advertencia": advertencia
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/predict/gasto")
def predict_gasto(request: GastoRequest):
    if not app.state.reg_pipeline:
        raise HTTPException(status_code=500, detail="Regression model not loaded")
        
    try:
        data = {
            'num_asistentes_reales': [request.num_asistentes],
            'distancia_promedio_km': [request.distancia_promedio_km],
            'dia_semana': [request.dia_semana],
            'duracion_minutos': [request.duracion_minutos],
            'temperatura': [request.temperatura],
            'num_miembros': [request.num_miembros_club],
            'costo_promedio_lugar': [request.costo_promedio_lugar],
            'nivel_precio': [request.nivel_precio],
            'es_fin_de_semana': [str(request.es_fin_de_semana).lower()],
            'categoria_lugar': [request.categoria_lugar]
        }
        df = pd.DataFrame(data)
        
        pred_gasto = app.state.reg_pipeline.predict(df)[0]
        pred_gasto = max(0.0, float(pred_gasto))
        
        mae = app.state.training_report['regresion']['mae'] if app.state.training_report else 0.0
        
        return {
            "gasto_total_estimado_mxn": float(pred_gasto),
            "gasto_por_persona_mxn": float(pred_gasto / request.num_asistentes),
            "rango_bajo_mxn": max(0.0, float(pred_gasto - mae)),
            "rango_alto_mxn": float(pred_gasto + mae),
            "mae_modelo": float(mae)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.get("/models/metrics")
def get_metrics():
    if not app.state.training_report:
        raise HTTPException(status_code=500, detail="Training report not available")
    return app.state.training_report

@app.get("/health")
def get_health():
    warehouse_status = app.state.warehouse_status
    models_status = "ok" if app.state.clf_pipeline and app.state.reg_pipeline else "error"
    status = "ok" if warehouse_status == "ok" and models_status == "ok" else "error"
    return {
        "status": status,
        "warehouse": warehouse_status,
        "models": models_status
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(PORT), reload=True)
