cd# Arquitectura de VisitasVirtuales

## Vision General

VisitasVirtuales es una aplicacion full-stack que permite crear y experimentar visitas virtuales interactivas de espacios fisicos. La arquitectura se divide en tres componentes principales: **Frontend** (interfaz de usuario), **Backend** (API REST), y **Motor 3D** (Unity WebGL).

---

## Componentes del Sistema

### 1. Frontend (visitas-virtuales)

Tecnologias: React 19 + Vite + Tailwind CSS

El frontend es una aplicacion web React que sirve como interfaz principal para los usuarios. Utiliza:

- **React Router DOM**: Navegacion entre paginas de la aplicacion
- **React Unity WebGL**: Integracion del contenido 3D generado en Unity
- **Recharts**: Visualizacion de estadisticas y datos
- **Tailwind CSS**: Estilizado de componentes
- **Sonner**: Sistema de notificaciones

Estructura del codigo:

```
src/
├── assets/       # Recursos estaticos
├── components/   # Componentes reutilizables
├── context/     # Estado global (React Context)
├── helpers/      # Funciones utilitarias
├── hooks/        # Custom React hooks
└── pages/       # Paginas principales
```

### 2. Backend (visitas-virtuales-api)

Tecnologias: Express 5 + Drizzle ORM + PostgreSQL

El backend es una API REST construida con Express que maneja toda la logica de negocio, autenticacion y persistencia de datos. Utiliza:

- **Drizzle ORM**: Mapeo objeto-relacional para base de datos
- **PostgreSQL**: Base de datos principal
- **MinIO**: Almacenamiento de objetos (archivos, imagenes)
- **JWT**: Autenticacion basada en tokens
- **Swagger/OpenAPI**: Documentacion de la API
- **Zod**: Validacion de esquemas

Estructura del codigo:

```
src/
├── controllers/   # Logica de controladores
├── db/           # Configuracion y esquemas de base de datos
├── helpers/       # Funciones utilitarias
├── jobs/         # Tareas programadas
├── middlewares/  # Middlewares de Express
├── routes/       # Definicion de rutas
└── services/     # Logica de negocio
```

### 3. Motor 3D (Unity)

Tecnologias: Unity + WebGL + C#

El componente Unity genera contenido 3D interactivo que se carga en el frontend mediante WebGL. Los scripts C# incluyen:

- **SceneManager**: Gestion de escenas 3D
- **POITextManager**: Gestion de puntos de interes (POI)
- **JsonLoader**: Carga de datos JSON desde el backend
- **WebBridge**: Comunicacion entre Unity y el navegador
- **POIData/POIText**: Modelos de datos para POIs

---

## Conexiones entre Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                         Navegador                               │
│  ┌─────────────────────┐        ┌─────────────────────────────┐  │
│  │   Frontend React   │        │     Unity WebGL (iframe)  │  │
│  │   (Puerto 5173)   │◄──────►│    C# Scripts + JS Lib   │  │
│  └─────────┬─────────┘        └──────────┬──────────────┘  │
│            │                             │                    │
│            │       REST API              │   WebBridge       │
│            │     (Puerto 8000)           │   (postMessage)   │
└────────────┼─────────────────────────────┼────────────────────┘
             │                             │
             ▼                             ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend API                            │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐  │
│  │  Express   │  │   Drizzle   │  │       MinIO         │  │
│  │  Server    │─►│  (PostgreSQL│  │   (Object Storage)   │  │
│  └─────────────┘  └─────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Datos

1. **Usuario → Frontend**: El usuario interactua con la interfaz React
2. **Frontend → Backend**: Las peticiones REST se envian al API Express
3. **Backend → Base de Datos**: Drizzle ORM traduce las peticiones a SQL
4. **Backend → MinIO**: Archivos y medios se almacenan en MinIO
5. **Frontend → Unity**: El contenido 3D se carga via React Unity WebGL
6. **Unity ↔ Frontend**: Comunicacion via WebBridge (postMessage)

### Puertos y Servicios

| Componente    | Puerto | Descripcion                 |
| ------------- | ------ | --------------------------- |
| Frontend Dev  | 5173   | Servidor de desarrollo Vite |
| Frontend Prod | 4173   | Servidor de preview Vite    |
| API REST      | 8000   | Servidor Express            |
| PostgreSQL    | 5432   | Base de datos               |
| MinIO         | 9000   | Almacenamiento de objetos   |
| MinIO Console | 9001   | Interfaz administrativa     |

---

## Despliegue

La aplicacion se despliega utilizando Docker Compose:

- **Desarrollo**: `docker-compose.yml` con servicios de desarrollo
- **Staging**: `docker-compose.stage.yml` para pruebas
- **Produccion**: `docker-compose.prod.yml` para produccion

Cada entorno tiene su propio archivo de variables de entorno (`.env`, `.env.stage`, `.env.prod`).

---

## Seguridad

- Autenticacion JWT en todas las rutas protegidas
- Helmet para encabezados de seguridad HTTP
- Rate limiting para prevenir ataques de fuerza bruta
- Validacion de entrada con Zod
- Hash de contrasenas con bcrypt

---

## Contribuir

Para contribuir al proyecto, asegura ejecutar:

```bash
# Frontend
npm run lint    # Verificar codigo
npm run build   # Compilar para produccion

# Backend
npm run build   # Compilar TypeScript
npm run db:migrate  # Aplicar migraciones
```
