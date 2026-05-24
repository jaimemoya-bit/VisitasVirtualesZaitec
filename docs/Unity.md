# Unity — Documentación visitas virtuales

## Índice

1. [Visión general](#1-visión-general)
2. [Escenas y Build Settings](#2-escenas-y-build-settings)
3. [Scripts C#](#3-scripts-c--qué-hace-cada-uno)
4. [Modo edición de administrador](#4-modo-edición-de-administrador)
5. [Puente React ↔ Unity](#4-puente-react--unity)
6. [Comunicación con la API](#5-comunicación-con-la-api)
7. [Compilar el build WebGL](#6-cómo-compilar-el-build-webgl)
8. [Añadir un centro nuevo](#7-añadir-un-centro-nuevo)
9. [Control de versiones](#8-control-de-versiones)

---

## 1. Visión general

El módulo de Unity es un build WebGL que se embebe dentro de la aplicación web React. No es una app independiente depende de React para saber qué centro educativo tiene que mostrar.

El flujo general:

```
Usuario elige un centro 
  → React envía el ID del centro, el índice de escena y el rol del usuario a Unity vía SendMessage
  → Unity (escena Bootstrap) recibe los IDs y carga la escena correspondiente
  → La escena del centro arranca, JsonLoader se autentica en la API y carga los POIs
  → Los textos de los puntos de interés se muestran en la visita 360°
  → Si el usuario es admin, se activa el Canvas_Admin con el editor de POIs
```

El build WebGL se encuentra como archivos estáticos desde la carpeta `visitas-virtuales/public/Build_Unity/` del frontend.

-- 

## 2. Escenas y Build Settings
 
El proyecto Unity contiene las siguientes escenas, que deben estar en este orden exacto en el momento de compilar en Unity, en la de parte de **File → Build Settings**:
 
| Índice | Nombre | Centro educativo |
|--------|--------|-----------------|
| 0 | Bootstrap | Pantalla de arranque (negra). 
  -    Contiene el GameObject `WebBridge` que recibe los IDs desde React y carga la escena correcta. |
| 1 | Madrid | Instituto Madrid |
| 2 | Córdoba | Instituto Córdoba |
| 3 | Jerez | Instituto Jerez |
| 4 | Pacífico | Instituto Pacífico |
 
Este orden se refleja en el mapeo definido en `visitas-virtuales/src/helpers/escenas.js`:
 
```js
export const ESCENAS_POR_CENTRO = {
    1: 1, // Instituto Madrid   → Escena 1
    2: 4, // Instituto Pacífico → Escena 4
    3: 3, // Instituto Jerez    → Escena 3
    4: 2, // Instituto Córdoba  → Escena 2
};
```
 
> **El orden de las escenas es crítico.** El índice que aparece en Build Settings tiene que coincidir exactamente con el mapeo de `escenas.js`. Si se añade una escena nueva en el medio de la lista, los índices de las escenas siguientes se desplazan y hay que actualizar ese archivo también.
 
--

## 3. Scripts C# — qué hace cada uno

Todos los scripts están en `Assets/Scripts/` dentro del proyecto Unity, usando el 'Unity Control Version' -Plastic SCM- y también en la carpeta `Unity/` del repositorio Git como referencia.

### `WebBridge.cs`

**Ubicación en escena:** GameObject `WebBridge` en la escena **Bootstrap** (índice 0) y en cada escena de centro.

Punto de entrada de la comunicación desde React. Recibe mensajes de JavaScript mediante `SendMessage` y expone variables estáticas que persisten entre cambios de escena.

**Métodos que llama React:**

| Método                      | Parámetro                | Descripción                         |
|-----------------------------|--------------------------|-------------------------------------|
| `RecibirIdCentro(string)`   | ID numérico del centro   | Ej: `"1"` para Madrid               |
| `RecibirIdEscena(string)`   | Índice de escena Unity   | Ej: `"1"`                           |
| `RecibirRolUsuario(string)` | Rol del usuario logueado | `"admin"`, `"profesor"` o `"guest"` |

Cuando llegan `RecibirIdCentro` y `RecibirIdEscena`, carga la escena automáticamente. `RecibirRolUsuario` se usa para activar el modo edición si el rol es admin.

**Variables estáticas accesibles desde otros scripts:**

```csharp
WebBridge.IdCentroActual   // ID del centro como string
WebBridge.IdEscenaActual   // Índice de escena como string
WebBridge.RolUsuario       // Rol del usuario: "admin", "profesor" o "guest"
WebBridge.ModoEdicionActual // true si el admin ha activado el modo editor
WebBridge.UserIdActual     // ID del usuario admin logueado
```

### `JsonLoader.cs`

**Ubicación en escena:** GameObject `DataManager` en cada escena de centro.

Se encarga de autenticarse en la API REST y cargar los POIs del centro. Se ejecuta automáticamente al arrancar la escena.

**Flujo de ejecución:**

1. Lee `WebBridge.IdCentroActual`. Si no hay valor (pruebas en Editor), usa el campo `Id Centro` del Inspector.
2. Hace un `POST` a `/api/v1/users/auth` para obtener un token JWT.
3. Con ese token, hace un `GET` a `/api/v1/centers/{idCentro}/pois` para obtener los POIs.
4. Actualiza los textos de la UI con nombre y descripción de cada POI.
5. Repite la petición cada 30 segundos (configurable en el Inspector).
6. Si el token expira (respuesta 403), renueva el login automáticamente.

**Métodos públicos disponibles para otros scripts:**

```csharp
jsonLoader.ObtenerToken()      // Devuelve el token JWT actual
jsonLoader.ObtenerIdCentro()   // Devuelve el ID del centro como int
jsonLoader.RecargarPois()      // Fuerza una recarga inmediata de POIs desde la API
jsonLoader.ObtenerTotalPois()  // Devuelve el número de POIs cargados
```

> **Nota para pruebas en Editor:** El campo `Id Centro` del Inspector actúa como fallback. Configurarlo con el ID real del centro permite probar sin pasar por React.


### `EditorPois.cs`

**Ubicación en escena:** GameObject `Canvas_Admin` en cada escena de centro.

Controlador principal del modo edición de POIs para administradores. Solo se activa si `WebBridge.ModoEdicionActual` es `true`.

Autodetecta todas sus referencias UI por nombre en la jerarquía del Canvas al arrancar, no requiere asignaciones manuales en el Inspector salvo `prefabItemPoi`.

**Nombres de GameObjects que busca en la jerarquía:**

| Nombre esperado       | Tipo          | Función                                   |
|-----------------------|---------------|-------------------------------------------|
| `PanelIzquierdo`      | GameObject    | Sidebar izquierda con botones de tipo POI |
| `BtnToggleIzquierdo`  | Button        | Muestra/oculta el panel izquierdo |
| `PanelDerecho`        | GameObject    | Sidebar derecha con listado de POIs |
| `ContenedorListaPois` | Transform     | Contenedor donde se instancian los ítems del listado |
| `PanelConfirmar`      | GameObject    | Panel de confirmación para POI de texto |
| `PanelConfirmarImagen`| GameObject    | Panel de confirmación para POI de imagen |
| `InputNombre`         | TMP_InputField| Nombre del POI de texto |
| `InputNombreImagen`   | TMP_InputField| Nombre del POI de imagen |
| `InputUrlImagen`      | TMP_InputField| URL de la imagen en MinIO |
| `BtnConfirmar`        | Button        | Confirma creación del POI de texto |
| `BtnCancelar`         | Button        | Cancela creación del POI de texto |
| `BtnConfirmarImagen`  | Button        | Confirma creación del POI de imagen |
| `BtnCancelarImagen`   | Button        | Cancela creación del POI de imagen |

**Referencia que sí requiere asignación manual en el Inspector:**

- `Prefab Item Poi` → prefab del ítem que se instancia en el listado de la barra derecha.

### `DragDropPois.cs`

**Ubicación en escena:** mismo GameObject que `EditorPois` (`Canvas_Admin`). Hereda de `EditorPois`.

Gestiona el sistema de arrastrar y soltar para colocar POIs en la escena 360. Al soltar un POI dentro del visor, captura las coordenadas normalizadas (0-1) y muestra el panel de confirmación correspondiente según el tipo.

**Referencias que requieren asignación manual en el Inspector:**

- `Prefab Ghost` → prefab visual que sigue al cursor durante el arrastre.
- `Zona Drop Visor` → RectTransform transparente que cubre el área del visor 360.

**Métodos públicos — se conectan en el Inspector mediante OnClick:**

```csharp
DragDropPois.IniciarArrastre("basico")  // Botón POI texto → OnClick
DragDropPois.IniciarArrastre("imagen")  // Botón POI imagen → OnClick
```

### `SceneManager.cs` (SceneTextManager)

Gestor alternativo de textos basado en archivos JSON locales o remotos. En el build WebGL actual no se usa directamente — los textos los gestiona `JsonLoader` desde la API. Disponible como alternativa basada en JSON estático.

### `POIData.cs`

Clase de datos serializable que define la estructura de un POI cuando se lee desde JSON local. Contiene hasta 10 campos de texto (`p1` a `p10`).

### `PoiText.cs` y `PoiTextData.cs`

Componentes que representan un punto de interés en la escena. `PoiText` se adjunta a objetos 3D que actúan como POIs y expone `SetText(string)` para aplicar texto según ID.


### `POITextManager.cs`

Gestor alternativo de textos que usa `File.ReadAllText()`. **No funciona en WebGL** ya que ese entorno no permite acceso directo al sistema de archivos. Mantenido por compatibilidad con builds de escritorio.

## 4. Modo edición de administrador

  Cuando un usuario con rol `admin` accede a la visita virtual, React activa el modo edición enviando el rol a Unity. Esto habilita el `Canvas_Admin` con las herramientas de gestión de POIs.

  ### Estructura del Canvas_Admin

    ```
    Canvas_Admin  (componente DragDropPois)
    ├── PanelIzquierdo          ← sidebar izquierda, toggle-able
    │   ├── BtnPoiTexto         → IniciarArrastre("basico")
    │   └── BtnPoiImagen        → IniciarArrastre("imagen")
    ├── BtnToggleIzquierdo      ← muestra/oculta PanelIzquierdo
    ├── PanelDerecho            ← listado de POIs existentes
    │   └── ContenedorListaPois ← ítems instanciados dinámicamente
    ├── PanelConfirmar          ← aparece al soltar un POI de texto
    │   ├── InputNombre
    │   ├── BtnConfirmar
    │   └── BtnCancelar
    ├── PanelConfirmarImagen    ← aparece al soltar un POI de imagen
    │   ├── InputNombreImagen
    │   ├── InputUrlImagen
    │   ├── BtnConfirmarImagen
    │   └── BtnCancelarImagen
    └── ZonaDropVisor           ← RectTransform invisible sobre el visor 360
    ```

  ### Flujo de creación de un POI

    ```
    Admin pulsa BtnPoiTexto o BtnPoiImagen
    → IniciarArrastre() activa el ghost visual y desactiva la cámara
    → Admin arrastra el ghost sobre el visor 360
    → Al soltar dentro de ZonaDropVisor, se capturan coordenadas normalizadas (0-1)
    → Aparece PanelConfirmar o PanelConfirmarImagen según el tipo
    → Admin escribe el nombre y pulsa Confirmar
    → POST a /api/v1/centers/{id}/pois con nombre, tipo y coordenadas
    → JsonLoader recarga los POIs automáticamente
    ```

  ### Tipos de POI

    | Tipo  | Valor en API | Panel que abre |
    |------ |--------------|----------------|
    | Texto | `"basico"`   | PanelConfirmar |
    | Imagen| `"imagen"`   | PanelConfirmarImagen |

> **Nota:** Las imágenes de los POIs de tipo imagen se gestionan desde el panel web de React y se almacenan en MinIO. Unity solo registra la posición y el nombre del POI.

       
## 5. Puente React ↔ Unity
 
La comunicación de React hacia Unity se realiza mediante `SendMessage`:

```js
unityInstance.SendMessage('NombreGameObject', 'NombreMetodo', 'valor');
```

**Llamadas que hace React al cargar el visor:**

```js
// Enviadas desde UnityViewer.jsx tras un delay de 1.5s
unityInstance.SendMessage('WebBridge', 'RecibirIdCentro', centroId.toString());
unityInstance.SendMessage('WebBridge', 'RecibirIdEscena', escenaId.toString());
unityInstance.SendMessage('WebBridge', 'RecibirRolUsuario', rol); // "admin", "profesor" o "guest"
```

> El delay de 1.5 segundos es necesario porque aunque el JavaScript de Unity termina de cargar, los GameObjects de Bootstrap todavía no están inicializados. Sin él, `SendMessage` falla con `object WebBridge not found`.

 
## 6. Comunicación con la API
 
`JsonLoader` y `EditorPois` se comunican con la API REST usando `UnityWebRequest` con autenticación JWT.

**Endpoint de login:**
```
POST https://visitasvirtuales.dedyn.io/api/v1/users/auth
Content-Type: application/json

{ "email": "admin@instituto.es", "password": "password" }
```

**Endpoint de POIs (lectura):**
```
GET https://visitasvirtuales.dedyn.io/api/v1/centers/{idCentro}/pois
Authorization: Bearer {accessToken}
```

**Endpoint de creación de POI:**
```
POST https://visitasvirtuales.dedyn.io/api/v1/centers/{idCentro}/pois
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "Nombre del POI",
  "details": {
    "description": "",
    "posX": 0.4239,
    "posY": 0.3558,
    "tipo": "basico"
  },
  "center_id": 1,
  "user_id": 1
}
```

**Endpoint de borrado de POI:**
```
DELETE https://visitasvirtuales.dedyn.io/api/v1/centers/{idCentro}/pois/{idPoi}
Authorization: Bearer {accessToken}
```

**Respuesta esperada al listar POIs:**
```json
{
  "message": "OK",
  "pois": [
    {
      "id": 1,
      "name": "Entrada",
      "details": {
        "description": "Texto descriptivo",
        "posX": 0.42,
        "posY": 0.35,
        "tipo": "basico"
      },
      "centerId": 1,
      "userId": 1
    }
  ]
}
```

> **Nota sobre CORS:** Para que Unity WebGL pueda hacer peticiones a la API desde el navegador, el servidor debe permitir el origen del frontend en su configuración CORS.

--
 
## 7. Cómo compilar el build WebGL
 
1. Abrir el proyecto en **Unity 2022.3.62f3**.
2. Verificar el orden de escenas en **File → Build Settings** (ver sección 2).
3. Seleccionar la plataforma **WebGL**.
4. En **Player Settings → Publishing Settings → Compression Format** seleccionar **Disabled** (necesario para compatibilidad con Vite, en este proyecto).
5. Desmarcar **Development Build**.
6. Click en **Build** → seleccionar `visitas-virtuales/public/Build_Unity/` como destino.
**Archivos generados:**
 
| Archivo                       | ¿Va en Git? |
|-------------------------------|-------------|
| `Build_Unity.loader.js`       | Sí |
| `Build_Unity.framework.js`    | Sí |
| `Build_Unity.wasm`            | Sí |
| `Build_Unity.data` (>200MB)   | No, se distribuye por Google Drive |
 
> tras compilar, subir el WebGL a la carpeta **Build Unity** de Google Drive del equipo. Para probar en local, descargarlo y colocarlo en `visitas-virtuales/public/Build_Unity/`.
 
--
 
## 8. Añadir un centro nuevo
 
**En Unity:**
1. Crear la escena y añadirla al final en **File → Build Settings**. Anotar el índice asignado.
2. En la escena nueva, crear un GameObject vacío `DataManager` con el script `JsonLoader`. Configurar el campo `Id Centro` del Inspector.
3. Crear un GameObject `WebBridge` con el script `WebBridge.cs`.
4. Crear un GameObject `Canvas_Admin` con el script `DragDropPois` y asignar `Prefab Ghost` y `Zona Drop Visor` en el Inspector.
5. Recompilar el build y subir el nuevo a Google Drive.

**En React (`visitas-virtuales/src/helpers/escenas.js`):**
```js
export const ESCENAS_POR_CENTRO = {
    1: 1, // Instituto Madrid
    2: 4, // Instituto Pacífico
    3: 3, // Instituto Jerez
    4: 2, // Instituto Córdoba
    5: 5, // Instituto Nuevo → añadir con el índice real del build
};
```

 
**Verificar IDs en la base de datos:**
```sql
SELECT id, name FROM centers;
```
 
 
## 9. Control de versiones
 
El proyecto Unity se versiona con **Plastic SCM**, independientemente del repositorio Git del proyecto web.

### Plastic SCM
- **Repositorio:** `VisitasVirtuales-Proyecto360`
- Los cambios se guardan con **changesets** (equivalente a commits en Git).
- Los scripts C# están también en la carpeta `Unity/` del repositorio Git como referencia para el equipo web, pero la fuente está en Plastic SCM.

### Git
- **Repositorio:** [https://github.com/jaimemoya-bit/VisitasVirtualesZaitec](https://github.com/jaimemoya-bit/VisitasVirtualesZaitec)
- Los scripts C# de Unity se mantienen en la carpeta `Unity/` como referencia pero no se editan directamente desde aquí.

### Scripts en la carpeta `Unity/` del repo

| Archivo          | Descripción          |
|------------------|----------------------|
| `WebBridge.cs`   | Puente React ↔ Unity |
| `JsonLoader.cs`  | Carga y autenticación de POIs |
| `EditorPois.cs`  | Lógica del editor de admin |
| `DragDropPois.cs`| Sistema drag & drop de POIs |
| `SceneManager.cs`| Gestor alternativo de textos |
| `POIData.cs`     | Estructura de datos POI |
| `PoiText.cs`     | Componente POI en escena |
| `PoiTextData.cs` | Datos del componente POI |
| `POITextManager.cs` | Gestor de textos (solo escritorio) |
