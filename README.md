# GitHub Profile Challenge

Aplicación simple para consultar y visualizar perfiles públicos de GitHub.

El proyecto está separado en dos aplicaciones:

- `backend/`: API en NestJS.
- `frontend/`: interfaz en NextJS.

## Requisitos

- Node.js
- npm

Si usas `nvm`, carga tu versión de Node antes de instalar o ejecutar comandos.

## Instalación

Desde la raíz del proyecto:

```sh
npm install
```

## Ejecutar el backend

```sh
cd backend
npm run dev
```

El backend queda disponible en:

```txt
http://localhost:3001
```

### Endpoint principal

```txt
GET /user/:username
```

Ejemplo:

```txt
http://localhost:3001/user/pedrocrack05
```

El endpoint consulta la API pública de GitHub y devuelve información como:

- nombre
- usuario
- bio
- avatar
- URL del perfil
- repositorios públicos
- seguidores
- siguiendo
- fecha de creación
- fecha de actualización

## Ejecutar el frontend

En otra terminal:

```sh
cd frontend
npm run dev
```

El frontend queda disponible en:

```txt
http://localhost:3000
```

Al cargar, muestra por defecto el perfil de `pedrocrack05`. También permite buscar cualquier perfil público de GitHub usando el endpoint del backend.

Si el usuario buscado no existe, la interfaz muestra un mensaje y vuelve a mostrar el perfil predeterminado.

## Variables de entorno opcionales

Frontend:

```txt
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_GITHUB_USERNAME=pedrocrack05
```

Backend:

```txt
PORT=3001
FRONTEND_ORIGIN=http://localhost:3000
```

## Scripts útiles

Desde la raíz:

```sh
npm run build
```

Compila backend y frontend.

```sh
npm run dev:backend
npm run dev:frontend
```

Ejecutan cada aplicación desde el workspace raíz.

## Estructura

```txt
.
├── backend/
│   └── src/
├── frontend/
│   └── src/app/
├── package.json
└── README.md
```
