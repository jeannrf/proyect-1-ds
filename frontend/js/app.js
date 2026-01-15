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
    statusIndicator.classList.remove('status-online');
    statusText.textContent = "Servidor Desconectado";
    console.warn("Backend no disponible:", error);
  }
}

// Configurar Drag & Drop y eventos
document.addEventListener('DOMContentLoaded', () => {
  checkServerStatus();

  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
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

  // Función auxiliar para actualizar la UI al cargar archivo
  function updateDropZoneUI(file) {
    const fileInfo = document.getElementById('file-info');
    dropZone.style.borderColor = 'var(--success)';
    dropZone.style.background = 'rgba(16, 185, 129, 0.05)';

    fileInfo.style.display = 'block';
    fileInfo.innerHTML = `<strong>Archivo listo:</strong> ${file.name} <br> <small>${(file.size / 1024).toFixed(2)} KB</small>`;

    // Aquí podríamos disparar la subida automática
    uploadFile(file);
  }

  async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const statusText = document.getElementById('status-text');
    statusText.textContent = "Procesando...";

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Upload success:", data);
        statusText.textContent = "¡Datos Procesados!";
        // Aquí podrías actualizar la UI con los datos recibidos (data.preview, data.columns, etc)
      } else {
        console.error("Upload failed");
        statusText.textContent = "Error en subida";
      }
    } catch (error) {
      console.error("Error:", error);
      statusText.textContent = "Error de Conexión";
    }
  }
});
