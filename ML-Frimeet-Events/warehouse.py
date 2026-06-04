import os
import psycopg2
import pandas as pd
import numpy as np
import duckdb
from math import radians, sin, cos, sqrt, asin
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    """
    Retorna una conexión DuckDB en modo read-only para su uso en otras partes de la app.
    """
    duckdb_path = os.getenv("DUCKDB_PATH", "./warehouse.db")
    return duckdb.connect(duckdb_path, read_only=True)

def haversine(lat1, lon1, lat2, lon2):
    if pd.isna(lat1) or pd.isna(lon1) or pd.isna(lat2) or pd.isna(lon2):
        return np.nan
    R = 6371
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1))*cos(radians(lat2))*sin(dlon/2)**2
    return R * 2 * asin(sqrt(a))

def run_etl():
    print("Iniciando ETL: Postgres -> DuckDB")
    pg_url = os.getenv("DATABASE_URL")
    if not pg_url:
        print("Error: DATABASE_URL no encontrada en .env")
        return
        
    # 1. EXTRACCIÓN
    print("Extrayendo datos de PostgreSQL...")
    conn_pg = psycopg2.connect(pg_url)
    conn_pg.autocommit = True
    cur = conn_pg.cursor()
    cur.execute("SET search_path TO frimeet_schema, public;")
    
    df_places = pd.read_sql("""
        SELECT id::varchar AS place_id, name AS nombre, category AS categoria, 
               avg_cost_mxn AS costo_promedio_mxn, avg_rating AS calificacion_promedio, 
               price_level AS nivel_precio
        FROM places
    """, conn_pg)
    
    df_clubs = pd.read_sql("""
        SELECT c.id::varchar AS club_id, c.name AS nombre, c.category AS categoria, 
               c.is_online AS es_online,
               COALESCE(m.num_miembros, 0) AS num_miembros
        FROM clubs c
        LEFT JOIN (
            SELECT club_id, COUNT(*) AS num_miembros 
            FROM club_members GROUP BY club_id
        ) m ON c.id = m.club_id
    """, conn_pg)
    
    df_events = pd.read_sql("""
        SELECT id::varchar AS event_id, title AS titulo, duration_minutes AS duracion_minutos, 
               max_attendees AS max_asistentes, is_public AS es_publico, 
               (club_id IS NOT NULL) AS tiene_club
        FROM events
    """, conn_pg)
    
    df_distances = pd.read_sql("""
        SELECT e.id::varchar AS event_id, a.user_id::varchar as user_id,
               ST_X(u.home_location::geometry) AS user_lon, 
               ST_Y(u.home_location::geometry) AS user_lat,
               ST_X(p.location::geometry) AS place_lon, 
               ST_Y(p.location::geometry) AS place_lat
        FROM events e
        JOIN event_attendees a ON e.id = a.event_id
        JOIN users u ON a.user_id = u.id
        JOIN places p ON e.place_id = p.id
    """, conn_pg)
    
    # Calculate haversine
    df_distances['distancia_km'] = df_distances.apply(
        lambda row: haversine(row['user_lat'], row['user_lon'], row['place_lat'], row['place_lon']), 
        axis=1
    )
    df_dist_agg = df_distances.groupby('event_id')['distancia_km'].mean().reset_index()
    df_dist_agg.rename(columns={'distancia_km': 'distancia_promedio_km'}, inplace=True)
    
    df_attendees = pd.read_sql("""
        SELECT event_id::varchar, 
               SUM(CASE WHEN attendance_status IN ('confirmed', 'attended') THEN 1 ELSE 0 END) AS num_asistentes_confirmados,
               SUM(CASE WHEN attendance_status = 'attended' THEN 1 ELSE 0 END) AS num_asistentes_reales
        FROM event_attendees
        GROUP BY event_id
    """, conn_pg)
    
    df_spending = pd.read_sql("""
        SELECT event_id::varchar, SUM(amount_mxn) AS total_gastado_mxn
        FROM event_spending
        GROUP BY event_id
    """, conn_pg)
    
    df_facts = pd.read_sql("""
        SELECT e.id::varchar AS event_id, e.club_id::varchar, e.place_id::varchar, 
               e.start_time, e.final_aforo_status AS aforo_status,
               w.weather_condition AS condicion_clima, w.temperature AS temperatura
        FROM events e
        LEFT JOIN weather_history w ON DATE(e.start_time) = w.event_date AND w.city = 'Tuxtla Gutiérrez'
    """, conn_pg)
    
    conn_pg.close()
    
    # 2. TRANSFORMACIÓN
    print("Transformando datos en Pandas...")
    df_facts = df_facts.merge(df_attendees, on='event_id', how='left')
    df_facts = df_facts.merge(df_dist_agg, on='event_id', how='left')
    df_facts = df_facts.merge(df_spending, on='event_id', how='left')
    
    df_facts['num_asistentes_confirmados'] = df_facts['num_asistentes_confirmados'].fillna(0).astype(int)
    df_facts['num_asistentes_reales'] = df_facts['num_asistentes_reales'].fillna(0).astype(int)
    df_facts['distancia_promedio_km'] = df_facts['distancia_promedio_km'].fillna(0.0)
    df_facts['total_gastado_mxn'] = df_facts['total_gastado_mxn'].fillna(0.0)
    
    df_facts['gasto_promedio_por_persona_mxn'] = np.where(
        df_facts['num_asistentes_reales'] > 0,
        df_facts['total_gastado_mxn'] / df_facts['num_asistentes_reales'],
        0.0
    )
    
    df_facts['fecha'] = pd.to_datetime(df_facts['start_time']).dt.date
    df_facts['date_id'] = pd.to_datetime(df_facts['fecha']).dt.strftime('%Y%m%d').astype(int)
    df_facts['dia_semana'] = pd.to_datetime(df_facts['start_time']).dt.dayofweek + 1 
    
    df_facts['aforo_lleno'] = (df_facts['aforo_status'] == 'lleno').astype(int)
    
    df_tiempo = df_facts[['date_id', 'fecha', 'dia_semana']].drop_duplicates().copy()
    df_tiempo['fecha_dt'] = pd.to_datetime(df_tiempo['fecha'])
    df_tiempo['nombre_dia'] = df_tiempo['fecha_dt'].dt.day_name()
    df_tiempo['mes'] = df_tiempo['fecha_dt'].dt.month
    df_tiempo['anio'] = df_tiempo['fecha_dt'].dt.year
    df_tiempo['es_fin_de_semana'] = df_tiempo['dia_semana'].isin([6, 7])
    
    df_tiempo['temporada'] = np.where(df_tiempo['mes'].isin([5,6,7,8,9,10]), 'lluvias', 'seca')
    
    df_tiempo = df_tiempo[['date_id', 'fecha', 'dia_semana', 'nombre_dia', 'mes', 'anio', 'es_fin_de_semana', 'temporada']]
    
    df_facts_final = df_facts[[
        'event_id', 'club_id', 'place_id', 'date_id',
        'num_asistentes_confirmados', 'num_asistentes_reales',
        'distancia_promedio_km', 'total_gastado_mxn', 'gasto_promedio_por_persona_mxn',
        'dia_semana', 'condicion_clima', 'temperatura',
        'aforo_status', 'aforo_lleno'
    ]].copy()
    
    df_facts_final.insert(0, 'fact_id', range(1, 1 + len(df_facts_final)))
    
    # 3. CARGA A DUCKDB
    print("Cargando esquema estrella en DuckDB...")
    duckdb_path = os.getenv("DUCKDB_PATH", "./warehouse.db")
    
    # Se elimina si existía (o si estaba abierta se abrirá normal)
    # Por si main lo usaba, es mejor no usar read_only al poblar
    conn_ddb = duckdb.connect(duckdb_path)
    
    conn_ddb.execute("DROP TABLE IF EXISTS hechos_asistencia_eventos")
    conn_ddb.execute("DROP TABLE IF EXISTS dim_evento")
    conn_ddb.execute("DROP TABLE IF EXISTS dim_club")
    conn_ddb.execute("DROP TABLE IF EXISTS dim_lugar")
    conn_ddb.execute("DROP TABLE IF EXISTS dim_tiempo")
    
    conn_ddb.execute('''
        CREATE TABLE dim_tiempo (
            date_id INTEGER PRIMARY KEY,
            fecha DATE,
            dia_semana INTEGER,
            nombre_dia VARCHAR,
            mes INTEGER,
            anio INTEGER,
            es_fin_de_semana BOOLEAN,
            temporada VARCHAR
        )
    ''')
    
    conn_ddb.execute('''
        CREATE TABLE dim_lugar (
            place_id VARCHAR PRIMARY KEY,
            nombre VARCHAR,
            categoria VARCHAR,
            costo_promedio_mxn DECIMAL,
            calificacion_promedio DECIMAL,
            nivel_precio INTEGER
        )
    ''')
    
    conn_ddb.execute('''
        CREATE TABLE dim_club (
            club_id VARCHAR PRIMARY KEY,
            nombre VARCHAR,
            categoria VARCHAR,
            num_miembros INTEGER,
            es_online BOOLEAN
        )
    ''')
    
    conn_ddb.execute('''
        CREATE TABLE dim_evento (
            event_id VARCHAR PRIMARY KEY,
            titulo VARCHAR,
            duracion_minutos INTEGER,
            max_asistentes INTEGER,
            es_publico BOOLEAN,
            tiene_club BOOLEAN
        )
    ''')
    
    conn_ddb.execute('''
        CREATE TABLE hechos_asistencia_eventos (
            fact_id INTEGER PRIMARY KEY,
            event_id VARCHAR,
            club_id VARCHAR,
            place_id VARCHAR,
            date_id INTEGER,
            num_asistentes_confirmados INTEGER,
            num_asistentes_reales INTEGER,
            distancia_promedio_km DECIMAL,
            total_gastado_mxn DECIMAL,
            gasto_promedio_por_persona_mxn DECIMAL,
            dia_semana INTEGER,
            condicion_clima VARCHAR,
            temperatura DECIMAL,
            aforo_status VARCHAR,
            aforo_lleno INTEGER
        )
    ''')
    
    conn_ddb.register('df_tiempo', df_tiempo)
    conn_ddb.execute("INSERT INTO dim_tiempo SELECT * FROM df_tiempo")
    
    conn_ddb.register('df_lugar', df_places)
    conn_ddb.execute("INSERT INTO dim_lugar SELECT * FROM df_lugar")
    
    conn_ddb.register('df_club', df_clubs)
    conn_ddb.execute("""
        INSERT INTO dim_club (club_id, nombre, categoria, num_miembros, es_online)
        SELECT club_id, nombre, categoria, num_miembros, es_online FROM df_club
    """)
    
    conn_ddb.register('df_evento', df_events)
    conn_ddb.execute("INSERT INTO dim_evento SELECT * FROM df_evento")
    
    conn_ddb.register('df_hechos', df_facts_final)
    conn_ddb.execute("INSERT INTO hechos_asistencia_eventos SELECT * FROM df_hechos")
    
    conn_ddb.execute("CREATE INDEX idx_aforo_lleno ON hechos_asistencia_eventos(aforo_lleno)")
    conn_ddb.execute("CREATE INDEX idx_date_id ON hechos_asistencia_eventos(date_id)")
    
    conn_ddb.close()
    
    # 4. VALIDACIÓN
    total_hechos = len(df_facts_final)
    lleno_pct = (df_facts_final['aforo_lleno'] == 1).mean() * 100
    no_lleno_pct = 100 - lleno_pct
    min_gasto = df_facts_final['total_gastado_mxn'].min()
    max_gasto = df_facts_final['total_gastado_mxn'].max()
    mean_gasto = df_facts_final['total_gastado_mxn'].mean()
    
    print("\n=== VALIDACIÓN DEL WAREHOUSE ===")
    print(f"Total hechos: {total_hechos}")
    print(f"Distribución aforo_lleno: lleno={lleno_pct:.1f}%, no_lleno={no_lleno_pct:.1f}%")
    print(f"Rango total_gastado_mxn: min={min_gasto:.2f}, max={max_gasto:.2f}, promedio={mean_gasto:.2f}")
    print("Tablas creadas: dim_tiempo, dim_lugar, dim_club, dim_evento, hechos_asistencia_eventos")

if __name__ == "__main__":
    import warnings
    warnings.filterwarnings('ignore') # Para evitar warnings de pandas SQLAlchemy fallback si aplica
    run_etl()
