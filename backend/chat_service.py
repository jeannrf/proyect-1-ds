import os
import groq

class ChatService:
    def __init__(self, api_key: str = None):
        # Intentar obtener la API KEY de variables de entorno si no se pasa explícitamente
        self.api_key = api_key or os.environ.get("GROQ_API_KEY")
        if not self.api_key:
            print("WARNING: No GROQ_API_KEY found. Chat functionality will fail.")
            self.client = None
        else:
            self.client = groq.Groq(api_key=self.api_key)

    def get_response(self, message: str, context: dict = None) -> str:
        if not self.client:
            return "Error: API Key de Groq no configurada. Por favor configura GROQ_API_KEY en el backend."

        # Construir el System Prompt basado en el contexto
        if context and context.get("has_data"):
            analysis_summary = context.get("analysis_summary", "")
            system_prompt = (
                f"Eres ConsultIA, un experto analista de datos. "
                f"El usuario ha cargado un archivo {context.get('filename')} ({context.get('format')}).\n"
                f"Resumen de los datos:\n{analysis_summary}\n"
                "Responde preguntas sobre estos datos, sugiere análisis adicionales o modelos de ML aplicables. "
                "Sé conciso, profesional y útil."
            )
        else:
            system_prompt = (
                "Eres ConsultIA, un asistente inteligente para la plataforma AutoML Advisor. "
                "Tu objetivo es guiar al usuario. Explícale que debe subir un dataset (CSV) "
                "para que puedas analizarlo y entrenar modelos. Sé amable y motivador."
            )

        try:
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message},
                ],
                model="llama-3.3-70b-versatile",
            )
            return chat_completion.choices[0].message.content
        except Exception as e:
            return f"Error al conectar con Groq: {str(e)}"
