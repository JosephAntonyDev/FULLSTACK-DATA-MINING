# ML-FRIMEET-EVENTS Backend & Machine Learning API

Este repositorio contiene todo el ecosistema de Machine Learning para el proyecto **Frimeet**. Incluye la creación automática de la base de datos de PostgreSQL, generación de datos sintéticos realistas, un flujo completo ETL hacia un data warehouse local (DuckDB), el entrenamiento de modelos predictivos usando scikit-learn, y una API rápida en FastAPI para exponer la inteligencia a la aplicación principal.

---

## 🚀 Requisitos Previos
- **Python 3.10+**
- **PostgreSQL** (Ejecutándose de forma local o remota)

---

## 🛠 Instalación y Despliegue (Paso a Paso)

Sigue estos pasos en tu terminal para levantar todo el pipeline desde cero en un ambiente local limpio:

### 1. Clonar el repositorio y configurar el Entorno Virtual
Crea un entorno virtual para aislar las dependencias de Python y actívalo.

**En Windows:**
```bash
python -m venv venv
.\venv\Scripts\activate
```
*(En macOS/Linux usa: `source venv/bin/activate`)*

### 2. Instalar las dependencias
```bash
pip install -r requirements.txt
```

### 3. Configurar Variables de Entorno
Copia el archivo de plantilla `.env.example` y renómbralo a `.env`.

**En Windows (PowerShell):**
```bash
Copy-Item .env.example .env
```
*(En macOS/Linux usa: `cp .env.example .env`)*

**Importante:** Abre el nuevo archivo `.env` recién creado y ajusta la variable `DATABASE_URL` con las credenciales de tu propio servidor PostgreSQL local. *(Ejemplo: `DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/frimeet_local"`)*

### 4. Levantar la Estructura de la Base de Datos
Aplica la estructura DDL completa en tu base de datos de PostgreSQL para crear el esquema y todas las tablas vacías.
```bash
python apply_schema.py
```

### 5. Sembrar Datos Sintéticos (Seed)
Genera toda la información inicial (Usuarios, Lugares, Clubs, Historial del Clima y Eventos simulados con asistentes reales).
```bash
python seed.py
```

### 6. Ejecutar el Proceso ETL
Extrae, transforma y carga la información desde PostgreSQL hacia un esquema estrella optimizado localmente con DuckDB (`warehouse.db`).
```bash
python warehouse.py
```

### 7. Entrenar Modelos de Machine Learning
Extrae features del warehouse para entrenar y evaluar el modelo de Clasificación (probabilidad de Aforo Lleno) y el modelo de Regresión Lineal (predicción de Gasto Total). Los artefactos resultantes (`.joblib`) se guardarán automáticamente en la carpeta `/models`.
```bash
python models/train.py
```

### 8. Arrancar la API
Inicia el servidor backend utilizando FastAPI.
```bash
python main.py
```

---

## 🔎 Acceder a la Documentación (Swagger UI)

Una vez que hayas ejecutado `main.py`, la API estará disponible localmente. Dirígete a tu navegador para probar y explorar directamente los endpoints predictivos (ML) y analíticos (OLAP):

👉 **[http://localhost:8000/docs](http://localhost:8000/docs)**
