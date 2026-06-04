# Proyecto Data Mining — Frimeet 🚀

Este repositorio contiene un pipeline completo de Minería de Datos integrado en una aplicación full stack. El sistema parte de la generación/extracción de los datos y abarca la transformación y carga (ETL), un Data Warehouse (con DuckDB y esquema estrella), el análisis exploratorio (EDA), el entrenamiento de modelos predictivos usando *scikit-learn* y la exposición de todo el trabajo a través de una API (FastAPI) consumida por una interfaz gráfica moderna (Next.js).

Cumpliendo con los lineamientos del **Proyecto de Corte 1**, el repositorio muestra cómo operan y cómo se conectan las distintas capas, desde los datos generados hasta un producto visual (Dashboard y Simuladores OLAP/ML) amigable y usable, sin quedarse en experimentos de libreta (notebook).

---

## 🗂 Estructura Principal del Proyecto

- `EDA.ipynb`: Libreta con el Análisis Exploratorio de Datos reproducible, sirviendo como fundamento estadístico y analítico previo al entrenamiento.
- `ML-Frimeet-Events/`: Módulo Backend y de Ciencia de Datos. Aquí residen la extracción, transformación de datos, el archivo relacional fuente a dimensional analítico (`warehouse.db`), la fase de entrenamiento (`models/train.py`) y la API con `FastAPI` (servida por `main.py`).
- `frimeet/`: Aplicación Frontend construida en **React (Next.js)**. Consume la inteligencia expuesta por el backend permitiendo una interacción de predicción OLAP intuitiva.
- `AI_USAGE.md`: Bitácora que reporta y justifica de forma transparente el uso de tecnologías de IA en el desarrollo del andamiaje según las políticas de la entrega.

---

## 🛠 Requisitos Previos

Asegúrate de contar con los siguientes elementos instalados en tu ambiente local para poder reproducir exitosamente los resultados:

- **Python 3.10** o superior
- **Node.js 18** o superior (con `npm`)
- **PostgreSQL** ejecutándose local o de forma remota (se requieren credenciales en el archivo `.env` del backend).

---

## 🚀 Pasos para Integrar y Correr el Proyecto

Sigue **exactamente** estos pasos para garantizar que tanto la base de datos como la conexión al front-end se realicen exitosamente.

### Parte 1: Capa de Datos, Modelado y Backend (FastAPI)

Abre o utiliza una primera terminal alojada en la respectiva carpeta:

```bash
cd ML-Frimeet-Events
```

**1. Crea y activa tu entorno virtual, e instala dependencias:**
```bash
python -m venv venv

# En Windows:
.\venv\Scripts\activate
# En Mac/Linux:
source venv/bin/activate

# Instalación:
pip install -r requirements.txt
```

**2. Crea tus variables de entorno:**
Genera un archivo `.env` utilizando la plantilla disponible y ajústalo:
```bash
# En Mac/Linux:
cp .env.example .env

# En Windows:
copy .env.example .env
```
> **Nota de Configuración Importante:** Dentro de `.env`, configura el acceso a tu postgresql en la variable `DATABASE_URL`. Revisa y fija el puerto de la variable `PORT`. Se te aconseja dejar `PORT=8000` (predeterminado) o `PORT=8080`. Este puerto luego deberá coincidir con la URL del Frontend.
> **⚠️ Importante:** Asegúrate de haber creado una base de datos vacía en tu gestor de PostgreSQL antes de avanzar al siguiente paso.

**3. Inicializa las tablas en la Base de Datos:**
Esto creará el esquema transaccional subyacente.
```bash
python apply_schema.py
```

**4. Genera de forma sistemática los Datos Sintéticos usando Faker:**
Genera toda la información inicial (Usuarios, Lugares, Clubs y los Eventos base con variables climáticas, etc).
```bash
python seed.py
```

**5. Materializa y ejecuta el proceso ETL al Data Warehouse / Modelo Dimensional:**
Esto construirá `warehouse.db` estructurado para soportar OLAP con DuckDB.
```bash
python warehouse.py
```

**6. Entrena ambos Modelos de Machine Learning (Clasificación y Regresión):**
Proceso obligatorio que lee los datos y exporta los artefactos de tus herramientas scikit-learn (`clf_model.joblib` y `reg_model.joblib`) usados por nuestra API.
```bash
python models/train.py
```

**7. Levanta el servicio Backend:**
El servicio API que expondrá predicciones y responderá OLAP al front.
```bash
python main.py
```
> Comprobación: Su Swagger UI (documentación de Endpoints) ya es funcional en `http://localhost:<PUERTO>/docs`

---

### Parte 2: Capa de Presentación o Frontend (Next.js)

En una **nueva ventana de Terminal**, mantén el backend de FastAPI activo en la terminal previa, y dirígete al directorio respectivo:

```bash
cd frimeet
```

**1. Instala los paquetes de React y dependencias de UI:**
```bash
npm install
```

**2. Empareja o conecta el Endpoint del Backend:**
Crea un archivo de entorno llamado `.env.local` en la raíz de esta carpeta (frimeet) y configura la URL de tu backend. Deberá corresponder con el puerto donde está levantado el backend anterior:
```properties
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**3. Corre el servidor de desarrollo Front:**
```bash
npm run dev
```

La aplicación arrancará automáticamente de manera principal, ingresa en tu navegador usando **[http://localhost:3000](http://localhost:3000)**. 
A partir de aquí, el Frontend podrá ejecutar visualmente tu modelo predictivo consultando las API que generaste y realizando las consultas de Dashboards para visualizar resultados desde el OLAP modelado en el backend sin problemas.

---
## ✒️ Rigor Metodológico
Este proyecto se adhiere tanto a un flujo metodológico como reproducible como lo establecen los puntos 4 de la evaluación académica. En un documento .pdf adjunto al submission oficial se presentan los aspectos técnicos de descarte de variables, decisiones de desbalanceo y límites de métricas utilizadas en los modelos para sustentar estos pipelines.