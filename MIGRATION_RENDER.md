# Guía de Migración de Mercanto a Render

## Problema Identificado

Tras migrar de Replit a Render, las tiendas y productos no se mostraban en la aplicación. Esto ocurría por dos razones principales:

### 1. **Configuración de CORS incompleta**
El backend estaba configurado solo para aceptar orígenes de Replit y localhost. En Render, el frontend y la API se ejecutan en dominios diferentes (ej: `mercanto.onrender.com` y `api-mercanto.onrender.com`), por lo que las solicitudes CORS fallaban.

### 2. **URL base de la API no configurada en el frontend**
El cliente API del frontend usaba rutas relativas (`/api/...`) que funcionaban en Replit con el proxy de Vite, pero en Render necesita la URL completa del backend.

## Cambios Realizados

### Frontend (`artifacts/mercanto/`)

#### 1. Nuevo archivo `src/lib/api.ts`
Crea una función `initializeApiClient()` que configura la URL base de la API en producción:

```typescript
import { setBaseUrl } from "@workspace/api-client-react";

export function initializeApiClient() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  
  if (apiBaseUrl) {
    setBaseUrl(apiBaseUrl);
  }
}
```

#### 2. Actualización de `src/main.tsx`
Inicializa el cliente API antes de renderizar la aplicación:

```typescript
import { initializeApiClient } from "./lib/api";

initializeApiClient();
```

#### 3. Actualización de `vite.config.ts`
Expone la variable de entorno `VITE_API_BASE_URL` al código del cliente:

```typescript
define: {
  'import.meta.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || ''),
},
```

### Backend (`artifacts/api-server/`)

#### 1. Mejora de CORS en `src/app.ts`
Se agregaron dominios de Render a la lista de orígenes permitidos:

```typescript
origin.endsWith(".onrender.com") ||
origin.endsWith(".render.com")
```

Además, se agregó logging para facilitar el debugging de problemas de CORS.

### Archivos de Configuración

#### `.env.example` (raíz)
Se agregó la variable `VITE_API_BASE_URL` con instrucciones:

```env
# API (URL base de la API para el cliente frontend en producción)
# En desarrollo con Vite proxy, dejar vacío o comentado
# En producción (Render), usar la URL completa del backend, ej: https://api.mercanto.onrender.com
VITE_API_BASE_URL=
```

#### `artifacts/api-server/.env.example`
Se mejoró la documentación de `FRONTEND_URL`.

## Instrucciones de Despliegue en Render

### Para el Backend (API)

1. Crear un nuevo servicio Web en Render
2. Conectar el repositorio de GitHub
3. Configurar las variables de entorno:
   - `DATABASE_URL`: URL de la base de datos PostgreSQL
   - `JWT_SECRET`: Generar con `openssl rand -base64 32`
   - `FRONTEND_URL`: URL del frontend en Render (ej: `https://mercanto.onrender.com`)
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `MAX_PRODUCTS_PER_STORE`: 30 (o el valor deseado)

4. Configurar el comando de inicio:
   ```bash
   pnpm install && pnpm run build && pnpm --filter @workspace/api-server run start
   ```

5. Configurar el puerto: `8080` (o el que uses)

### Para el Frontend

1. Crear un nuevo servicio Web en Render
2. Conectar el repositorio de GitHub
3. Configurar las variables de entorno:
   - `PORT`: 3000 (o el puerto deseado)
   - `BASE_PATH`: `/` (o la ruta base si está en un subdirectorio)
   - `API_PORT`: 8080 (para desarrollo local)
   - `VITE_API_BASE_URL`: URL completa del backend en Render (ej: `https://api-mercanto.onrender.com`)

4. Configurar el comando de inicio:
   ```bash
   pnpm install && pnpm run build && pnpm --filter @workspace/mercanto run serve
   ```

5. Configurar el puerto: El valor de `PORT`

## Verificación

Después de desplegar, verifica que:

1. **Las tiendas se cargan**: Accede a la página principal y confirma que se muestran las tiendas
2. **Los productos se cargan**: Haz clic en una tienda y verifica que se muestran sus productos
3. **No hay errores de CORS**: Abre la consola del navegador (F12) y verifica que no hay errores de CORS
4. **Las imágenes cargan**: Verifica que las imágenes de tiendas y productos se muestran correctamente

## Debugging

Si aún hay problemas:

1. **Revisa los logs del backend**: Busca mensajes sobre "CORS allowed origins configured" y "CORS: Origin not allowed"
2. **Verifica la consola del navegador**: Busca errores de red o CORS
3. **Confirma las variables de entorno**: Asegúrate de que `FRONTEND_URL` y `VITE_API_BASE_URL` estén correctamente configuradas
4. **Prueba la API directamente**: Accede a `https://api-mercanto.onrender.com/api/healthz` para verificar que el backend está funcionando

## Notas Importantes

- **En desarrollo local**: El proxy de Vite maneja las solicitudes a `/api`, así que `VITE_API_BASE_URL` puede estar vacío
- **En producción**: `VITE_API_BASE_URL` debe ser la URL completa del backend (ej: `https://api-mercanto.onrender.com`)
- **CORS**: Asegúrate de que `FRONTEND_URL` en el backend coincida exactamente con la URL del frontend
- **Base de datos**: Asegúrate de que la base de datos esté correctamente migrada antes de desplegar

## Cambios de Código

Los cambios realizados son mínimos y no afectan la lógica de negocio:

- ✅ Nuevo archivo `src/lib/api.ts` (inicialización del cliente API)
- ✅ Actualización de `src/main.tsx` (llamada a `initializeApiClient()`)
- ✅ Actualización de `vite.config.ts` (exposición de variable de entorno)
- ✅ Mejora de CORS en `src/app.ts` (soporte para Render)
- ✅ Actualización de archivos `.env.example` (documentación)

Todos los cambios son hacia atrás compatibles y no rompen el funcionamiento en Replit o desarrollo local.
