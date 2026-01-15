import pandas as pd
import os
from io import BytesIO

class DataLoader:
    """
    Clase para cargar datos de diferentes formatos y detectar su tipo.
    """
    @staticmethod
    def detect_format(content: bytes) -> str:
        # Intento básico de detección por contenido/firma o fallar a CSV
        if content.startswith(b"PK\x03\x04"):
            return "Excel (.xlsx)"
        if b"{" in content[:100] and b"}" in content[-100:]:
            return "JSON"
        if content.startswith(b"PAR1"):
            return "Parquet"
        return "CSV"

    @staticmethod
    def load_data(content: bytes, filename: str) -> pd.DataFrame:
        ext = os.path.splitext(filename)[1].lower()
        buffer = BytesIO(content)
        
        try:
            if ext == '.csv':
                df = pd.read_csv(buffer, sep=None, engine='python')
            elif ext in ['.xlsx', '.xls']:
                df = pd.read_excel(buffer)
            elif ext == '.json':
                df = pd.read_json(buffer)
            elif ext == '.parquet':
                df = pd.read_parquet(buffer)
            else:
                # Si la extensión no coincide, intentar cargar por detección
                format_type = DataLoader.detect_format(content)
                if "Excel" in format_type:
                    df = pd.read_excel(buffer)
                elif "JSON" in format_type:
                    df = pd.read_json(buffer)
                else:
                    df = pd.read_csv(buffer, sep=None, engine='python')
            
            return clean_data_logic(df)
            
        except Exception as e:
            raise ValueError(f"Error al cargar el archivo {filename}: {str(e)}")

class FileManager:
    """
    Clase para gestionar el almacenamiento físico de los archivos.
    """
    UPLOAD_DIR = "uploads"

    @staticmethod
    def ensure_upload_dir():
        if not os.path.exists(FileManager.UPLOAD_DIR):
            os.makedirs(FileManager.UPLOAD_DIR)

    @staticmethod
    def save_file(file_content: bytes, filename: str) -> str:
        """
        Guarda el archivo en el directorio de uploads y retorna la ruta absoluta.
        """
        FileManager.ensure_upload_dir()
        file_path = os.path.join(FileManager.UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as f:
            f.write(file_content)
            
        return os.path.abspath(file_path)

    @staticmethod
    def list_files():
        FileManager.ensure_upload_dir()
        return os.listdir(FileManager.UPLOAD_DIR)

def clean_data_logic(df):
    """
    Limpieza básica de datos compartida.
    """
    # Eliminar duplicados
    df = df.drop_duplicates()
    
    # Eliminar columnas totalmente vacías
    df = df.dropna(how='all', axis=1)
    
    # Normalizar nombres de columnas
    df.columns = [str(col).strip().replace(" ", "_").lower() for col in df.columns]
    
    # Intento de conversión de fechas básico
    for col in df.columns:
        if df[col].dtype == 'object':
            try:
                # Solo si parece una fecha (heurística simple)
                if any(x in str(col).lower() for x in ['fecha', 'date', 'time', 'periodo']):
                    df[col] = pd.to_datetime(df[col])
                    df[f'{col}_year'] = df[col].dt.year
                    df[f'{col}_month'] = df[col].dt.month
                    # Podríamos decidir no borrar la original o sí
            except:
                pass
    
    return df
