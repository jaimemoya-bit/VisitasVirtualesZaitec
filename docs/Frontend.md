# Documentación del Frontend - Visitas Virtuales

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Tecnologías Utilizadas](#tecnologías-utilizadas)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Instalación y Configuración](#instalación-y-configuración)
5. [Ejecutar el Proyecto](#ejecutar-el-proyecto)
6. [Arquitectura de la Aplicación](#arquitectura-de-la-aplicación)
7. [Rutas de la Aplicación](#rutas-de-la-aplicación)
8. [Componentes Principales](#componentes-principales)
9. [Páginas](#páginas)
10. [Contextos y Estado](#contextos-y-estado)
11. [Custom Hooks](#custom-hooks)
12. [Helpers y Utilidades](#helpers-y-utilidades)
13. [Estilos](#estilos)
14. [API y Endpoints](#api-y-endpoints)
15. [Variables de Entorno](#variables-de-entorno)

---

## 1. Introducción

Este proyecto es el frontend de una aplicación de visitas virtuales educativas que permite a usuarios (administradores, profesores e invitados) explorar centros educativos a través de recorridos virtuales 360°. La aplicación está construida con React y utiliza diversas tecnologías modernas para proporcionar una experiencia de usuario fluida e interactiva.

**Repositorio**: Visitas Virtuales Zaitec  
**Versión**: 0.0.0

---

## 2. Tecnologías Utilizadas

### Frameworks y Librerías Principales

| Tecnología        | Versión | Descripción                                                       |
| ----------------- | ------- | ----------------------------------------------------------------- |
| React             | 19.2.4  | Librería principal para la construcción de la interfaz de usuario |
| React Router DOM  | 7.13.2  | Enrutamiento de la aplicación                                     |
| Vite              | 8.0.1   | Herramienta de construcción y desarrollo rápido                   |
| Tailwind CSS      | 4.2.2   | Framework de estilos CSS                                          |
| React Unity WebGL | 10.1.6  | Integración de Unity WebGL en React                               |
| Recharts          | 3.8.1   | Librería para gráficos                                            |
| Sonner            | 2.0.7   | Sistema de notificaciones toast                                   |
| Lucide React      | 1.6.0   | Iconos                                                            |

### Herramientas de Desarrollo

| Tecnología | Versión | Descripción                |
| ---------- | ------- | -------------------------- |
| ESLint     | 9.0.0   | Linter para JavaScript/JSX |
| Prettier   | 3.8.3   | Formateador de código      |
| PostCSS    | -       | Procesador de CSS          |

---

## 3. Estructura del Proyecto

```
visitas-virtuales/
├── public/                  # Archivos públicos estáticos
├── src/
│   ├── assets/              # Imágenes y archivos estáticos
│   │   ├── App.css          # Estilos globales
│   │   ├── Login.css        # Estilos del componente Login
│   │   └── *.jpg, *.png     # Imágenes del proyecto
│   │
│   ├── components/          # Componentes reutilizables
│   │   ├── settings/        # Componentes de configuración
│   │   │   ├── CenterImageForm.jsx
│   │   │   ├── SettingsItemWrapper.jsx
│   │   │   └── UserProfileForm.jsx
│   │   │
│   │   ├── Button.jsx           # Componente de botón
│   │   ├── CenterSelectButton.jsx
│   │   ├── ClickOutsideWrapper.jsx
│   │   ├── Crud.jsx             # Componente de gestión CRUD
│   │   ├── DropdownItem.jsx
│   │   ├── Input.jsx            # Componente de input
│   │   ├── LoadingPage.jsx      # Pantalla de carga
│   │   ├── Login.jsx            # Formulario de login
│   │   ├── ProtectedRoute.jsx   # Ruta protegida
│   │   ├── Select.jsx           # Componente de selección
│   │   ├── Sidebar.jsx          # Barra lateral
│   │   ├── SidebarItem.jsx      # Elemento del sidebar
│   │   ├── TopHeader.jsx        # Encabezado superior
│   │   ├── UnityViewer.jsx      # Visor de Unity
│   │   └── UserDropdown.jsx    # Menú desplegable de usuario
│   │
│   ├── context/             # Contextos de React
│   │   ├── AuthContext.js      # Contexto de autenticación
│   │   ├── AuthProvider.jsx    # Proveedor de autenticación
│   │   ├── CenterContext.js    # Contexto de centros
│   │   └── CenterProvider.jsx  # Proveedor de centros
│   │
│   ├── helpers/             # Funciones utilitarias
│   │   ├── authLocalStorage.js    # Manejo de auth en localStorage
│   │   ├── centerLocalStorage.js  # Manejo de centros en localStorage
│   │   ├── escenas.js            # Configuración de escenas
│   │   ├── fetchWithAuth.js      # Fetch con autenticación
│   │   └── fetchWithTimeout.js   # Fetch con timeout
│   │
│   ├── hooks/               # Custom Hooks
│   │   ├── useAuth.js           # Hook de autenticación
│   │   ├── useCenter.js         # Hook de centros
│   │   ├── useCenterQuery.js    # Hook de consulta de centros
│   │   └── useWindowSize.js     # Hook para tamaño de ventana
│   │
│   ├── pages/               # Páginas de la aplicación
│   │   ├── CenterSelectionPage.jsx  # Selección de centros
│   │   ├── Dashboard.jsx            # Panel de administración
│   │   ├── Historial.jsx            # Historial de visitas
│   │   ├── LandingPage.jsx          # Página de inicio
│   │   ├── ListPois.jsx             # Lista de POIs
│   │   ├── Settings.jsx             # Configuración
│   │   └── Viewer.jsx               # Visor de tour virtual
│   │
│   ├── App.jsx              # Componente principal de la app
│   └── main.jsx             # Punto de entrada
│
├── .env                     # Variables de entorno
├── .eslintrc.js              # Configuración de ESLint
├── .prettierrc              # Configuración de Prettier
├── index.html               # HTML principal
├── package.json              # Dependencias y scripts
├── postcss.config.cjs       # Configuración de PostCSS
├── tailwind.config.js       # Configuración de Tailwind
└── vite.config.js           # Configuración de Vite
```

---

## 4. Instalación y Configuración

### Paso 1: Requisitos Previos

Asegúrate de tener instalado:

- **Node.js** (versión 18 o superior)
- **npm** o **yarn**

Para verificar la versión de Node.js:

```bash
node --version
```

### Paso 2: Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd visitas-virtuales
```

### Paso 3: Instalar Dependencias

```bash
npm install
```

Este comando instalará todas las dependencias listed en `package.json`:

- React y React DOM
- React Router DOM
- Tailwind CSS y plugins
- Herramientas de desarrollo (ESLint, Prettier, etc.)

### Paso 4: Configurar Variables de Entorno

El proyecto incluye un archivo `.env` en la raíz. Las variables de entorno típicas incluyen:

```
VITE_API_URL=<URL del API backend>
```

**Nota**: Consulta el archivo `.env` actual para ver las configuraciones específicas.

---

## 5. Ejecutar el Proyecto

### Modo Desarrollo

Para iniciar el servidor de desarrollo:

```bash
npm run dev
```

Esto ejecutará Vite en modo desarrollo. Por defecto, el servidor está disponible en:

```
http://localhost:5173
```

### Modo Desarrollo con Host

Para ejecutar en una red local (accesible desde otros dispositivos):

```bash
npm run host
```

### Generar Build de Producción

Para crear una versión optimizada para producción:

```bash
npm run build
```

El build se generará en la carpeta `dist/`.

### Vista Previa del Build

Para ver el build de producción localmente:

```bash
npm run preview
```

### Linting

Para verificar el código con ESLint:

```bash
npm run lint
```

### Formateo de Código

Para formatear el código con Prettier:

```bash
npm run format
```

---

## 6. Arquitectura de la Aplicación

### Patrón de Componentes

La aplicación sigue un patrón de componentes funcionales con Hooks de React. La estructura de datos fluye de la siguiente manera:

```
main.jsx
    └── BrowserRouter
            └── AuthProvider
                    └── CenterProvider
                            └── App
                                    └── Routes
                                            ├── LandingPage
                                            ├── Login
                                            ├── CenterSelectionPage
                                            ├── Viewer
                                            ├── Dashboard (admin)
                                            ├── ListPois (admin/teacher)
                                            ├── Crud (admin/teacher)
                                            ├── Settings (admin/teacher)
                                            └── Historial (admin)
```

### Flujo de Autenticación

1. El usuario accede a la aplicación
2. `AuthProvider` verifica si existe un token en localStorage
3. Si existe un token válido, se carga el perfil del usuario
4. Si no existe o está expirado, se muestra la página pública
5. El usuario puede iniciar sesión mediante el formulario de login

### Flujo de Centros

1. `CenterProvider` carga la lista de centros desde el API
2. El usuario selecciona un centro en `CenterSelectionPage`
3. El centro seleccionado se guarda en localStorage
4. El centro seleccionado está disponible globalmente mediante el contexto

---

## 7. Rutas de la Aplicación

La aplicación define las siguientes rutas en `App.jsx`:

| Ruta         | Componente          | Acceso        | Descripción                                   |
| ------------ | ------------------- | ------------- | --------------------------------------------- |
| `/`          | LandingPage         | Público       | Página de inicio con información del proyecto |
| `/login`     | Login               | Público       | Formulario de inicio de sesión                |
| `/centros`   | CenterSelectionPage | Público       | Lista de centros disponibles                  |
| `/viewer`    | Viewer              | Público/Auth  | Visor del tour virtual 360°                   |
| `/listpois`  | ListPois            | Admin/Teacher | Lista de puntos de interés                    |
| `/crud`      | Crud                | Admin/Teacher | Gestión de POIs (crear, editar, eliminar)     |
| `/dashboard` | Dashboard           | Solo Admin    | Panel de estadísticas y métricas              |
| `/settings`  | Settings            | Admin/Teacher | Configuración de usuario y centro             |
| `/historial` | Historial           | Solo Admin    | Historial de visitas de usuarios              |
| `*`          | -                   | Todas         | Redirección a `/`                             |

### Protección de Rutas

Algunas rutas están protegidas mediante el componente `ProtectedRoute`:

- `/dashboard` - Solo accesible para usuarios con rol `admin`
- `/listpois`, `/crud`, `/settings` - Accesible para `admin` y `teacher`
- `/historial` - Solo accesible para usuarios con rol `admin`

---

## 8. Componentes Principales

### Componentes de Layout

#### TopHeader.jsx

- **Ubicación**: `src/components/TopHeader.jsx`
- **Descripción**: Encabezado superior de la aplicación
- **Props**:
  - `onMenuClick`: Función para abrir el menú móvil
  - `isLog`: Booleano que indica si el usuario está logueado
  - `onLogout`: Función para cerrar sesión
  - `userName`, `userEmail`, `userImg`, `role`: Datos del usuario

#### Sidebar.jsx

- **Ubicación**: `src/components/Sidebar.jsx`
- **Descripción**: Barra lateral de navegación
- **Props**:
  - `isMobileMenuOpen`: Estado del menú móvil
  - `setIsMobileMenuOpen`: Función para controlar el menú

#### ProtectedRoute.jsx

- **Ubicación**: `src/components/ProtectedRoute.jsx`
- **Descripción**: Componente para proteger rutas según el rol del usuario
- **Props**:
  - `requiredRoles`: Array de roles permitidos

### Componentes de Formulario

#### Login.jsx

- **Ubicación**: `src/components/Login.jsx`
- **Descripción**: Formulario de inicio de sesión
- **Funcionalidad**:
  - Validación de credenciales
  - Llamada al API de autenticación
  - Redirección según el rol del usuario

#### Input.jsx

- **Ubicación**: `src/components/Input.jsx`
- **Descripción**: Campo de entrada reutilizable
- **Props**:
  - `type`: Tipo de input
  - `name`, `value`, `onChange`: Control del valor
  - `placeholder`, `label`, `error`: Personalización

#### Button.jsx

- **Ubicación**: `src/components/Button.jsx`
- **Descripción**: Botón reutilizable
- **Props**:
  - `variant`: Variante visual ('primary', 'secondary', etc.)
  - `size`: Tamaño ('small', 'normal', 'large')
  - `type`: Tipo de botón ('button', 'submit', 'reset')

### Componentes Especiales

#### UnityViewer.jsx

- **Ubicación**: `src/components/UnityViewer.jsx`
- **Descripción**: Componente para mostrar el tour virtual de Unity WebGL
- **Funcionalidad**:
  - Carga de scenes 3D de Unity
  - Navegación entre diferentes ubicaciones
  - Integración de puntos de información (POIs)

#### Crud.jsx

- **Ubicación**: `src/components/Crud.jsx`
- **Descripción**: Componente de gestión CRUD para POIs
- **Funcionalidad**:
  - Crear nuevos puntos de interés
  - Editar puntos existentes
  - Eliminar puntos
  - Gestionar información multimedia

---

## 9. Páginas

### LandingPage.jsx

- **Ubicación**: `src/pages/LandingPage.jsx`
- **Descripción**: Página de inicio pública
- **Contenido**:
  - Navbar con logo y botón de login
  - Hero section con imagen de fondo
  - Cards informativas sobre las características
  - Sección del equipo de desarrollo
- **Acceso**: Público (sin autenticación)

### Login.jsx

- **Ubicación**: `src/components/Login.jsx` ( también en pages )
- **Descripción**: Página de autenticación
- **Funcionalidad**:
  - Formulario con email y contraseña
  - Validación de credenciales
  - Manejo de errores
  - Redirección tras login exitoso

### CenterSelectionPage.jsx

- **Ubicación**: `src/pages/CenterSelectionPage.jsx`
- **Descripción**: Página para seleccionar un centro educativo
- **Funcionalidad**:
  - Lista de centros disponibles
  - Cards con información de cada centro
  - Selección de centro para acceder al viewer
- **Acceso**: Público

### Viewer.jsx

- **Ubicación**: `src/pages/Viewer.jsx`
- **Descripción**: Visor del tour virtual 360°
- **Funcionalidad**:
  - Integración con Unity WebGL
  - Navegación por las diferentes escenas
  - Puntos de información interactivos
  - Reproducción de videos y contenido multimedia
- **Acceso**: Público (requiere tener un centro seleccionado)

### Dashboard.jsx

- **Ubicación**: `src/pages/Dashboard.jsx`
- **Descripción**: Panel de administración y estadísticas
- **Funcionalidad**:
  - Gráficos de visitas por centro
  - Estadísticas de usuarios activos
  - Métricas de uso de la plataforma
- **Acceso**: Solo admin

### ListPois.jsx

- **Ubicación**: `src/pages/ListPois.jsx`
- **Descripción**: Lista de puntos de interés (POIs)
- **Funcionalidad**:
  - Visualización de todos los POIs
  - Información de cada punto
  - Acceso a la edición
- **Acceso**: Admin y Teacher
- **Props**: `centerId` - ID del centro seleccionado

### Settings.jsx

- **Ubicación**: `src/pages/Settings.jsx`
- **Descripción**: Página de configuración
- **Funcionalidad**:
  - Configuración del perfil de usuario
  - Gestión de imagen del centro
  - Preferencias de la aplicación
- **Acceso**: Admin y Teacher

### Historial.jsx

- **Ubicación**: `src/pages/Historial.jsx`
- **Descripción**: Historial de visitas de usuarios
- **Funcionalidad**:
  - Registro de todas las visitas
  - Filtrado por fecha, usuario, centro
  - Información detallada de cada visita
- **Acceso**: Solo admin

---

## 10. Contextos y Estado

### AuthContext y AuthProvider

**Ubicación**: `src/context/AuthContext.js` y `src/context/AuthProvider.jsx`

**Funcionalidad**:

- Gestión del estado de autenticación
- almacenamiento del token de acceso
- Renovación automática de tokens
- Carga del perfil del usuario
- Control de acceso según roles

**Estado proporcionado**:

```javascript
{
  user: Object,        // Perfil del usuario
  isAdmin: Boolean,   // true si el rol es 'admin'
  isTeacher: Boolean, // true si el rol es 'teacher'
  login: Function,    // Función para iniciar sesión
  logout: Function,   // Función para cerrar sesión
  fetchProfile: Function, // Cargar perfil
  isInitialLoading: Boolean // Estado de carga inicial
}
```

### CenterContext y CenterProvider

**Ubicación**: `src/context/CenterContext.js` y `src/context/CenterProvider.jsx`

**Funcionalidad**:

- Gestión de la lista de centros
- Selección del centro activo
- Sincronización con localStorage
- Actualización de imágenes de centros

**Estado proporcionado**:

```javascript
{
  allCenters: Array,      // Lista de todos los centros
  selectedCenter: Object, // Centro seleccionado actualmente
  isCentersLoading: Boolean,
  centersError: String,
  fetchCenters: Function,
  saveAllCenters: Function,
  saveSelectedCenter: Function,
  updateCenterImage: Function
}
```

---

## 11. Custom Hooks

### useAuth.js

- **Ubicación**: `src/hooks/useAuth.js`
- **Descripción**: Hook para acceder al contexto de autenticación
- **Retorna**: El valor del AuthContext

### useCenter.js

- **Ubicación**: `src/hooks/useCenter.js`
- **Descripción**: Hook para acceder al contexto de centros
- **Retorna**: El valor del CenterContext

### useCenterQuery.js

- **Ubicación**: `src/hooks/useCenterQuery.js`
- **Descripción**: Hook para realizar consultas personalizadas de centros
- **Funcionalidad**:
  - Filtrado de centros
  - Búsqueda de centros por nombre
  - Obtención de centros por ID

### useWindowSize.js

- **Ubicación**: `src/hooks/useWindowSize.js`
- **Descripción**: Hook para obtener el tamaño de la ventana
- **Retorna**: `{ width, height }`

---

## 12. Helpers y Utilidades

### authLocalStorage.js

- **Ubicación**: `src/helpers/authLocalStorage.js`
- **Funciones**:
  - `setLocalStorageAccessToken(token)`: Guardar token
  - `getLocalStorageAccessToken()`: Obtener token
  - `removeLocalStorageAccessToken()`: Eliminar token
  - `isTokenExpired(token)`: Verificar si el token expiró
  - `getLocalStorageUser()`: Obtener usuario guardado
  - `setLocalStorageUser(user)`: Guardar usuario
  - `removeLocalStorageUser()`: Eliminar usuario

### centerLocalStorage.js

- **Ubicación**: `src/helpers/centerLocalStorage.js`
- **Funciones**:
  - `getLocalStorageAllCenters()`: Obtener todos los centros
  - `setLocalStorageAllCenters(centers)`: Guardar centros
  - `getLocalStorageSelectedCenter()`: Obtener centro seleccionado
  - `setLocalStorageSelectedCenter(center)`: Guardar centro seleccionado
  - `removeLocalStorageAllCenters()` / `removeLocalStorageSelectedCenter()`: Eliminar

### fetchWithAuth.js

- **Ubicación**: `src/helpers/fetchWithAuth.js`
- **Descripción**: Wrapper para fetch que incluye el token de autenticación

### fetchWithTimeout.js

- **Ubicación**: `src/helpers/fetchWithTimeout.js`
- **Descripción**: Wrapper para fetch con timeout configurable

### escenas.js

- **Ubicación**: `src/helpers/escenas.js`
- **Descripción**: Configuración de las escenas del tour virtual

---

## 13. Estilos

### Estilos Globales

- **App.css**: Estilos globales de la aplicación
- **Login.css**: Estilos específicos del componente de login

### Tailwind CSS

La aplicación utiliza Tailwind CSS para los estilos. La configuración está en:

- `tailwind.config.js`: Configuración principal
- `postcss.config.cjs`: Configuración de PostCSS

### Clases de Tailwind Utilizadas

El proyecto utiliza clases de Tailwind como:

- Layout: `flex`, `grid`, `w-full`, `h-screen`, `min-h-screen`
- Espaciado: `p-4`, `m-4`, `gap-4`, `mt-4`, `mb-4`
- Colores: `bg-white`, `text-gray-800`, `border-gray-300`
- Responsive: `md:`, `lg:`, `xl:`
- Estados: `hover:`, `focus:`, `active:`

---

## 14. API y Endpoints

La aplicación se comunica con el backend mediante fetch. Los endpoints típicos son:

| Endpoint                  | Método | Descripción                |
| ------------------------- | ------ | -------------------------- |
| `/api/users/auth/refresh` | POST   | Renovar token de acceso    |
| `/api/me`                 | GET    | Obtener perfil del usuario |
| `/api/centers`            | GET    | Obtener lista de centros   |
| `/api/users/auth/logout`  | POST   | Cerrar sesión              |

**Nota**: Los endpoints específicos pueden variar según la configuración del backend. Consulta la documentación del API para más detalles.

### Manejo de Errores

La aplicación maneja errores mediante:

- Try/catch en funciones asíncronas
- Notificaciones toast con Sonner
- Estados de error en los contextos

---

## 15. Variables de Entorno

El archivo `.env` en la raíz del proyecto contiene las variables de entorno. Las típicas incluyen:

```
VITE_API_URL=<URL del API>
```

**Nota**: Nunca compromisos el archivo `.env` con valores reales en el repositorio. Asegúrate de que esté en `.gitignore`.

---

## Comandos Rápidos

```bash
# Instalar dependencias
npm install

# Iniciar desarrollo
npm run dev

# Iniciar en red local
npm run host

# Build de producción
npm run build

# Vista previa del build
npm run preview

# Verificar código
npm run lint

# Formatear código
npm run format
```

---

## Notas Adicionales

1. **Navegador compatible**: La aplicación funciona en todos los navegadores modernos que soporten React 19 y WebGL.

2. **Unity WebGL**: El visor de tours virtuales requiere que el navegador soporte WebGL. El componente `UnityViewer` carga un build de Unity que debe estar disponible en la ruta configurada.

3. **Roles de usuario**:
   - **admin**: Acceso completo a todas las funcionalidades
   - **teacher**: Acceso a gestión de POIs y configuración
   - **invitado**: Acceso solo al viewer y selección de centros

4. **localStorage**: La aplicación utiliza localStorage para almacenar:
   - Token de acceso
   - Perfil del usuario
   - Lista de centros
   - Centro seleccionado

5. **Toasts**: Las notificaciones se manejan con la librería Sonner, configurada en `App.jsx`.

---

## Equipo de Desarrollo

El proyecto fue desarrollado por un equipo de estudiantes de formación profesional:

- **Alexis** - Fullstack Developer
- **Bruno** - Fullstack Developer
- **Flor** - Unity Developer
- **Jennifer** - Fullstack Developer
- **Orlando** - Fullstack Developer
- **Pablo De Galvez** - Fullstack Developer
- **Pablo Villena** - Fullstack Developer
- **Jose Luis** - Fullstack Developer
- **Fermin** - Unity Developer

---

_Documentación generada para el proyecto Visitas Virtuales Zaitec - Frontend_
