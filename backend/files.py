import pandas as pd
import json
import csv
import io

class DataLoader:
    """
    Clase encargada de detectar automáticamente el formato de un archivo y cargarlo.
    """

    @staticmethod
    def detect_format(file_content: bytes) -> str:
        """
        Intenta detectar el formato basado en el contenido del archivo (bytes).
        Retorna: 'csv', 'json', 'excel', 'parquet' o 'unknown'.
        """
        # 1. Detectar Excel (XLSX signature: PK\x03\x04)
        if file_content.startswith(b'PK\x03\x04'):
            # Podría ser zip, pero en contexto de datos suele ser xlsx
            return 'excel'
        
        # 2. Detectar Excel antiguo (XLS signature: D0 CF 11 E0)
        if file_content.startswith(b'\xD0\xCF\x11\xE0'):
            return 'excel'
            
        # 3. Detectar Parquet (PAR1)
        if file_content.startswith(b'PAR1'):
            return 'parquet'

        # 4. Intentar interpretar como texto
        try:
            text_content = file_content.decode('utf-8', errors='ignore').strip()
            
            # JSON? Empieza por { o [
            if text_content.startswith('{') or text_content.startswith('['):
                try:
                    json.loads(text_content)
                    return 'json'
                except ValueError:
                    pass # Parecía JSON pero no lo es
            
            # CSV? Usar csv.Sniffer
            # Tomamos una muestra de las primeras lineas
            sample = '\n'.join(text_content.splitlines()[:5])
            try:
                dialect = csv.Sniffer().sniff(sample)
                return 'csv'
            except csv.Error:
                pass
                
        except Exception:
            pass
            
        return 'unknown'

    @staticmethod
    def load_data(file_content: bytes, filename: str = "") -> pd.DataFrame:
        """
        Carga los datos en un DataFrame de Pandas detectando el formato.
        """
        format_type = DataLoader.detect_format(file_content)
        
        # Buffer de bytes para pandas
        buffer = io.BytesIO(file_content)
        
        try:
            if format_type == 'csv':
                # Volver al inicio del buffer/texto es necesario a veces, 
                # pero read_csv admite bytes si encoding es correcto o StringIO
                buffer.seek(0)
                return pd.read_csv(buffer)
                
            elif format_type == 'json':
                buffer.seek(0)
                return pd.read_json(buffer)
                
            elif format_type == 'excel':
                buffer.seek(0)
                return pd.read_excel(buffer)
                
            elif format_type == 'parquet':
                buffer.seek(0)
                return pd.read_parquet(buffer)
                
            else:
                # Fallback: Intentar por extensión si el contenido falló
                if filename.endswith('.csv'):
                    buffer.seek(0)
                    return pd.read_csv(buffer)
                elif filename.endswith('.xlsx') or filename.endswith('.xls'):
                    buffer.seek(0)
                    return pd.read_excel(buffer)
                elif filename.endswith('.json'):
                    buffer.seek(0)
                    return pd.read_json(buffer)
                
                raise ValueError("Formato de archivo no reconocido o no soportado.")
                
        except Exception as e:
            raise ValueError(f"Error al cargar el archivo detectado como {format_type}: {str(e)}")
