import { setBaseUrl } from "@workspace/api-client-react";

/**
 * Configura la URL base de la API.
 * 
 * En desarrollo (Vite proxy): usa rutas relativas `/api`
 * En producción (Render): usa la URL del backend desde variable de entorno
 */
export function initializeApiClient() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  
  if (apiBaseUrl) {
    // En producción, setear la URL completa del backend
    setBaseUrl(apiBaseUrl);
  }
  // En desarrollo, dejar sin setBaseUrl para que use rutas relativas con proxy Vite
}
