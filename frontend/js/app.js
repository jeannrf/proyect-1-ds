const API_URL = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost'
  ? 'http://127.0.0.1:8000'
  : 'https://automl-advisor-backend.onrender.com';

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

  // Lógica del botón Guardar Contexto
  const saveContextBtn = document.getElementById('save-context-btn');
  const userContextInput = document.getElementById('user-context');

  if (saveContextBtn && userContextInput) {
    saveContextBtn.addEventListener('click', () => {
      const context = userContextInput.value.trim();
      if (context) {
        // Guardar en window para uso posterior
        window.userProfile = context;

        // Feedback visual
        saveContextBtn.innerHTML = '<i class="fa-solid fa-check"></i> Contexto Guardado';
        saveContextBtn.classList.add('saved');

        // Guardar en localStorage para persistencia
        localStorage.setItem('userContext', context);

        setTimeout(() => {
          saveContextBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Contexto';
          saveContextBtn.classList.remove('saved');
        }, 2000);
      }
    });

    // Restaurar contexto guardado previamente
    const savedContext = localStorage.getItem('userContext');
    if (savedContext) {
      userContextInput.value = savedContext;
      window.userProfile = savedContext;
    }
  }

  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const browseBtn = document.querySelector('.btn-browse');

  // Solo configurar el área de carga si existe (para app.html)
  if (dropZone && fileInput) {
    const promptText = dropZone.querySelector('.drop-zone__prompt');

    // Funcionalidad: Click en el drop-zone para abrir explorador
    dropZone.addEventListener('click', (e) => {
      // Evitar doble disparo si se hace clic en el botón
      if (e.target !== browseBtn) {
        fileInput.click();
      }
    });

    // Funcionalidad: Botón "Explorar archivos"
    if (browseBtn) {
      browseBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevenir que el evento burbujee al drop-zone
        fileInput.click();
      });
    }

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

    // Mantener referencia al archivo actual
    window.currentFile = file;

    if (dropZone) {
      dropZone.style.borderColor = 'var(--success)';
      dropZone.style.background = 'rgba(16, 185, 129, 0.05)';
    }

    if (fileInfo) {
      fileInfo.style.display = 'block';
      fileInfo.innerHTML = `<strong><i class="fa-solid fa-file-circle-check"></i> Archivo cargado:</strong> ${file.name} <br> <small>${(file.size / 1024).toFixed(2)} KB</small>`;
    }

    // Subir automáticamente
    uploadFile(file);
  }

  async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const statusText = document.getElementById('status-text');
    const userContext = document.getElementById('user-context')?.value || "";
    const fileInfo = document.getElementById('file-info');

    if (statusText) statusText.textContent = "Analizando...";

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Upload success:", data);
        if (statusText) statusText.textContent = "¡Datos Procesados!";

        // Actualizar info del archivo con éxito - feedback persistente
        if (fileInfo) {
          fileInfo.style.display = 'block';
          fileInfo.className = 'file-info-badge success';
          fileInfo.innerHTML = `
            <div class="file-success-indicator">
              <span class="success-icon"><i class="fa-solid fa-circle-check"></i></span>
              <div>
                <strong>${data.filename}</strong><br>
                <small>${data.columns.length} columnas • ${data.shape[0]} filas • Procesado en memoria</small>
              </div>
            </div>
          `;
        }

        // Guardar en sessionStorage para persistir durante la sesión
        sessionStorage.setItem('uploadedFile', JSON.stringify({
          filename: data.filename,
          columns: data.columns,
          shape: data.shape,
          automl_result: data.automl_result,
          analysis_summary: data.analysis_summary
        }));

        // Guardar contexto para el chat
        window.currentContext = {
          has_data: true,
          filename: data.filename,
          columns: data.columns,
          format: data.detected_format,
          user_profile: userContext,
          analysis_summary: data.analysis_summary
        };

        // Renderizar vista previa de datos
        if (data.preview && data.columns) {
          renderDataPreview(data.columns, data.preview);
        }

        // Renderizar resultados de ML
        if (data.automl_result) {
          renderMLResults(data.automl_result);
        }

        // Notificar al usuario en el chat
        const bestModel = data.automl_result?.best_model || "un modelo";
        const welcomeMsg = userContext
          ? `¡Listo! He procesado **${data.filename}** teniendo en cuenta tu objetivo: *"${userContext}"*. He encontrado que el mejor modelo es **${bestModel}**. ¿Qué analizamos ahora?`
          : `¡He procesado tu archivo **${data.filename}**! He detectado ${data.columns.length} columnas. El mejor modelo para estos datos es **${bestModel}**. ¿En qué puedo ayudarte?`;

        appendMessage("bot", welcomeMsg);
        openChat();

      } else {
        const errorText = await response.text();
        console.error("Upload failed:", errorText);
        if (statusText) statusText.textContent = "Error en procesamiento";
        if (fileInfo) {
          fileInfo.innerHTML = `<strong><i class="fa-solid fa-triangle-exclamation"></i> Error:</strong> No se pudo procesar el archivo. <br><small>Verifica el formato.</small>`;
          fileInfo.style.borderColor = 'rgba(239, 68, 68, 0.3)';
          fileInfo.style.background = 'rgba(239, 68, 68, 0.1)';
          fileInfo.style.color = '#ef4444';
        }
      }
    } catch (error) {
      console.error("Error:", error);
      if (statusText) statusText.textContent = "Error de Conexión";
      // Mantener el archivo visible aunque haya error de conexión
      if (fileInfo && window.currentFile) {
        fileInfo.innerHTML = `<strong><i class="fa-solid fa-plug-circle-xmark"></i> Sin conexión:</strong> ${window.currentFile.name} <br><small>Archivo guardado localmente. Reconecta el servidor.</small>`;
        fileInfo.style.borderColor = 'rgba(251, 191, 36, 0.3)';
        fileInfo.style.background = 'rgba(251, 191, 36, 0.1)';
        fileInfo.style.color = '#fbbf24';
      }
    }
  }

  // Renderiza vista previa de las primeras filas del dataset
  function renderDataPreview(columns, preview) {
    const container = document.getElementById('data-preview-container');
    const table = document.getElementById('preview-table');
    if (!container || !table) return;

    // Mostrar solo las primeras 5 columnas para no saturar la vista
    const maxCols = 5;
    const displayCols = columns.slice(0, maxCols);
    const hasMoreCols = columns.length > maxCols;

    // Crear encabezados
    let headerRow = '<thead><tr>';
    displayCols.forEach(col => {
      headerRow += `<th>${col}</th>`;
    });
    if (hasMoreCols) {
      headerRow += `<th class="more-cols">+${columns.length - maxCols} más</th>`;
    }
    headerRow += '</tr></thead>';

    // Crear filas de datos
    let bodyRows = '<tbody>';
    preview.forEach(row => {
      bodyRows += '<tr>';
      displayCols.forEach(col => {
        const value = row[col] !== undefined ? row[col] : '-';
        bodyRows += `<td>${value}</td>`;
      });
      if (hasMoreCols) {
        bodyRows += '<td class="more-cols">...</td>';
      }
      bodyRows += '</tr>';
    });
    bodyRows += '</tbody>';

    table.innerHTML = headerRow + bodyRows;
    container.style.display = 'block';
  }

  function renderMLResults(result) {
    const container = document.getElementById('ml-results-container');
    if (!container || !result.all_results) return;

    container.innerHTML = `
        <div class="results-summary">
            <span class="badge-target">Objetivo: ${result.target_used}</span>
            <span class="badge-type">${result.problem_type}</span>
        </div>
    `;

    // Ordenar resultados por score descendente
    const sortedModels = Object.entries(result.all_results).sort(([, a], [, b]) => b - a);

    sortedModels.forEach(([name, score]) => {
      const isBest = name === result.best_model;
      const scorePercent = (score * 100).toFixed(1);

      const card = document.createElement('div');
      card.className = `model-result-item ${isBest ? 'best' : ''}`;
      card.innerHTML = `
            <div class="model-info">
                <span class="model-name">${name}</span>
                <span class="model-score">${scorePercent}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${scorePercent}%"></div>
            </div>
        `;
      container.appendChild(card);
    });
  }

  /* --- CHATBOT LOGIC --- */
  const chatSidebar = document.getElementById('chat-sidebar');
  const toggleBtn = document.getElementById('toggle-chat-btn');
  const closeBtn = document.getElementById('close-chat-btn');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const chatMessages = document.getElementById('chat-messages');
  const appContainer = document.querySelector('.app-container');

  function openChat() {
    if (chatSidebar) chatSidebar.classList.add('open');
  }

  function closeChat() {
    if (chatSidebar) chatSidebar.classList.remove('open');
  }

  function toggleChat() {
    if (chatSidebar && chatSidebar.classList.contains('open')) {
      closeChat();
    } else {
      openChat();
    }
  }

  if (toggleBtn) toggleBtn.addEventListener('click', toggleChat);
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
