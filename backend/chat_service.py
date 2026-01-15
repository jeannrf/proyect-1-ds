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

        # Obtener contexto del perfil del usuario si existe
        user_profile = context.get("user_profile", "") if context else ""
        profile_instruction = f"\nInformación del usuario y objetivos: {user_profile}\n" if user_profile else ""

        # Construir el System Prompt basado en el contexto
        if context and context.get("has_data"):
            analysis_summary = context.get("analysis_summary", "")
            system_prompt = (
                f"Eres ConsultIA, un experto analista de datos. "
                f"El usuario ha cargado un archivo {context.get('filename')} ({context.get('format')}).\n"
                f"{profile_instruction}"
                f"Resumen técnico de los datos:\n{analysis_summary}\n"
                "Usa esta información para responder preguntas, sugerir análisis adicionales enfocados en los objetivos del usuario "
                "o modelos de ML aplicables. Sé conciso, profesional, útil y mantén el foco en sus metas."
            )
        else:
            system_prompt = (
                "Eres ConsultIA, un asistente inteligente para la plataforma AutoML Advisor. "
                f"{profile_instruction}"
                "Tu objetivo es guiar al usuario. Dile que para empezar su análisis debe subir un dataset (CSV, Excel o JSON). "
                "Si el usuario ya definió sus objetivos, salúdalo reconociendo quien es y motívalo a subir sus datos para empezar."
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
