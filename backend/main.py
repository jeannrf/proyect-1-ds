from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from files import DataLoader, FileManager
from ml import DataAnalyzer
from dotenv import load_dotenv

# Cargar variables de entorno del archivo .env
load_dotenv()

app = FastAPI()

# Configurar CORS para permitir que el frontend se comunique con el backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, esto debería ser más restrictivo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "¡Hola! El servidor de AutoML Advisor está funcionando correctamente 🚀"}

from pydantic import BaseModel
from chat_service import ChatService

# Modelos Pydantic
class ChatRequest(BaseModel):
    message: str
    context: dict = {}

# Inicializar servicio de chat
chat_service = ChatService()

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "backend"}

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Endpoint para conversar con ConsultIA (Groq).
    """
    response = chat_service.get_response(request.message, request.context)
    return {"reply": response}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Endpoint para subir archivos (CSV, Excel, JSON, Parquet).
    Utiliza DataLoader para detectar y cargar el contenido.
    """
    try:
        content = await file.read()
        
        # 1. Guardar archivo temporalmente
        file_path = FileManager.save_file(content, file.filename)
        
        # 2. Cargar datos
        df = DataLoader.load_data(content, file.filename)
        
        # 3. Generar análisis para el chat
        analysis_summary = DataAnalyzer.generate_llm_summary(df)
        
        return {
            "filename": file.filename,
            "detected_format": DataLoader.detect_format(content),
            "shape": df.shape,
            "columns": df.columns.tolist(),
            "preview": df.head(5).to_dict(orient="records"),
            "analysis_summary": analysis_summary,
            "file_path": file_path
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")
