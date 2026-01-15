import pandas as pd
import os

def load_universal_data(file_path):
    ext = os.path.splitext(file_path)[1].lower()
    
    try:
        if ext == '.csv':
            df = pd.read_csv(file_path, sep=None, engine='python')
        elif ext in ['.xlsx', '.xls']:
            df = pd.read_excel(file_path)
        elif ext == '.json':
            df = pd.read_json(file_path)
        elif ext == '.parquet':
            df = pd.read_parquet(file_path)
        else:
            raise ValueError(f"Formato {ext} no soportado actualmente.")
            
        return clean_data_logic(df)
    
    except Exception as e:
        raise ValueError(f"Error al cargar el archivo detectado como {ext}: {str(e)}")

class FileManager:
    """
    Clase para gestionar el almacenamiento físico de los archivos.
    """
    UPLOAD_DIR = "uploads"

    @staticmethod
    def ensure_upload_dir():
        import os
        if not os.path.exists(FileManager.UPLOAD_DIR):
            os.makedirs(FileManager.UPLOAD_DIR)

    @staticmethod
    def save_file(file_content: bytes, filename: str) -> str:
        """
        Guarda el archivo en el directorio de uploads y retorna la ruta absoluta.
        """
        import os
        FileManager.ensure_upload_dir()
        file_path = os.path.join(FileManager.UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as f:
            f.write(file_content)
            
        return os.path.abspath(file_path)

    @staticmethod
    def list_files():
        import os
        FileManager.ensure_upload_dir()
        return os.listdir(FileManager.UPLOAD_DIR)

def clean_data_logic(df):

    df = df.drop_duplicates()
    df = df.dropna(how='all', axis=1)
    df.columns = [str(col).strip().replace(" ", "_").lower() for col in df.columns]
    
    for col in df.columns:
    if df[col].dtype == 'object':
        try:
            df[col] = pd.to_datetime(df[col])
            df[f'{col}_year'] = df[col].dt.year
            df[f'{col}_month'] = df[col].dt.month
            df = df.drop(columns=[col])
        except:
            pass
    
    return df
