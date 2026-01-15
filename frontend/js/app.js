const API_URL = 'http://127.0.0.1:8000';

async function checkServerStatus() {
  const statusIndicator = document.getElementById('status-indicator');
  const statusText = document.getElementById('status-text');

  try {
    const response = await fetch(`${API_URL}/health`); // Use /health endpoint
    if (response.ok) {
      statusIndicator.classList.add('status-online');
      statusText.textContent = "Sistema Online";
    }
  } catch (error) {
    if (statusIndicator) statusIndicator.classList.remove('status-online');
    if (statusText) statusText.textContent = "Servidor Desconectado";
    console.warn("Backend no disponible:", error);
  }
}

// Configurar Drag & Drop y eventos
document.addEventListener('DOMContentLoaded', () => {
  checkServerStatus();

  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');

  // Solo configurar el área de carga si existe (para app.html)
  if (dropZone && fileInput) {
    const promptText = dropZone.querySelector('.drop-zone__prompt');

    // Funcionalidad: Click para abrir explorador de archivos
    dropZone.addEventListener('click', () => {
      fileInput.click();
    });

    // Funcionalidad: Detectar cambio en el input (selección manual)
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length) {
        updateDropZoneUI(fileInput.files[0]);
      }
    });

    // Funcionalidad: Eventos de arrastre
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault(); // Necesario para permitir el drop
      dropZone.classList.add('drop-zone--over');
    });

    ['dragleave', 'dragend'].forEach(type => {
      dropZone.addEventListener(type, () => {
        dropZone.classList.remove('drop-zone--over');
      });
    });

    // Funcionalidad: Soltar archivo
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drop-zone--over');

      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files; // Asignar archivos al input invisible
        updateDropZoneUI(e.dataTransfer.files[0]);
      }
    });
  }

  // Función auxiliar para actualizar la UI al cargar archivo
  function updateDropZoneUI(file) {
    const fileInfo = document.getElementById('file-info');
    const dropZone = document.getElementById('drop-zone');
    if (dropZone) {
      dropZone.style.borderColor = 'var(--success)';
      dropZone.style.background = 'rgba(16, 185, 129, 0.05)';
    }

    if (fileInfo) {
      fileInfo.style.display = 'block';
      fileInfo.innerHTML = `<strong>Archivo listo:</strong> ${file.name} <br> <small>${(file.size / 1024).toFixed(2)} KB</small>`;
    }

    // Aquí podríamos disparar la subida automática
    uploadFile(file);
  }

  async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const statusText = document.getElementById('status-text');
    if (statusText) statusText.textContent = "Procesando...";

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Upload success:", data);
        if (statusText) statusText.textContent = "¡Datos Procesados!";

        // Guardar contexto para el chat (simulado por ahora)
        window.currentContext = {
          has_data: true,
          filename: data.filename,
          columns: data.columns,
          format: data.detected_format
        };

        // Notificar al usuario en el chat si está abierto
        appendMessage("bot", `¡He procesado tu archivo **${data.filename}**! Veo que tiene ${data.columns.length} columnas. ¿Qué te gustaría saber?`);
        openChat();

      } else {
        console.error("Upload failed");
        if (statusText) statusText.textContent = "Error en subida";
      }
    } catch (error) {
      console.error("Error:", error);
      if (statusText) statusText.textContent = "Error de Conexión";
    }
  }

  /* --- CHATBOT LOGIC --- */
  const chatSidebar = document.getElementById('chat-sidebar');
  const toggleBtn = document.getElementById('toggle-chat-btn');
  const closeBtn = document.getElementById('close-chat-btn');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const chatMessages = document.getElementById('chat-messages');

  function openChat() {
    if (chatSidebar) chatSidebar.classList.add('open');
  }

  function closeChat() {
    if (chatSidebar) chatSidebar.classList.remove('open');
  }

  if (toggleBtn) toggleBtn.addEventListener('click', openChat);
  if (closeBtn) closeBtn.addEventListener('click', closeChat);

  // Send Message Logic
  async function sendMessage() {
    if (!chatInput) return;
    const message = chatInput.value.trim();
    if (!message) return;

    // 1. Mostrar mensaje usuario
    appendMessage("user", message);
    chatInput.value = '';

    // 2. Llamar al backend
    try {
      const context = window.currentContext || {};
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message, context })
      });

      if (response.ok) {
        const data = await response.json();
        appendMessage("bot", data.reply);
      } else {
        appendMessage("bot", "Lo siento, tuve un error al conectar con mi cerebro.");
      }
    } catch (error) {
      appendMessage("bot", "Error de red. Verifica que el backend esté corriendo.");
    }
  }

  function appendMessage(role, text) {
    if (!chatMessages) return;
    const div = document.createElement('div');
    div.classList.add('message', role === 'user' ? 'user-message' : 'bot-message');
    // Simple markdown parsing replacement (negritas)
    div.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  if (sendBtn) sendBtn.addEventListener('click', sendMessage);
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }

});
