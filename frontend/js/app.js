const API_URL = 'http://127.0.0.1:8000';

async function checkServerStatus() {
  const statusText = document.getElementById('status-text');
  const statusBox = document.getElementById('status-indicator');

  try {
    const response = await fetch(`${API_URL}/`);
    const data = await response.json();

    if (response.ok) {
      statusText.textContent = "Sistema Online";
      statusBox.classList.add('status-connected');
      console.log("Respuesta del servidor:", data.message);
    } else {
      throw new Error('Servidor respondió con error');
    }
  } catch (error) {
    console.error("Error al conectar:", error);
    statusText.textContent = "Servidor Desconectado (Ejecuta el backend)";
    statusBox.classList.remove('status-connected');
  }
}

// Verificar estado al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  checkServerStatus();
});
