import os
import json
import numpy as np
import pandas as pd
import duckdb
import joblib
from dotenv import load_dotenv

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

load_dotenv()

def train_models():
    duckdb_path = os.getenv("DUCKDB_PATH", "./warehouse.db")
    conn = duckdb.connect(duckdb_path, read_only=True)
    
    print("=== TAREA 1: CLASIFICACIÓN ===")
    
    query_clf = """
        SELECT h.dia_semana, h.condicion_clima, h.temperatura, h.num_asistentes_confirmados,
               h.distancia_promedio_km, e.duracion_minutos, t.es_fin_de_semana,
               c.num_miembros AS num_miembros_club,
               l.costo_promedio_mxn AS costo_promedio_lugar,
               h.aforo_lleno
        FROM hechos_asistencia_eventos h
        LEFT JOIN dim_club c ON h.club_id = c.club_id
        LEFT JOIN dim_lugar l ON h.place_id = l.place_id
        LEFT JOIN dim_evento e ON h.event_id = e.event_id
        LEFT JOIN dim_tiempo t ON h.date_id = t.date_id
        WHERE h.aforo_status != 'cerrado'
    """
    
    df_clf = conn.execute(query_clf).fetchdf()
    
    # Preprocessing
    df_clf['num_miembros_club'] = df_clf['num_miembros_club'].fillna(0)
    df_clf['es_fin_de_semana'] = df_clf['es_fin_de_semana'].astype(str)
    
    num_features_clf = ['dia_semana', 'temperatura', 'num_asistentes_confirmados',
                        'distancia_promedio_km', 'duracion_minutos', 'num_miembros_club',
                        'costo_promedio_lugar']
    cat_features_clf = ['condicion_clima', 'es_fin_de_semana']
    
    X_clf = df_clf[num_features_clf + cat_features_clf]
    y_clf = df_clf['aforo_lleno']
    
    pos_pct = y_clf.mean() * 100
    
    X_train_c, X_test_c, y_train_c, y_test_c = train_test_split(
        X_clf, y_clf, test_size=0.2, random_state=42, stratify=y_clf
    )
    
    preprocessor_clf = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), num_features_clf),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), cat_features_clf)
        ]
    )
    
    # Models
    pipe_lr = Pipeline([
        ('preprocessor', preprocessor_clf),
        ('classifier', LogisticRegression(max_iter=1000, random_state=42))
    ])
    
    pipe_knn = Pipeline([
        ('preprocessor', preprocessor_clf),
        ('classifier', KNeighborsClassifier(n_neighbors=5))
    ])
    
    models = {
        'LogisticRegression': pipe_lr,
        'KNeighborsClassifier': pipe_knn
    }
    
    results = {}
    for name, model in models.items():
        model.fit(X_train_c, y_train_c)
        y_pred = model.predict(X_test_c)
        y_proba = model.predict_proba(X_test_c)[:, 1] if hasattr(model, "predict_proba") else None
        
        acc = accuracy_score(y_test_c, y_pred)
        prec = precision_score(y_test_c, y_pred, zero_division=0)
        rec = recall_score(y_test_c, y_pred, zero_division=0)
        f1 = f1_score(y_test_c, y_pred, zero_division=0)
        auc = roc_auc_score(y_test_c, y_proba) if y_proba is not None else np.nan
        cm = confusion_matrix(y_test_c, y_pred)
        
        results[name] = {'f1': f1, 'auc': auc, 'model': model}
        
        print(f"\nModelo: {name}")
        print(f"Accuracy:  {acc:.2f} | Precision: {prec:.2f} | Recall: {rec:.2f} | F1: {f1:.2f}")
        print(f"AUC-ROC: {auc:.2f}")
        print("Matriz de confusión:")
        print(cm)
        
    best_model_name = max(results, key=lambda k: results[k]['f1'])
    best_f1 = results[best_model_name]['f1']
    best_auc = results[best_model_name]['auc']
    
    print(f"\n=== GANADOR: {best_model_name} ===")
    print(f"Justificación: F1 elegido sobre accuracy porque el dataset está desbalanceado ({pos_pct:.1f}% positivos). AUC-ROC de {best_auc:.2f} indica una buena capacidad de distinción entre clases positivas y negativas.")
    
    # Save
    os.makedirs('models', exist_ok=True)
    
    joblib.dump(results[best_model_name]['model'], 'models/clf_model.joblib')
    alt_model_name = [m for m in models if m != best_model_name][0]
    joblib.dump(results[alt_model_name]['model'], 'models/clf_model_alt.joblib')
    
    # === TAREA 2: REGRESIÓN ===
    print("\n=== TAREA 2: REGRESIÓN ===")
    
    query_reg = """
        SELECT h.num_asistentes_reales, h.distancia_promedio_km, h.dia_semana,
               e.duracion_minutos, h.temperatura, t.es_fin_de_semana,
               c.num_miembros,
               l.costo_promedio_mxn AS costo_promedio_lugar, 
               l.nivel_precio, l.categoria AS categoria_lugar,
               h.total_gastado_mxn
        FROM hechos_asistencia_eventos h
        LEFT JOIN dim_club c ON h.club_id = c.club_id
        LEFT JOIN dim_lugar l ON h.place_id = l.place_id
        LEFT JOIN dim_evento e ON h.event_id = e.event_id
        LEFT JOIN dim_tiempo t ON h.date_id = t.date_id
        WHERE h.total_gastado_mxn > 0
    """
    
    df_reg = conn.execute(query_reg).fetchdf()
    
    df_reg['num_miembros'] = df_reg['num_miembros'].fillna(0)
    df_reg['es_fin_de_semana'] = df_reg['es_fin_de_semana'].astype(str)
    
    num_features_reg = ['num_asistentes_reales', 'distancia_promedio_km', 'dia_semana',
                        'duracion_minutos', 'temperatura', 'num_miembros',
                        'costo_promedio_lugar', 'nivel_precio']
    cat_features_reg = ['es_fin_de_semana', 'categoria_lugar']
    
    X_reg = df_reg[num_features_reg + cat_features_reg]
    y_reg = df_reg['total_gastado_mxn']
    
    X_train_r, X_test_r, y_train_r, y_test_r = train_test_split(
        X_reg, y_reg, test_size=0.2, random_state=42
    )
    
    preprocessor_reg = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), num_features_reg),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), cat_features_reg)
        ]
    )
    
    pipe_reg = Pipeline([
        ('preprocessor', preprocessor_reg),
        ('regressor', LinearRegression())
    ])
    
    pipe_reg.fit(X_train_r, y_train_r)
    y_pred_r = pipe_reg.predict(X_test_r)
    
    mae = mean_absolute_error(y_test_r, y_pred_r)
    rmse = np.sqrt(mean_squared_error(y_test_r, y_pred_r))
    r2 = r2_score(y_test_r, y_pred_r)
    
    print(f"MAE:  {mae:.2f} (error promedio de ${mae:.2f} MXN)")
    print(f"RMSE: {rmse:.2f}")
    print(f"R²:   {r2:.2f}")
    if r2 < 0.4:
        print("Nota honesta: R² es menor a 0.4. El modelo lineal tiene un bajo poder predictivo y explica poca varianza del gasto total basándose en los features provistos.")
        
    joblib.dump(pipe_reg, 'models/reg_model.joblib')
    
    conn.close()
    
    # Save JSON report
    report = {
        "clasificacion": {
            "modelo_ganador": best_model_name,
            "f1_ganador": float(best_f1),
            "auc_roc_ganador": float(best_auc),
            "f1_alternativo": float(results[alt_model_name]['f1']),
            "n_train": len(X_train_c),
            "n_test": len(X_test_c),
            "distribucion_positivos_pct": float(pos_pct),
            "features": num_features_clf + cat_features_clf
        },
        "regresion": {
            "mae": float(mae),
            "rmse": float(rmse),
            "r2": float(r2),
            "n_train": len(X_train_r),
            "n_test": len(X_test_r),
            "features": num_features_reg + cat_features_reg
        }
    }
    
    with open('models/training_report.json', 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    train_models()
