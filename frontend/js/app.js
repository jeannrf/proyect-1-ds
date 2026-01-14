const API_URL = 'http://127.0.0.1:8000';

async function checkServerStatus() {
  const statusText = document.getElementById('status-text');
  const uploadArea = document.getElementById('upload-area');

  try {
    const response = await fetch(`${API_URL}/`);
    if (response.ok) {
      statusText.textContent = "Sistema Online";
      // MOSTRAR el área de carga cuando el servidor responda
      uploadArea.style.display = "block";
    }
  } catch (error) {
    statusText.textContent = "Servidor Desconectado (Ejecuta el backend)";
    uploadArea.style.display = "none";
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
    promptText.textContent = `Archivo listo: ${file.name}`;
    promptText.style.fontWeight = 'bold';
    promptText.style.color = '#e2e8f0'; // Color claro para resaltar
    dropZone.style.borderColor = 'var(--success-color)';
    dropZone.style.borderStyle = 'solid';
  }
});
