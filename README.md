# 🤖 AutoML Advisor: Tu Analista de Datos Inteligente

> **Proyecto de Ingeniería de Software - Ciclo 3** > *Una herramienta que democratiza la Ciencia de Datos combinando Machine Learning clásico con IA Generativa. https://automl-advisor-frontend.onrender.com/*

---

## 📖 Descripción del Proyecto

**AutoML Advisor** es una aplicación web diseñada para ayudar a empresas y estudiantes a entender sus datos sin necesidad de ser expertos en matemáticas. 

El sistema permite subir un dataset (CSV), entrena automáticamente múltiples modelos de Inteligencia Artificial para encontrar el que mejor predice los resultados, y finalmente utiliza un **LLM (Large Language Model)** para explicar los hallazgos y dar consejos de negocio en lenguaje natural.

### 🌟 Características Principales
* **📂 Carga de Datos:** Soporte para archivos CSV.
* **🧠 Auto-Training:** Entrena y compara modelos como *Random Forest*, *Regresión Logística* y *Gradient Boosting* automáticamente.
* **🏆 Selección del Ganador:** Identifica cuál es el modelo más preciso para tus datos.
* **💬 Consultor IA:** Un chatbot integrado (potenciado por Groq/Llama3) que analiza las métricas y te da consejos estratégicos.
* **📊 Visualización:** Gráficos interactivos de la precisión de los modelos.

---

## 🛠️ Tecnologías Utilizadas (Tech Stack)

Hemos decidido utilizar una arquitectura robusta y educativa, separando claramente la lógica de negocio de la interfaz visual.

### Backend (El Cerebro) 🐍
* **Lenguaje:** Python 3.10+
* **Framework API:** **FastAPI** (por su velocidad y tipado estricto).
* **Data Science:** Pandas (manipulación de datos) y Scikit-Learn (entrenamiento de modelos).
* **GenAI:** Integración con Groq Cloud API (LLM).

### Frontend (La Cara) 🌐
* **Lenguaje:** JavaScript (Vanilla ES6+) - *Sin frameworks para controlar el DOM manualmente.*
* **Estilos:** CSS3 nativo.
* **Estructura:** HTML5 semántico.
* **Comunicación:** Fetch API (Async/Await).
* **Gráficos:** Chart.js.

---

## 📂 Estructura del Proyecto

```text
proyecto-automl/
│
├── backend/                # Lógica del Servidor y Ciencia de Datos
│   ├── data/               # Datasets de prueba
│   ├── venv/               # Entorno virtual (no se sube a Git)
│   ├── main.py             # API Gateway (FastAPI)
│   ├── motor_ia.py         # Lógica de Scikit-Learn (Entrenamiento)
│   └── requirements.txt    # Dependencias de Python
│
├── frontend/               # Interfaz de Usuario
│   ├── css/
│   │   └── styles.css      # Estilos visuales
│   ├── js/
│   │   └── app.js          # Lógica de conexión (Fetch) y DOM
│   └── index.html          # Estructura de la página
│
└── README.md               # Documentación
