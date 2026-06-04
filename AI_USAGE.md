# Declaración de Uso de Inteligencia Artificial

## Proyecto: ML-FRIMEET-EVENTS

De acuerdo con la política de integridad académica del curso de Minería de Datos, declaro de manera transparente el uso de herramientas de Inteligencia Artificial (ChatGPT y Gemini) durante el desarrollo de este proyecto.

La IA fue utilizada como una herramienta de apoyo para acelerar tareas de implementación, documentación y generación de código repetitivo. Todas las decisiones relacionadas con el problema de negocio, el diseño de datos, el análisis exploratorio, el modelado y la interpretación de resultados fueron comprendidas, supervisadas y validadas por mí.

---

## Trabajo propio: Diseño y toma de decisiones

### Definición del problema

Definí el enfoque analítico del proyecto a partir de necesidades reales del ecosistema Frimeet:

* Predicción de aforo de eventos (clasificación).
* Estimación de gasto logístico de asistentes (regresión).
* Construcción de indicadores útiles para la toma de decisiones.

La selección de objetivos, variables objetivo, métricas y criterios de evaluación fue realizada por mí.

### Diseño del Data Warehouse

Diseñé el modelo dimensional implementado en DuckDB utilizando un esquema estrella.

Definí:

* Tabla de hechos `hechos_asistencia_eventos`.
* Dimensión de tiempo.
* Dimensión de lugar.
* Dimensión de club.
* Dimensión de evento.

También definí las relaciones necesarias para soportar consultas analíticas y procesos de Machine Learning.

### Diseño del dataset

Tomé la decisión de utilizar como dominio de trabajo el ecosistema de Frimeet, proyecto que actualmente desarrollo como parte de mi Proyecto Integrador. Esto permitió diseñar un modelo de datos, un Data Warehouse y tareas de Machine Learning alineadas con necesidades reales del sistema, en lugar de utilizar datasets genéricos o ejercicios desconectados de una aplicación en desarrollo. Con esto, pude generar datos sintéticos coherentes con el modelo de negocio para simular eventos, asistentes, gastos y comportamiento de ocupación.

La definición de variables, restricciones y reglas de generación fue supervisada y validada por mí.

### EDA y preprocesamiento

Realicé y comprendí las decisiones relacionadas con:

* Identificación de valores faltantes.
* Análisis de distribuciones.
* Detección de desbalance de clases.
* Selección de variables.
* Codificación de variables categóricas.
* Escalado y normalización cuando fue necesario.

### Prevención de fuga de datos

Diseñé el pipeline considerando la separación estricta entre entrenamiento y evaluación.

La transformación de datos se realiza únicamente utilizando información disponible antes de la variable objetivo para evitar data leakage y garantizar una evaluación válida de los modelos.

### Modelado y evaluación

Seleccioné y comparé los algoritmos utilizados en el proyecto:

#### Clasificación

* Regresión Logística
* K-Nearest Neighbors (KNN)

Evalué los modelos utilizando métricas apropiadas para el problema, incluyendo:

* Accuracy
* Precision
* Recall
* F1-Score
* ROC-AUC

#### Regresión

Seleccioné métricas de evaluación para estimar la calidad de las predicciones de gasto, incluyendo:

* MAE
* RMSE
* R²

La interpretación de resultados y la selección del modelo final fueron realizadas por mí.

---

## Uso de IA como herramienta de apoyo

La Inteligencia Artificial fue utilizada principalmente para acelerar tareas de desarrollo y reducir trabajo repetitivo.

### Generación de código de infraestructura

Utilicé asistencia de IA para:

* Estructurar archivos base del proyecto.
* Generar código repetitivo.
* Resolver dudas de implementación.
* Crear configuraciones iniciales de librerías y frameworks.

### API

La IA fue utilizada como apoyo para:

* Estructurar endpoints.
* Definir esquemas de validación.
* Configurar componentes básicos del servidor.
* Integrar los modelos entrenados dentro de una API.

Todas las integraciones fueron revisadas y adaptadas por mí.

### Frontend

La IA se utilizó para acelerar:

* Creación de componentes de interfaz.
* Formularios y validaciones.
* Integración con la API.
* Estructuración de pantallas y estilos.

Las decisiones funcionales y la validación del comportamiento final fueron realizadas por mí.

### Documentación

La IA fue utilizada como apoyo para:

* Mejorar redacción.
* Organizar documentación técnica.
* Formatear archivos Markdown.
* Generar borradores iniciales de documentación.

Toda la documentación final fue revisada y ajustada por mí.

---

## Declaración final

La Inteligencia Artificial fue utilizada como una herramienta de asistencia y productividad, no como sustituto del análisis realizado en el proyecto.

Las decisiones relacionadas con el problema de negocio, el diseño del Data Warehouse, el preprocesamiento, la prevención de fuga de datos, la selección de modelos, la evaluación de resultados y las conclusiones fueron comprendidas, supervisadas y defendibles por mí.

